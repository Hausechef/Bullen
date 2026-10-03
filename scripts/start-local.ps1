$ErrorActionPreference = 'Stop'
$projectPath = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $projectPath
$logPath = Join-Path $projectPath '.local/dev'
New-Item -ItemType Directory -Force -Path $logPath | Out-Null
$nodePath = (Get-Command node -ErrorAction Stop).Source
$supabasePath = (Get-Command supabase.cmd -ErrorAction Stop).Source

function Invoke-LocalCli {
  param([string[]]$CliArgs, [string]$LogName)
  $ErrorActionPreference = 'Continue'
  & $supabasePath @CliArgs *> (Join-Path $logPath $LogName)
  if ($LASTEXITCODE -ne 0) { throw "Supabase command failed. See .local/dev/$LogName" }
}

$ErrorActionPreference = 'Continue'
docker info --format '{{.ServerVersion}}' *> (Join-Path $logPath 'docker-status.log')
if ($LASTEXITCODE -ne 0) {
  Write-Output 'Starting Docker Desktop...'
  docker desktop start *> (Join-Path $logPath 'docker-start.log')
  if ($LASTEXITCODE -ne 0) { throw 'Docker Desktop could not start.' }
}
docker network inspect bullenhaus-local-only *> (Join-Path $logPath 'network-status.log')
if ($LASTEXITCODE -ne 0) {
  docker network create -o com.docker.network.bridge.host_binding_ipv4=127.0.0.1 bullenhaus-local-only | Out-Null
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the local Docker network.' }
}
$ErrorActionPreference = 'Stop'
Write-Output 'Starting local Supabase...'
Invoke-LocalCli -CliArgs @('start', '--network-id', 'bullenhaus-local-only') -LogName 'supabase-start.log'
& $nodePath scripts/local-services.mjs
if ($LASTEXITCODE -ne 0) { throw 'Could not configure local Supabase services.' }
$ErrorActionPreference = 'Continue'
$statusOutput = (& $supabasePath status -o json 2> (Join-Path $logPath 'supabase-status.err.log')) -join "`n"
if ($LASTEXITCODE -ne 0) { throw 'Local Supabase is not ready.' }
$ErrorActionPreference = 'Stop'
[System.IO.File]::WriteAllText((Join-Path $logPath 'supabase-status.json'), $statusOutput, [System.Text.UTF8Encoding]::new($false))
& $nodePath scripts/local-env.mjs
if ($LASTEXITCODE -ne 0) { throw 'Could not configure the local environment.' }

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

Start-ProjectServer -Name api -Port 3001 -WorkingDirectory (Join-Path $projectPath 'api') -NodeArgs @('--env-file=../.local/dev/server.env', '--import', 'tsx', 'dev-server.mjs')
$env:PORT = '3000'
Start-ProjectServer -Name vite -Port 3000 -WorkingDirectory (Join-Path $projectPath 'artifacts/bullenhaus') -NodeArgs @('node_modules/vite/bin/vite.js', '--config', 'vite.config.ts', '--host', '127.0.0.1')
Write-Output 'App: http://localhost:3000'
Write-Output 'Supabase Studio: http://127.0.0.1:54333'
Write-Output 'Local email inbox: http://127.0.0.1:54334'
