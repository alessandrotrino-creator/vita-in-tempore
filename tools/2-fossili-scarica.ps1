# Scarica dalla Paleobiology Database (paleobiodb.org) le occorrenze fossili per gruppo, a pagine.
# Uscita: data\occ\<gruppo>.csv (non va nel file finale: serve solo a 3-fossili-aggrega.ps1)
param([string]$Only)   # facoltativo: elenco di gruppi separati da virgole
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
New-Item -ItemType Directory -Force "$root\data\occ" | Out-Null
$G = [ordered]@{
  ediacara       = "interval=Ediacaran"
  spugne_coralli = "base_name=Porifera,Cnidaria,Archaeocyatha"
  trilobiti      = "base_name=Trilobita"
  artropodi      = "base_name=Eurypterida,Radiodonta,Xiphosura,Arachnida,Myriapoda,Decapoda"
  insetti        = "base_name=Insecta"
  molluschi      = "base_name=Cephalopoda"
  brachiopodi    = "base_name=Brachiopoda"
  echinodermi    = "base_name=Echinodermata"
  pesci          = "base_name=Vertebrata^Tetrapoda^Conodonta"
  piante         = "base_name=Embryophyta"
  anfibi         = "base_name=Tetrapoda^Amniota"
  sinapsidi      = "base_name=Synapsida^Mammalia"
  rettili        = "base_name=Reptilia^Dinosauria^Pterosauria^Ichthyosauromorpha^Sauropterygia^Mosasauroidea"
  rettili_marini = "base_name=Ichthyosauromorpha,Sauropterygia,Mosasauroidea"
  pterosauri     = "base_name=Pterosauria"
  dinosauri      = "base_name=Dinosauria^Aves"
  uccelli        = "base_name=Aves"
  mammiferi      = "base_name=Mammalia^Hominini"
  ominini        = "base_name=Hominini"
}
$PAGE = 20000
$keys = if ($Only) { $Only -split "," } else { $G.Keys }
foreach ($k in $keys) {
  $f = "$root\data\occ\$k.csv"
  if (Test-Path $f) { "$k già scaricato"; continue }
  if (Test-Path "$f.part") { "$k in corso altrove"; continue }
  New-Item -ItemType File "$f.part" | Out-Null
  $sb = New-Object System.Text.StringBuilder
  $off = 0
  while ($true) {
    $u = "https://paleobiodb.org/data1.2/occs/list.csv?$($G[$k])&show=coords,genus&vocab=pbdb&limit=$PAGE&offset=$off"
    $txt = $null
    for ($try = 0; $try -lt 5 -and $null -eq $txt; $try++) {
      try { $txt = (Invoke-WebRequest -UseBasicParsing $u -TimeoutSec 600).Content } catch { "  $k offset $off tentativo $try fallito"; Start-Sleep 8 }
    }
    if ($null -eq $txt) { throw "PBDB non risponde per $k" }
    $lines = $txt -split "`r?`n" | ? { $_ -ne "" }
    if ($off -eq 0) { [void]$sb.AppendLine($lines[0]) }
    $n = $lines.Count - 1
    for ($i = 1; $i -lt $lines.Count; $i++) { [void]$sb.AppendLine($lines[$i]) }
    $off += $PAGE
    if ($n -lt $PAGE) { break }
  }
  [IO.File]::WriteAllText($f, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
  Remove-Item "$f.part" -ErrorAction SilentlyContinue
  "$k : $off+ righe, $([Math]::Round((Get-Item $f).Length / 1MB, 1)) MB"
}
"FINE"
