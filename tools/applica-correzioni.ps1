# Applica un elenco di correzioni testuali esatte (file, vecchio, nuovo) ai sorgenti in src\.
# Uso: powershell -File tools\applica-correzioni.ps1 -Lista correzioni.json
# Il JSON è un array di {"id","file","old","new"}; segnala le voci non trovate o non univoche.
param([Parameter(Mandatory)][string]$Lista)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$u8 = New-Object Text.UTF8Encoding $false
$items = [IO.File]::ReadAllText($Lista, [Text.Encoding]::UTF8) | ConvertFrom-Json
$cache = @{}
foreach ($c in $items) {
  $f = Join-Path "$root\src" $c.file
  if (-not $cache.ContainsKey($f)) { $cache[$f] = [IO.File]::ReadAllText($f, [Text.Encoding]::UTF8) }
  $s = $cache[$f]
  $n = ([regex]::Matches($s, [regex]::Escape($c.old))).Count
  if ($n -ne 1) { "NON APPLICATA $($c.id): trovata $n volte"; continue }
  $cache[$f] = $s.Replace($c.old, $c.new)
  "ok $($c.id)"
}
foreach ($f in $cache.Keys) { [IO.File]::WriteAllText($f, $cache[$f], $u8) }
