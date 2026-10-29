# Monta i due file unici a partire dai pezzi in src\ e data\:
#   index.html   = «Vita in Tempore» (storia della Terra)
#   sapiens.html = «Sapiens in Tempore» (da 60 000 anni fa a oggi e futuri possibili)
# Uso: powershell -File tools\build.ps1  (opzione -Out cartella per scrivere altrove)
param([string]$Out)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not $Out) { $Out = $root }
$u8 = New-Object Text.UTF8Encoding $false
function ReadF($p) { if (Test-Path $p) { [IO.File]::ReadAllText($p, [Text.Encoding]::UTF8) } else { Write-Warning "Manca $p"; "" } }
# evita che un "</script" dentro i dati chiuda il tag
function Safe($s) { $s -replace '</script', '<\/script' }
function Fill($html, $parts, $file) {
  foreach ($k in $parts.Keys) {
    $i = $html.IndexOf($k); if ($i -lt 0) { throw "Segnaposto $k non trovato" }
    $html = $html.Substring(0, $i) + (Safe $parts[$k]) + $html.Substring($i + $k.Length)
  }
  $f = Join-Path $Out $file
  [IO.File]::WriteAllText($f, $html, $u8)
  "Scritto $f : $([Math]::Round((Get-Item $f).Length / 1MB, 2)) MB"
}
$cerca = ReadF "$root\src\cerca.js"
# three.js con il caricatore di modelli glTF (modelli 3D veri degli ambienti, cartella modelli/)
$three = (ReadF "$root\src\three.r128.min.js") + "`n" + (ReadF "$root\src\three.gltfloader.r128.js") + "`n" + (ReadF "$root\src\three.skeletonutils.r128.js")

# ---------- Vita in Tempore ----------
$fos = ReadF "$root\data\fossili.json"; if (-not $fos) { $fos = '{"stages":[],"cells":[],"names":[],"groups":{}}' }
$data = 'window.DATA={"coste":' + (ReadF "$root\data\coste.json") + ',"rot":' + (ReadF "$root\data\rot.json") + ',"fossili":' + $fos + ',"shelf":' + (ReadF "$root\data\shelf.json") + ',"rot_pm":' + (ReadF "$root\data\rot_pm.json") + ',"coste_pm":' + (ReadF "$root\data\coste_pm.json") + ',"dem":' + (ReadF "$root\data\dem.json") + '};'
$tpl = ReadF "$root\src\template.html"
Fill $tpl ([ordered]@{
  "/*@D3*/"       = ReadF "$root\src\d3.v7.min.js"
  "/*@TOPO*/"     = ReadF "$root\src\topojson-client.min.js"
  "/*@THREE*/"    = $three
  "/*@DATA*/"     = $data
  "/*@CONTENT*/"  = (ReadF "$root\src\content.js") + "`n" + (ReadF "$root\src\sapiens\scienziati.js")
  "/*@SCENARI*/"  = (ReadF "$root\src\scenari.js") + "`n" + (ReadF "$root\src\futuro.js")
  "/*@AMBIENTI*/" = (ReadF "$root\src\ecosistemi.js") + "`n" + (ReadF "$root\src\ambienti.js")
  "/*@APP*/"      = $cerca + "`n" + (ReadF "$root\src\app.js")
}) "index.html"

# ---------- Sapiens in Tempore ----------
$css = $tpl.Substring($tpl.IndexOf('<style>') + 7); $css = $css.Substring(0, $css.IndexOf('</style>'))
$bm = "data:image/jpeg;base64," + [Convert]::ToBase64String([IO.File]::ReadAllBytes("$root\data\bluemarble.jpg"))
$enr = ReadF "$root\data\sapiens-enrich.json"; if (-not $enr) { $enr = '{"species":{},"people":{}}' }
$sdata = 'window.DATA={"terra":' + (ReadF "$root\data\terra.json") + ',"bm":"' + $bm + '","enrich":' + $enr + '};'
$content = (@("umani", "estinte", "viventi", "viventi-mondo", "scienziati", "futuro") | ForEach-Object { ReadF "$root\src\sapiens\$_.js" }) -join "`n"
Fill (ReadF "$root\src\sapiens\template.html") ([ordered]@{
  "/*@BASECSS*/"  = $css
  "/*@D3*/"       = ReadF "$root\src\d3.v7.min.js"
  "/*@THREE*/"    = $three
  "/*@DATA*/"     = $sdata
  "/*@CONTENT*/"  = $content
  "/*@AMBIENTI*/" = (ReadF "$root\src\ecosistemi.js") + "`n" + (ReadF "$root\src\ambienti.js")
  "/*@APP*/"      = $cerca + "`n" + (ReadF "$root\src\sapiens\app.js")
}) "sapiens.html"
