# Scarica le coste attuali (modello Merdith et al. 2021, GPlates Web Service),
# le semplifica e assegna a ogni poligono la placca (plate ID) e l'età di comparsa.
# Uscita: data\coste.json  [{p:pid, b:età_inizio_Ma, c:[lon,lat,lon,lat,...]}]
param([string]$Model = "MERDITH2021", [string]$OutFile = "coste.json")
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$gws = "https://gws.gplates.org"
$model = $Model
$inv = [Globalization.CultureInfo]::InvariantCulture

$j = (Invoke-WebRequest -UseBasicParsing "$gws/reconstruct/coastlines_low/?time=0&model=$model" -TimeoutSec 120).Content | ConvertFrom-Json
$rings = New-Object System.Collections.ArrayList
foreach ($f in $j.features) {
  $g = $f.geometry
  $ringsIn = New-Object System.Collections.ArrayList
  if ($g.type -eq "Polygon") { [void]$ringsIn.Add($g.coordinates[0]) } else { foreach ($pp in $g.coordinates) { [void]$ringsIn.Add($pp[0]) } }
  foreach ($ring in $ringsIn) {
    # decimazione: tiene un vertice ogni ~0,45° circa
    $out = New-Object System.Collections.ArrayList
    $lx = 999; $ly = 999
    $minx = 999; $maxx = -999; $miny = 999; $maxy = -999
    foreach ($pt in $ring) {
      $x = [double]$pt[0]; $y = [double]$pt[1]
      if ($x -lt $minx) { $minx = $x }; if ($x -gt $maxx) { $maxx = $x }
      if ($y -lt $miny) { $miny = $y }; if ($y -gt $maxy) { $maxy = $y }
      $d = [Math]::Abs($x - $lx) * [Math]::Cos($y * [Math]::PI / 180) + [Math]::Abs($y - $ly)
      if ($d -ge 0.45) { [void]$out.Add(@($x, $y)); $lx = $x; $ly = $y }
    }
    $ext = [Math]::Max(($maxx - $minx) * [Math]::Cos(($miny + $maxy) / 2 * [Math]::PI / 180), $maxy - $miny)
    if ($out.Count -lt 4 -or $ext -lt 1.2) { continue }
    [void]$rings.Add(@{ pts = $out })
  }
}
"Anelli tenuti: $($rings.Count), vertici: $(($rings | % { $_.pts.Count } | Measure-Object -Sum).Sum)"

# campioni: fino a 7 vertici per anello -> reconstruct_points fc=1 a t=0 dà pid e valid_time
$samples = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $rings.Count; $i++) {
  $pts = $rings[$i].pts; $n = $pts.Count; $k = [Math]::Min(7, $n)
  for ($s = 0; $s -lt $k; $s++) { $p = $pts[[int][Math]::Floor($s * $n / $k)]; [void]$samples.Add(@{ r = $i; x = $p[0]; y = $p[1] }) }
}
$res = @{}
for ($o = 0; $o -lt $samples.Count; $o += 300) {
  $chunk = $samples[$o..([Math]::Min($o + 299, $samples.Count - 1))]
  $q = ($chunk | % { $_.x.ToString("0.###", $inv) + "," + $_.y.ToString("0.###", $inv) }) -join ","
  $r = (Invoke-WebRequest -UseBasicParsing -Method Post -Body @{ points = $q; time = "0"; model = $model; fc = "1" } "$gws/reconstruct/reconstruct_points/" -TimeoutSec 120).Content | ConvertFrom-Json
  for ($m = 0; $m -lt $chunk.Count; $m++) {
    $ft = $r.features[$m]; $ri = $chunk[$m].r
    if (-not $res.ContainsKey($ri)) { $res[$ri] = New-Object System.Collections.ArrayList }
    [void]$res[$ri].Add(@($ft.properties.pid, $ft.properties.valid_time[0]))
  }
}
$outArr = New-Object System.Collections.ArrayList
for ($i = 0; $i -lt $rings.Count; $i++) {
  $votes = $res[$i] | Group-Object { $_[0] } | Sort-Object Count -Descending
  $pid0 = [int]$votes[0].Name
  $beg = ($res[$i] | ? { $_[0] -eq $pid0 } | % { [double]$_[1] } | Measure-Object -Maximum).Maximum
  $c = ($rings[$i].pts | % { $_[0].ToString("0.##", $inv) + "," + $_[1].ToString("0.##", $inv) }) -join ","
  [void]$outArr.Add('{"p":' + $pid0 + ',"b":' + ([Math]::Round($beg)) + ',"c":[' + $c + ']}')
}
$txt = "[" + ($outArr -join ",`n") + "]"
[IO.File]::WriteAllText("$root\data\$OutFile", $txt, (New-Object Text.UTF8Encoding $false))
"Scritto coste.json: $($txt.Length) caratteri"
