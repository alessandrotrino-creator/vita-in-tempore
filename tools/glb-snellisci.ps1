# Alleggerisce un modello GLB per gli ambienti 3D (cartella modelli/):
#  - tiene solo le animazioni il cui nome corrisponde a -Keep (espressione regolare; vuoto = tutte)
#  - toglie i dati non più usati
#  - trasforma in JPEG (qualità -Q) le texture PNG dei materiali senza trasparenza
# Uso: powershell -File tools\glb-snellisci.ps1 -In orso.glb -Out modelli\orso.glb -Keep '^Walk$'
param([Parameter(Mandatory)][string]$In, [Parameter(Mandatory)][string]$Out, [string]$Keep = '', [int]$Q = 85)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$b = [IO.File]::ReadAllBytes((Resolve-Path $In))
if ([Text.Encoding]::ASCII.GetString($b, 0, 4) -ne 'glTF') { throw "Non è un file GLB" }
$jl = [BitConverter]::ToUInt32($b, 12)
$js = [Text.Encoding]::UTF8.GetString($b, 20, $jl) | ConvertFrom-Json
$bo = 20 + $jl; $binStart = $bo + 8; $binLen = [BitConverter]::ToUInt32($b, $bo)

# animazioni da tenere
$anims = @(); if ($js.animations) { $anims = @($js.animations | Where-Object { -not $Keep -or $_.name -match $Keep }) }
"Animazioni tenute: " + (($anims | ForEach-Object name) -join ', ')
if ($js.animations -and -not $anims.Count) { throw "Nessuna animazione corrisponde a '$Keep'" }

# accessori usati
$useAcc = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($m in @($js.meshes)) { foreach ($p in @($m.primitives)) {
  foreach ($a in $p.attributes.PSObject.Properties) { [void]$useAcc.Add([int]$a.Value) }
  if ($null -ne $p.indices) { [void]$useAcc.Add([int]$p.indices) }
  foreach ($t in @($p.targets)) { if ($t) { foreach ($a in $t.PSObject.Properties) { [void]$useAcc.Add([int]$a.Value) } } } } }
foreach ($s in @($js.skins)) { if ($s -and $null -ne $s.inverseBindMatrices) { [void]$useAcc.Add([int]$s.inverseBindMatrices) } }
foreach ($a in $anims) { foreach ($s in @($a.samplers)) { [void]$useAcc.Add([int]$s.input); [void]$useAcc.Add([int]$s.output) } }

# immagini da trasformare in JPEG: PNG non usate da materiali trasparenti
$alphaTex = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($mt in @($js.materials)) { if ($mt.alphaMode -and $mt.alphaMode -ne 'OPAQUE') {
  $ti = $mt.pbrMetallicRoughness.baseColorTexture.index; if ($null -ne $ti) { [void]$alphaTex.Add([int]$js.textures[$ti].source) } } }

# nuovo buffer binario
$ms = New-Object IO.MemoryStream
$bvMap = @{}; $newBV = New-Object System.Collections.ArrayList
function AddBV($bytes, $src) {
  while ($ms.Length % 4) { $ms.WriteByte(0) }
  $o = [pscustomobject]@{ buffer = 0; byteOffset = [int]$ms.Length; byteLength = $bytes.Length }
  if ($src -and $null -ne $src.byteStride) { $o | Add-Member byteStride $src.byteStride }
  if ($src -and $null -ne $src.target) { $o | Add-Member target $src.target }
  $ms.Write($bytes, 0, $bytes.Length); [void]$newBV.Add($o); return $newBV.Count - 1 }
function SrcBytes($i) { $v = $js.bufferViews[$i]; $off = 0; if ($null -ne $v.byteOffset) { $off = [int]$v.byteOffset }
  $r = New-Object byte[] $v.byteLength; [Array]::Copy($b, $binStart + $off, $r, 0, $v.byteLength); return $r }

