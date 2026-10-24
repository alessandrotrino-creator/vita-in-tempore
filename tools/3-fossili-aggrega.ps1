# Aggrega le occorrenze PBDB (data\occ\*.csv) in celle di 2° × piano geologico (ICS 2023).
# Per ogni cella-piano-gruppo: numero di occorrenze e i 4 generi più frequenti (con una specie di esempio).
# Poi assegna a ogni cella la placca (plate ID) con il GPlates Web Service (modello Merdith 2021).
# Uscita: data\fossili.json, aggiunge i plate ID a data\pids.txt
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName Microsoft.VisualBasic
$root = Split-Path $PSScriptRoot -Parent
$inv = [Globalization.CultureInfo]::InvariantCulture
$CELL = 2.0

# piani ICS (nome italiano, inizio in Ma); la fine è l'inizio del piano successivo più giovane
$STAGES = @(
 @("Ediacarano",635),@("Fortuniano",538.8),@("Cambriano stadio 2",529),@("Cambriano stadio 3",521),@("Cambriano stadio 4",514),@("Wuliuano",509),@("Drumiano",504.5),@("Guzhangiano",500.5),@("Paibiano",497),@("Jiangshaniano",494),@("Cambriano stadio 10",489.5),
 @("Tremadociano",485.4),@("Floiano",477.7),@("Dapingiano",470),@("Darriwiliano",467.3),@("Sandbiano",458.4),@("Katiano",453),@("Hirnantiano",445.2),
 @("Rhuddaniano",443.8),@("Aeroniano",440.8),@("Telychiano",438.5),@("Sheinwoodiano",433.4),@("Homeriano",430.5),@("Gorstiano",427.4),@("Ludfordiano",425.6),@("Pridoli",423),
 @("Lochkoviano",419.2),@("Pragiano",410.8),@("Emsiano",407.6),@("Eifeliano",393.3),@("Givetiano",387.7),@("Frasniano",382.7),@("Famenniano",372.2),
 @("Tournaisiano",358.9),@("Viseano",346.7),@("Serpukhoviano",330.9),@("Bashkiriano",323.2),@("Moscoviano",315.2),@("Kasimoviano",307),@("Gzheliano",303.7),
 @("Asseliano",298.9),@("Sakmariano",293.52),@("Artinskiano",290.1),@("Kunguriano",283.5),@("Roadiano",273.01),@("Wordiano",266.9),@("Capitaniano",264.28),@("Wuchiapingiano",259.51),@("Changhsingiano",254.14),
 @("Induano",251.9),@("Olenekiano",251.2),@("Anisico",247.2),@("Ladinico",242),@("Carnico",237),@("Norico",227),@("Retico",208.5),
 @("Hettangiano",201.4),@("Sinemuriano",199.5),@("Pliensbachiano",192.9),@("Toarciano",184.2),@("Aaleniano",174.7),@("Bajociano",170.9),@("Bathoniano",168.2),@("Calloviano",165.3),@("Oxfordiano",161.5),@("Kimmeridgiano",154.8),@("Titoniano",149.2),
 @("Berriasiano",145),@("Valanginiano",139.8),@("Hauteriviano",132.6),@("Barremiano",125.77),@("Aptiano",121.4),@("Albiano",113),@("Cenomaniano",100.5),@("Turoniano",93.9),@("Coniaciano",89.8),@("Santoniano",86.3),@("Campaniano",83.6),@("Maastrichtiano",72.1),
 @("Daniano",66),@("Selandiano",61.6),@("Thanetiano",59.2),@("Ypresiano",56),@("Luteziano",47.8),@("Bartoniano",41.2),@("Priaboniano",37.71),@("Rupeliano",33.9),@("Chattiano",27.82),
 @("Aquitaniano",23.04),@("Burdigaliano",20.44),@("Langhiano",15.98),@("Serravalliano",13.82),@("Tortoniano",11.63),@("Messiniano",7.246),@("Zancleano",5.333),@("Piacenziano",3.6),
 @("Gelasiano",2.58),@("Calabriano",1.8),@("Chibaniano",0.774),@("Pleistocene superiore",0.129),@("Olocene",0.0117)
)
$NS = $STAGES.Count
$starts = $STAGES | % { [double]$_[1] }
function StageOf([double]$age) {
  for ($i = $NS - 1; $i -ge 0; $i--) { if ($age -le $starts[$i]) { return $i } }
  return -1
}

