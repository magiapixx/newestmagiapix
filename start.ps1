# Starts the merged Mondragon static site with the bundled portable Node.js.
$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$portable = Join-Path $root '..\.setup\node\node-v24.22.1-win-x64\node.exe'
$node = $null

if (Test-Path $portable) {
    $node = $portable
} else {
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { $node = $cmd.Source }
}

if (-not $node) {
    throw 'Node.js tidak ditemukan. Jalankan start.cmd dari folder Default Project, atau instal Node.js.'
}

Write-Host "Mondragon site: http://localhost:4173"
& $node (Join-Path $root 'serve.js') 4173
