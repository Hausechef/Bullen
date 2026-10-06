$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectPath
$logPath = Join-Path $projectPath '.local/dev'
New-Item -ItemType Directory -Force -Path $logPath | Out-Null
$nodePath = (Get-Command node -ErrorAction Stop).Source

function Start-ProjectServer {
  param([string]$Name, [int]$Port, [string]$WorkingDirectory, [string[]]$NodeArgs)
  $listener = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
  $pidPath = Join-Path $logPath "$Name.pid"
  if ($listener) {
    if ((Test-Path -LiteralPath $pidPath) -and [int](Get-Content -LiteralPath $pidPath) -eq $listener.OwningProcess) {
      Write-Output "$Name is already running on port $Port."
      return
    }
    throw "Port $Port is in use by another process."
  }
  $server = Start-Process -FilePath $nodePath -ArgumentList $NodeArgs -WorkingDirectory $WorkingDirectory -WindowStyle Hidden -RedirectStandardOutput (Join-Path $logPath "$Name.out.log") -RedirectStandardError (Join-Path $logPath "$Name.err.log") -PassThru
  Set-Content -LiteralPath $pidPath -Value $server.Id
}

$env:PORT = '3000'
Start-ProjectServer -Name vite -Port 3000 -WorkingDirectory (Join-Path $projectPath 'artifacts/bullenhaus') -NodeArgs @('node_modules/vite/bin/vite.js', '--config', 'vite.config.ts', '--host', '127.0.0.1')
Write-Output 'App: http://localhost:3000'
Write-Output 'Using configured remote Supabase'
