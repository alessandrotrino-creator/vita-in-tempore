# Rotazioni finite delle placche (modello Merdith et al. 2021) ogni 5 Ma da 0 a 1000 Ma.
# Per ogni placca si ricostruiscono due punti di riferimento ((0°,0°) e (90°E,0°)) con il GPlates Web Service
# e se ne ricava il quaternione. Rotazione identica a t>0 = placca non ancora esistente (null).
# Ingresso: data\pids.txt (un plate ID per riga). Cache incrementale: data\rotcache.json
# Uscita: data\rot.json  {"step":5,"max":1000,"q":{"pid":[w,x,y,z, ...] in decimillesimi, 0,0,0,0 = assente}}
param([string]$Model = "MERDITH2021", [int]$Max = 1000, [string]$Tag = "")
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$gws = "https://gws.gplates.org/reconstruct/reconstruct_points/"
$model = $Model
$STEP = 5; $MAX = $Max; $NT = $MAX / $STEP + 1
$inv = [Globalization.CultureInfo]::InvariantCulture

$cache = @{}
if (Test-Path "$root\data\rotcache$Tag.json") {
  $o = Get-Content "$root\data\rotcache$Tag.json" -Raw | ConvertFrom-Json
  foreach ($p in $o.PSObject.Properties) { $cache[$p.Name] = [int[]]$p.Value }
}
$pids = Get-Content "$root\data\pids$Tag.txt" | ? { $_ -match '^\d+$' } | Sort-Object { [int]$_ } -Unique
$todo = @($pids | ? { -not $cache.ContainsKey($_) })
"Placche: $($pids.Count), da calcolare: $($todo.Count)"

function Quat($a, $b) {
  # a = immagine di (1,0,0), b = immagine di (0,1,0); c = a x b
  $c = @(($a[1] * $b[2] - $a[2] * $b[1]), ($a[2] * $b[0] - $a[0] * $b[2]), ($a[0] * $b[1] - $a[1] * $b[0]))
  $m00 = $a[0]; $m10 = $a[1]; $m20 = $a[2]; $m01 = $b[0]; $m11 = $b[1]; $m21 = $b[2]; $m02 = $c[0]; $m12 = $c[1]; $m22 = $c[2]
  $tr = $m00 + $m11 + $m22
  if ($tr -gt 0) { $s = [Math]::Sqrt($tr + 1) * 2; $w = 0.25 * $s; $x = ($m21 - $m12) / $s; $y = ($m02 - $m20) / $s; $z = ($m10 - $m01) / $s }
  elseif ($m00 -gt $m11 -and $m00 -gt $m22) { $s = [Math]::Sqrt(1 + $m00 - $m11 - $m22) * 2; $w = ($m21 - $m12) / $s; $x = 0.25 * $s; $y = ($m01 + $m10) / $s; $z = ($m02 + $m20) / $s }
  elseif ($m11 -gt $m22) { $s = [Math]::Sqrt(1 + $m11 - $m00 - $m22) * 2; $w = ($m02 - $m20) / $s; $x = ($m01 + $m10) / $s; $y = 0.25 * $s; $z = ($m12 + $m21) / $s }
  else { $s = [Math]::Sqrt(1 + $m22 - $m00 - $m11) * 2; $w = ($m10 - $m01) / $s; $x = ($m02 + $m20) / $s; $y = ($m12 + $m21) / $s; $z = 0.25 * $s }
  if ($w -lt 0) { $w = -$w; $x = -$x; $y = -$y; $z = -$z }
  return @([int][Math]::Round($w * 10000), [int][Math]::Round($x * 10000), [int][Math]::Round($y * 10000), [int][Math]::Round($z * 10000))
}
function Vec($lon, $lat) { $lo = $lon * [Math]::PI / 180; $la = $lat * [Math]::PI / 180; return @(([Math]::Cos($la) * [Math]::Cos($lo)), ([Math]::Cos($la) * [Math]::Sin($lo)), [Math]::Sin($la)) }

if ($todo.Count -gt 0) {
  $acc = @{}; foreach ($p in $todo) { $acc[$p] = New-Object int[] (4 * $NT) }
  for ($o = 0; $o -lt $todo.Count; $o += 120) {
    $batch = $todo[$o..([Math]::Min($o + 119, $todo.Count - 1))]
    $pts = ($batch | % { "0,0,90,0" }) -join ","
    $pp = ($batch | % { "$_,$_" }) -join ","
    for ($ti = 0; $ti -lt $NT; $ti++) {
      $t = $ti * $STEP
      $r = $null
      for ($try = 0; $try -lt 4 -and -not $r; $try++) {
        try { $r = (Invoke-WebRequest -UseBasicParsing -Method Post -Body @{ points = $pts; pids = $pp; time = "$t"; model = $model } $gws -TimeoutSec 120).Content | ConvertFrom-Json } catch { Start-Sleep 3 }
      }
      if (-not $r) { throw "GWS non risponde a t=$t" }
      for ($k = 0; $k -lt $batch.Count; $k++) {
        $A = $r.coordinates[2 * $k]; $B = $r.coordinates[2 * $k + 1]
        $ident = ([Math]::Abs($A[0]) -lt 1e-6 -and [Math]::Abs($A[1]) -lt 1e-6 -and [Math]::Abs($B[0] - 90) -lt 1e-6 -and [Math]::Abs($B[1]) -lt 1e-6)
        $q = if ($t -gt 0 -and $ident) { @(0, 0, 0, 0) } else { Quat (Vec $A[0] $A[1]) (Vec $B[0] $B[1]) }
        for ($c = 0; $c -lt 4; $c++) { $acc[$batch[$k]][4 * $ti + $c] = $q[$c] }
      }
    }
    foreach ($p in $batch) { $cache[$p] = $acc[$p] }
    $js = "{" + (($cache.Keys | % { '"' + $_ + '":[' + ($cache[$_] -join ",") + "]" }) -join ",") + "}"
    [IO.File]::WriteAllText("$root\data\rotcache$Tag.json", $js, (New-Object Text.UTF8Encoding $false))
    "  fatte $([Math]::Min($o + 120, $todo.Count)) / $($todo.Count)"
  }
}
$js = '{"step":' + $STEP + ',"max":' + $MAX + ',"q":{' + (($pids | % { '"' + $_ + '":[' + ($cache[$_] -join ",") + "]" }) -join ",") + "}}"
[IO.File]::WriteAllText("$root\data\rot$Tag.json", $js, (New-Object Text.UTF8Encoding $false))
"Scritto rot.json: $($js.Length) caratteri"
