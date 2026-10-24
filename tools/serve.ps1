# Piccolo server statico per provare il globo in locale: http://localhost:8765/
param([int]$Port = 8765)
$root = Split-Path $PSScriptRoot -Parent
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
"In ascolto su http://localhost:$Port/ (cartella $root)"
$types = @{ ".html" = "text/html; charset=utf-8"; ".js" = "text/javascript; charset=utf-8"; ".json" = "application/json"; ".css" = "text/css"; ".png" = "image/png"; ".svg" = "image/svg+xml" }
while ($l.IsListening) {
  $c = $l.GetContext()
  try {
    $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart("/"))
    # strumenti di preparazione dei dati (tools/arricchisci.html): POST /salva/nome.json scrive in data/
    if ($c.Request.HttpMethod -eq "POST" -and $p -match '^salva/([a-z0-9-]+\.json)$') {
      $sr = New-Object IO.StreamReader($c.Request.InputStream, [Text.Encoding]::UTF8)
      [IO.File]::WriteAllText((Join-Path $root "data\$($Matches[1])"), $sr.ReadToEnd(), (New-Object Text.UTF8Encoding $false))
      $c.Response.StatusCode = 204; $c.Response.Close(); continue
    }
    if (-not $p) { $p = "index.html" }
    $f = Join-Path $root $p
    if ((Test-Path $f -PathType Leaf) -and ([IO.Path]::GetFullPath($f).StartsWith($root))) {
      $b = [IO.File]::ReadAllBytes($f)
      $ext = [IO.Path]::GetExtension($f).ToLower()
      $c.Response.ContentType = if ($types[$ext]) { $types[$ext] } else { "application/octet-stream" }
      $c.Response.Headers.Add("Cache-Control", "no-store")
      $c.Response.OutputStream.Write($b, 0, $b.Length)
    } else { $c.Response.StatusCode = 404 }
  } catch { $c.Response.StatusCode = 500 }
  $c.Response.Close()
}
