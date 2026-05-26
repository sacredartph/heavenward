# install_heavenward_service.ps1
# Run ELEVATED (Administrator). Installs Heavenward as an auto-restarting,
# auto-starting Windows service via NSSM so a tooling disconnect or a crash
# can never take the live site offline again.
#
# Mirrors the existing Kapitan service: AppExit=Restart, 3s restart delay,
# auto-start on boot, rotating stdout/stderr logs.
$ErrorActionPreference = 'Stop'

$svc  = 'Heavenward'
$node = 'C:\Program Files\nodejs\node.exe'
$app  = 'C:\heavenward\backend\server.js'
$dir  = 'C:\heavenward'
$port = 4200

Write-Host '== Heavenward service installer =='

# SAFETY: this machine also runs the Kapitan business OS (Python, port 8765,
# NSSM service "Kapitan"). Record Kapitan's pids so we can never stop them.
$kapPid = (Get-NetTCPConnection -LocalPort 8765 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
$kapSvcPid = (Get-CimInstance Win32_Service -Filter "Name='Kapitan'" -ErrorAction SilentlyContinue).ProcessId
$protected = @(); if ($kapPid) { $protected += [int]$kapPid }; if ($kapSvcPid) { $protected += [int]$kapSvcPid }
Write-Host ("Protecting Kapitan pids: {0}" -f ($protected -join ', '))

# 1. Free port 4200 ONLY: stop the node process bound to Heavenward's port.
#    Never stop a protected (Kapitan) pid, and 4200 != 8765 so this is doubly safe.
$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
foreach ($c in $conns) {
  if ($protected -contains [int]$c.OwningProcess) { Write-Host ("REFUSE to stop protected pid {0}" -f $c.OwningProcess); continue }
  try {
    Stop-Process -Id $c.OwningProcess -Force -ErrorAction Stop
    Write-Host ("Stopped PID {0} that held port {1}" -f $c.OwningProcess, $port)
  } catch {}
}

# 2. Remove any existing service of the same name for a clean reinstall.
$existing = Get-Service -Name $svc -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host 'Existing Heavenward service found - removing for clean reinstall'
  & nssm stop   $svc confirm | Out-Null
  & nssm remove $svc confirm | Out-Null
  Start-Sleep -Seconds 2
}

# 3. Install + configure.
& nssm install $svc $node $app
& nssm set $svc AppDirectory $dir
& nssm set $svc AppExit Default Restart
& nssm set $svc AppRestartDelay 3000
& nssm set $svc Start SERVICE_AUTO_START
& nssm set $svc AppStdout ("{0}\logs\service-out.log" -f $dir)
& nssm set $svc AppStderr ("{0}\logs\service-err.log" -f $dir)
& nssm set $svc AppStdoutCreationDisposition 4
& nssm set $svc AppStderrCreationDisposition 4
& nssm set $svc AppRotateFiles 1
& nssm set $svc AppRotateBytes 5242880
& nssm set $svc DisplayName 'Heavenward'
& nssm set $svc Description 'Heavenward family prayer app (Node/Express, port 4200)'

# 4. Start the service.
& nssm start $svc
Start-Sleep -Seconds 3

# 5. Verify.
Write-Host '-- service status --'
& nssm status $svc
try {
  $r = Invoke-RestMethod -Uri ("http://localhost:{0}/api/health" -f $port) -TimeoutSec 5
  Write-Host ("HEALTH OK: {0}" -f ($r | ConvertTo-Json -Compress))
} catch {
  Write-Host ("HEALTH CHECK FAILED: {0}" -f $_.Exception.Message)
}
Write-Host '== Done. Heavenward will now auto-start on boot and auto-restart on crash. =='
