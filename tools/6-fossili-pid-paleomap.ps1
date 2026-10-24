# Aggiunge a ogni cella di data\fossili.json il plate ID del modello PALEOMAP (quarto valore)
# e lo aggiunge a data\pids_pm.txt. Va eseguito dopo 3-fossili-aggrega.ps1.
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$inv = [Globalization.CultureInfo]::InvariantCulture
$txt = [IO.File]::ReadAllText("$root\data\fossili.json", [Text.Encoding]::UTF8)
$m = [regex]::Match($txt, '"cells":\[(.*?)\]\],"names"')
$cells = [regex]::Matches($m.Groups[1].Value + "]", '\[([-\d.]+),([-\d.]+),(\d+)(?:,\d+)?\]') | % { , @($_.Groups[1].Value, $_.Groups[2].Value, $_.Groups[3].Value) }
"Celle: $($cells.Count)"
$pm = New-Object int[] $cells.Count
for ($o = 0; $o -lt $cells.Count; $o += 300) {
  $e = [Math]::Min($o + 299, $cells.Count - 1)
  $q = (($o..$e) | % { $cells[$_][0] + "," + $cells[$_][1] }) -join ","
  $r = $null
  for ($try = 0; $try -lt 4 -and -not $r; $try++) { try { $r = (Invoke-WebRequest -UseBasicParsing -Method Post -Body @{ points = $q; time = "0"; model = "PALEOMAP"; fc = "1" } "https://gws.gplates.org/reconstruct/reconstruct_points/" -TimeoutSec 120).Content | ConvertFrom-Json } catch { Start-Sleep 3 } }
  for ($k = $o; $k -le $e; $k++) { $pm[$k] = [int]$r.features[$k - $o].properties.pid }
}
$newCells = (0..($cells.Count - 1) | % { "[" + $cells[$_][0] + "," + $cells[$_][1] + "," + $cells[$_][2] + "," + $pm[$_] + "]" }) -join ","
$txt = $txt.Substring(0, $m.Groups[1].Index) + $newCells.Substring(1, $newCells.Length - 2) + $txt.Substring($m.Groups[1].Index + $m.Groups[1].Length)
[IO.File]::WriteAllText("$root\data\fossili.json", $txt, (New-Object Text.UTF8Encoding $false))
$all = @(Get-Content "$root\data\pids_pm.txt") + @($pm | % { "$_" }) | Sort-Object { [int]$_ } -Unique
$all | Set-Content "$root\data\pids_pm.txt"
"Plate ID PALEOMAP: $($all.Count)"
