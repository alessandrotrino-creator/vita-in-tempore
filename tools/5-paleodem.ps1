# Impacchetta i PaleoDEM di Scotese & Wright (2018, PALEOMAP, CC BY 4.0) in data\dem.json.
# Ingresso: data\paleodem\csv\Map*_<età>Ma.csv (lon,lat,elev a 1°), scaricati da
# https://www.earthbyte.org/webdav/ftp/Data_Collections/Scotese_Wright_2018_PaleoDEM/PaleoDEMS_long_lat_elev_csv_v2.zip
# Ogni griglia: 360 × 181 celle (lon −180..179, lat 90..−90), quota quantizzata in un byte con scala a radice:
#   q = segno(e) · round(1,6 · √|e|)   (fine vicino al livello del mare, grossolana in alta montagna)
# Le righe sono codificate a differenze e il tutto è compresso con gzip e messo in base64.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$inv = [Globalization.CultureInfo]::InvariantCulture
$W = 360; $H = 181
$files = Get-ChildItem "$root\data\paleodem\csv" -Recurse -Filter "Map*Ma.csv" | ForEach-Object {
  if ($_.Name -match '_(\d+)Ma\.csv$') { [pscustomobject]@{ f = $_.FullName; t = [int]$Matches[1] } }
} | Sort-Object t
$NT = $files.Count
$buf = New-Object byte[] ($NT * $W * $H)
$k = 0
foreach ($it in $files) {
  $grid = New-Object sbyte[] ($W * $H)
  $sr = [IO.File]::OpenText($it.f)
  while (($line = $sr.ReadLine()) -ne $null) {
    if ($line.StartsWith("#") -or -not $line) { continue }
    $p = $line.Split(",")
    if ($p.Count -lt 3) { continue }
    $lon = 0.0; $lat = 0.0; $e = 0.0; $ns = [Globalization.NumberStyles]::Float
    if (-not ([double]::TryParse($p[0], $ns, $inv, [ref]$lon) -and [double]::TryParse($p[1], $ns, $inv, [ref]$lat) -and [double]::TryParse($p[2], $ns, $inv, [ref]$e))) { continue }
    $x = [int][Math]::Round($lon + 180); if ($x -ge $W) { continue }
    $y = [int][Math]::Round(90 - $lat)
    if ([Math]::Abs($lat) -gt 89.5) { $e = [Math]::Min($e, 3000) }   # valori anomali ai poli
    $q = [Math]::Sign($e) * [Math]::Round(1.6 * [Math]::Sqrt([Math]::Abs($e)))
    $grid[$y * $W + $x] = [sbyte][Math]::Max(-127, [Math]::Min(127, $q))
  }
  $sr.Close()
  # differenze lungo le righe (byte senza segno, modulo 256)
  for ($y = 0; $y -lt $H; $y++) {
    $prev = 0
    for ($x = 0; $x -lt $W; $x++) { $v = [int]$grid[$y * $W + $x]; $buf[$k++] = [byte](($v - $prev) -band 255); $prev = $v }
  }
}
$ms = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionLevel]::Optimal)
$gz.Write($buf, 0, $buf.Length); $gz.Close()
$b64 = [Convert]::ToBase64String($ms.ToArray())
$js = '{"w":' + $W + ',"h":' + $H + ',"times":[' + (($files | % { $_.t }) -join ",") + '],"b64":"' + $b64 + '"}'
[IO.File]::WriteAllText("$root\data\dem.json", $js, (New-Object Text.UTF8Encoding $false))
"Griglie: $NT, grezzo $([Math]::Round($buf.Length / 1MB, 2)) MB, compresso+base64 $([Math]::Round($b64.Length / 1MB, 2)) MB"