$animAcc = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($a in $anims) { foreach ($s in @($a.samplers)) { [void]$animAcc.Add([int]$s.input); [void]$animAcc.Add([int]$s.output) } }
$NC = @{SCALAR = 1; VEC2 = 2; VEC3 = 3; VEC4 = 4; MAT4 = 16}; $CS = @{5120 = 1; 5121 = 1; 5122 = 2; 5123 = 2; 5125 = 4; 5126 = 4}
$accMap = @{}; $newAcc = New-Object System.Collections.ArrayList
foreach ($i in ($useAcc | Sort-Object)) { $a = $js.accessors[$i]
  if ($null -ne $a.bufferView -and $animAcc.Contains($i)) {
    # dati delle animazioni: spesso tutte le animazioni stanno in un unico blocco; si copia solo il pezzo di questo accessorio
    $v = $js.bufferViews[[int]$a.bufferView]; $vo = 0; if ($null -ne $v.byteOffset) { $vo = [int]$v.byteOffset }; $ao = 0; if ($null -ne $a.byteOffset) { $ao = [int]$a.byteOffset }
    $len = [int]$a.count * $NC[$a.type] * $CS[[int]$a.componentType]; $r = New-Object byte[] $len; [Array]::Copy($b, $binStart + $vo + $ao, $r, 0, $len)
    $a.bufferView = AddBV $r $null; if ($null -ne $a.byteOffset) { $a.byteOffset = 0 }
  } elseif ($null -ne $a.bufferView) { $bv = [int]$a.bufferView; if (-not $bvMap.ContainsKey($bv)) { $bvMap[$bv] = AddBV (SrcBytes $bv) $js.bufferViews[$bv] }; $a.bufferView = $bvMap[$bv] }
  $accMap[$i] = $newAcc.Count; [void]$newAcc.Add($a) }

$jpg = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
$ep = New-Object Drawing.Imaging.EncoderParameters 1; $ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter ([Drawing.Imaging.Encoder]::Quality), ([long]$Q)
for ($ii = 0; $ii -lt @($js.images).Count; $ii++) { $im = $js.images[$ii]; $bytes = SrcBytes ([int]$im.bufferView)
  if ($im.mimeType -eq 'image/png' -and -not $alphaTex.Contains($ii)) {
    $bmp = New-Object Drawing.Bitmap (New-Object IO.MemoryStream (, $bytes))
    $flat = New-Object Drawing.Bitmap $bmp.Width, $bmp.Height, ([Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [Drawing.Graphics]::FromImage($flat); $g.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height); $g.Dispose()
    $js2 = New-Object IO.MemoryStream; $flat.Save($js2, $jpg, $ep); $bmp.Dispose(); $flat.Dispose()
    if ($js2.Length -lt $bytes.Length) { $bytes = $js2.ToArray(); $im.mimeType = 'image/jpeg' } }
  $im.bufferView = AddBV $bytes $null }
while ($ms.Length % 4) { $ms.WriteByte(0) }

# indici rinumerati
foreach ($m in @($js.meshes)) { foreach ($p in @($m.primitives)) {
  foreach ($a in $p.attributes.PSObject.Properties) { $a.Value = $accMap[[int]$a.Value] }
  if ($null -ne $p.indices) { $p.indices = $accMap[[int]$p.indices] }
  foreach ($t in @($p.targets)) { if ($t) { foreach ($a in $t.PSObject.Properties) { $a.Value = $accMap[[int]$a.Value] } } } } }
foreach ($s in @($js.skins)) { if ($s -and $null -ne $s.inverseBindMatrices) { $s.inverseBindMatrices = $accMap[[int]$s.inverseBindMatrices] } }
foreach ($a in $anims) { foreach ($s in @($a.samplers)) { $s.input = $accMap[[int]$s.input]; $s.output = $accMap[[int]$s.output] } }
$js.accessors = @($newAcc); $js.bufferViews = @($newBV)
if ($js.animations) { $js.animations = @($anims) }
$js.buffers = @([pscustomobject]@{ byteLength = [int]$ms.Length })

# scrittura del GLB
$jsonB = [Text.Encoding]::UTF8.GetBytes(($js | ConvertTo-Json -Depth 100 -Compress))
$pad = (4 - $jsonB.Length % 4) % 4; $jsonP = New-Object byte[] ($jsonB.Length + $pad); [Array]::Copy($jsonB, $jsonP, $jsonB.Length); for ($i = $jsonB.Length; $i -lt $jsonP.Length; $i++) { $jsonP[$i] = 0x20 }
$bin = $ms.ToArray(); $total = 12 + 8 + $jsonP.Length + 8 + $bin.Length
$o = New-Object IO.MemoryStream; $w = New-Object IO.BinaryWriter $o
$w.Write([uint32]0x46546C67); $w.Write([uint32]2); $w.Write([uint32]$total)
$w.Write([uint32]$jsonP.Length); $w.Write([uint32]0x4E4F534A); $w.Write($jsonP)
$w.Write([uint32]$bin.Length); $w.Write([uint32]0x004E4942); $w.Write($bin); $w.Flush()
$outP = [IO.Path]::GetFullPath((Join-Path (Get-Location) $Out)); [IO.File]::WriteAllBytes($outP, $o.ToArray())
"Scritto $outP : $([Math]::Round($b.Length / 1MB, 2)) MB -> $([Math]::Round($o.Length / 1MB, 2)) MB"
