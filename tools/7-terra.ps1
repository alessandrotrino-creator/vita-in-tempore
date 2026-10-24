# Globo «Sapiens»: rilievo e batimetria attuali + immagine Blue Marble (NASA)
#  - ETOPO1 (NOAA) da ERDDAP, ogni 0,25° -> data/terra.json (stesso formato di dem.json, un solo istante)
#  - NASA Blue Marble Next Generation con rilievo e batimetria, luglio 2004 (pubblico dominio) -> data/bluemarble.jpg 2048×1024
param([int]$Stride = 15)
$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$root = Split-Path $PSScriptRoot -Parent
$raw = Join-Path $root "data\raw"; New-Item -ItemType Directory -Force $raw | Out-Null

# ---------- ETOPO ----------
$csv = Join-Path $raw "etopo.csv"
if (-not (Test-Path $csv)) {
  $u = "https://upwell.pfeg.noaa.gov/erddap/griddap/etopo180.csv?altitude%5B(-90):$Stride`:(90)%5D%5B(-180):$Stride`:(180)%5D"
  Write-Host "Scarico ETOPO..."; Invoke-WebRequest $u -OutFile $csv -UseBasicParsing -TimeoutSec 900
}
$res = $Stride / 60.0
$w = [int](360 / $res); $h = [int](180 / $res) + 1
$q = New-Object 'sbyte[]' ($w * $h)
$n = 0
foreach ($line in [IO.File]::ReadLines($csv)) {
  $n++; if ($n -le 2) { continue }
  $p = $line.Split(',')
  $la = [double]::Parse($p[0], [Globalization.CultureInfo]::InvariantCulture)
  $lo = [double]::Parse($p[1], [Globalization.CultureInfo]::InvariantCulture)
  $e = [double]::Parse($p[2], [Globalization.CultureInfo]::InvariantCulture)
  $x = [int][Math]::Round(($lo + 180) / $res); if ($x -ge $w) { continue }
  $y = [int][Math]::Round((90 - $la) / $res)
  $v = [Math]::Sign($e) * [Math]::Sqrt([Math]::Abs($e)) * 1.6
  $v = [Math]::Max(-127, [Math]::Min(127, [Math]::Round($v)))
  # mai a zero: il segno distingue terra e mare
  if ($v -eq 0) { $v = if ($e -ge 0) { 1 } else { -1 } }
  $q[$y * $w + $x] = [sbyte]$v
}
# righe a differenze, poi gzip e base64
$buf = New-Object 'byte[]' ($w * $h)
for ($y = 0; $y -lt $h; $y++) { $prev = 0; for ($x = 0; $x -lt $w; $x++) { $i = $y * $w + $x; $c = [int]$q[$i]; $buf[$i] = [byte](($c - $prev) -band 255); $prev = $c } }
$ms = New-Object IO.MemoryStream
$gz = New-Object IO.Compression.GZipStream($ms, [IO.Compression.CompressionMode]::Compress)
$gz.Write($buf, 0, $buf.Length); $gz.Close()
$b64 = [Convert]::ToBase64String($ms.ToArray())
$json = '{"w":' + $w + ',"h":' + $h + ',"res":' + $res.ToString([Globalization.CultureInfo]::InvariantCulture) + ',"src":"ETOPO1 (NOAA NCEI), ogni ' + $res.ToString([Globalization.CultureInfo]::InvariantCulture) + ' gradi","b64":"' + $b64 + '"}'
[IO.File]::WriteAllText((Join-Path $root "data\terra.json"), $json)
Write-Host ("terra.json: {0}×{1}, {2:N0} KB" -f $w, $h, ($json.Length / 1KB))

# ---------- Blue Marble ----------
$jpg = Join-Path $raw "bluemarble-5400.jpg"
if (-not (Test-Path $jpg)) {
  Write-Host "Scarico Blue Marble..."
  Invoke-WebRequest "https://eoimages.gsfc.nasa.gov/images/imagerecords/73000/73751/world.topo.bathy.200407.3x5400x2700.jpg" -OutFile $jpg -UseBasicParsing -TimeoutSec 900
}
Add-Type -AssemblyName System.Drawing
$src = [Drawing.Image]::FromFile($jpg)
$bmp = New-Object Drawing.Bitmap 2048, 1024
$g = [Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.DrawImage($src, 0, 0, 2048, 1024); $g.Dispose(); $src.Dispose()
$enc = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$ep = New-Object Drawing.Imaging.EncoderParameters 1
$ep.Param[0] = New-Object Drawing.Imaging.EncoderParameter([Drawing.Imaging.Encoder]::Quality, [long]86)
$out = Join-Path $root "data\bluemarble.jpg"
$bmp.Save($out, $enc, $ep); $bmp.Dispose()
Write-Host ("bluemarble.jpg: {0:N0} KB" -f ((Get-Item $out).Length / 1KB))