$cells = @{}        # "ix,iy" -> @{ sx; sy; n; idx }
$cellList = New-Object System.Collections.ArrayList
$groups = [ordered]@{}
foreach ($f in Get-ChildItem "$root\data\occ\*.csv" | Sort-Object Name) {
  $g = $f.BaseName
  $agg = @{}        # "cell|stage" -> @{ n; gen = @{ genus -> @{ n; sp = @{} } } }
  $p = New-Object Microsoft.VisualBasic.FileIO.TextFieldParser($f.FullName, [Text.Encoding]::UTF8)
  $p.SetDelimiters(","); $p.HasFieldsEnclosedInQuotes = $true
  $h = $p.ReadFields()
  while ($h -notcontains "occurrence_no" -and -not $p.EndOfData) { $h = $p.ReadFields() }   # salta eventuali avvisi in testa
  $iAcc = [Array]::IndexOf($h, "accepted_name"); $iRank = [Array]::IndexOf($h, "accepted_rank")
  $iMax = [Array]::IndexOf($h, "max_ma"); $iMin = [Array]::IndexOf($h, "min_ma")
  $iLng = [Array]::IndexOf($h, "lng"); $iLat = [Array]::IndexOf($h, "lat"); $iGen = [Array]::IndexOf($h, "genus")
  $rows = 0
  while (-not $p.EndOfData) {
    $r = $p.ReadFields(); $rows++
    if ($r.Count -le $iGen) { continue }
    $lng = 0.0; $lat = 0.0; $mx = 0.0; $mn = 0.0
    if (-not [double]::TryParse($r[$iLng], [Globalization.NumberStyles]::Float, $inv, [ref]$lng)) { continue }
    if (-not [double]::TryParse($r[$iLat], [Globalization.NumberStyles]::Float, $inv, [ref]$lat)) { continue }
    [void][double]::TryParse($r[$iMax], [Globalization.NumberStyles]::Float, $inv, [ref]$mx)
    [void][double]::TryParse($r[$iMin], [Globalization.NumberStyles]::Float, $inv, [ref]$mn)
    if ($mx - $mn -gt [Math]::Max(25, ($mx + $mn) / 2 * 0.2)) { continue }   # datazione troppo vaga
    $st = StageOf (($mx + $mn) / 2)
    if ($st -lt 0) { continue }
    $ix = [Math]::Floor(($lng + 180) / $CELL); $iy = [Math]::Floor(($lat + 90) / $CELL)
    $ck = "$ix,$iy"
    if (-not $cells.ContainsKey($ck)) { $cells[$ck] = @{ sx = 0.0; sy = 0.0; n = 0; idx = $cellList.Count }; [void]$cellList.Add($ck) }
    $C = $cells[$ck]; $C.sx += $lng; $C.sy += $lat; $C.n++
    $k = "$($C.idx)|$st"
    if (-not $agg.ContainsKey($k)) { $agg[$k] = @{ n = 0; gen = @{} } }
    $A = $agg[$k]; $A.n++
    $gen = $r[$iGen]
    if ($gen) {
      if (-not $A.gen.ContainsKey($gen)) { $A.gen[$gen] = @{ n = 0; sp = @{} } }
      $A.gen[$gen].n++
      if ($r[$iRank] -eq "species") { $s = $r[$iAcc]; if ($A.gen[$gen].sp.ContainsKey($s)) { $A.gen[$gen].sp[$s]++ } else { $A.gen[$gen].sp[$s] = 1 } }
    }
  }
  $p.Close()
  $groups[$g] = $agg
  "$g : $rows righe, $($agg.Count) celle-piano"
}

# dizionario dei nomi
$names = @{}; $nameList = New-Object System.Collections.ArrayList
function NameIdx($s) { if (-not $names.ContainsKey($s)) { $names[$s] = $nameList.Count; [void]$nameList.Add($s) }; return $names[$s] }

$gOut = New-Object System.Collections.ArrayList
foreach ($g in $groups.Keys) {
  $items = New-Object System.Collections.ArrayList
  foreach ($k in $groups[$g].Keys) {
    $A = $groups[$g][$k]; $parts = $k.Split("|")
    $top = $A.gen.GetEnumerator() | Sort-Object { $_.Value.n } -Descending | Select-Object -First 4
    $tn = @($top | % {
      $sp = $_.Value.sp.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 1
      $label = if ($sp) { $sp.Key } else { $_.Key }
      NameIdx $label
    })
    [void]$items.Add("[" + $parts[0] + "," + $parts[1] + "," + $A.n + $(if ($tn.Count) { "," + ($tn -join ",") } else { "" }) + "]")
  }
  [void]$gOut.Add('"' + $g + '":[' + ($items -join ",") + "]")
}

# plate ID dei centroidi delle celle
"Celle: $($cellList.Count)"
$cent = New-Object System.Collections.ArrayList
foreach ($ck in $cellList) { $C = $cells[$ck]; [void]$cent.Add([double[]]@(($C.sx / $C.n), ($C.sy / $C.n))) }
$pidsOf = New-Object int[] $cellList.Count
for ($o = 0; $o -lt $cellList.Count; $o += 300) {
  $e = [Math]::Min($o + 299, $cellList.Count - 1)
  $q = (($o..$e) | % { $cent[$_][0].ToString("0.###", $inv) + "," + $cent[$_][1].ToString("0.###", $inv) }) -join ","
  $r = $null
  for ($try = 0; $try -lt 4 -and -not $r; $try++) { try { $r = (Invoke-WebRequest -UseBasicParsing -Method Post -Body @{ points = $q; time = "0"; model = "MERDITH2021"; fc = "1" } "https://gws.gplates.org/reconstruct/reconstruct_points/" -TimeoutSec 120).Content | ConvertFrom-Json } catch { Start-Sleep 3 } }
  for ($m = $o; $m -le $e; $m++) { $pidsOf[$m] = [int]$r.features[$m - $o].properties.pid }
}
$cellsJs = (0..($cellList.Count - 1) | % { "[" + $cent[$_][0].ToString("0.##", $inv) + "," + $cent[$_][1].ToString("0.##", $inv) + "," + $pidsOf[$_] + "]" }) -join ","
$stJs = ($STAGES | % { '["' + $_[0] + '",' + ([double]$_[1]).ToString($inv) + "]" }) -join ","
$nmJs = ($nameList | % { '"' + ($_ -replace '"', '') + '"' }) -join ","
$js = '{"stages":[' + $stJs + '],"cells":[' + $cellsJs + '],"names":[' + $nmJs + '],"groups":{' + ($gOut -join ",") + '}}'
[IO.File]::WriteAllText("$root\data\fossili.json", $js, (New-Object Text.UTF8Encoding $false))
"Scritto fossili.json: $([Math]::Round($js.Length / 1MB, 2)) MB, nomi: $($nameList.Count)"
$all = @(Get-Content "$root\data\pids.txt") + @($pidsOf | % { "$_" }) | Sort-Object { [int]$_ } -Unique
$all | Set-Content "$root\data\pids.txt"
