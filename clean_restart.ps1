# clean_restart.ps1 - decisively clear ALL Heavenward node processes (orphans +
# service) and bring up exactly ONE under the NSSM service. Logged so the
# non-elevated caller can read the result.
#
# SAFETY (this machine also runs the Kapitan business OS):
#   * Kapitan is a PYTHON app on port 8765, managed by the NSSM "Kapitan" service.
#   * Heavenward is a NODE app on port 4200, managed by the NSSM "Heavenward" service.
#   * This script ONLY ever: touches the "Heavenward" service, kills node.exe
#     processes whose command line runs Heavenward's server.js, and operates on
#     port 4200. It explicitly refuses to touch python, port 8765, or Kapitan.
$ErrorActionPreference = 'Continue'
$log = 'C:\heavenward\logs\clean_restart.log'
function L($m) { $m | Out-File -FilePath $log -Append -Encoding utf8 }
"== clean restart $(Get-Date -Format o) ==" | Out-File -FilePath $log -Encoding utf8

$SERVICE   = 'Heavenward'
$HW_PORT   = 4200
$KAP_PORT  = 8765
# Kill ONLY processes whose command line contains Heavenward's FULL path.
# This is the critical safety line: other node apps on this box (LOGOS at
# C:\KAPITAN\logos-apologetics\backend\server.js, etc.) also run "backend/server.js",
# so matching the bare filename would kill them too. The full path cannot collide.
$HW_MATCH  = 'heavenward\backend\server.js'

# --- Pre-flight: record EVERY other service's pids so we can never touch them -
$protectedPids = @()
foreach ($svcName in @('Kapitan','LOGOS')) {
  $svc = Get-CimInstance Win32_Service -Filter "Name='$svcName'" -ErrorAction SilentlyContinue
  if ($svc -and $svc.ProcessId) { $protectedPids += [int]$svc.ProcessId; L "PROTECT $svcName wrapper-pid=$($svc.ProcessId) state=$($svc.State)" }
}
foreach ($p in @($KAP_PORT, 4101, 4300)) {
  $o = (Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
  if ($o) { $protectedPids += [int]$o; L "PROTECT port $p -> pid $o" }
}
# Belt-and-braces: protect every NON-Heavenward node server.js process by pid,
# so even a path-match mistake can't reach another project.
Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -and ($_.CommandLine -like '*server.js*') -and ($_.CommandLine -notlike "*$HW_MATCH*") } |
  ForEach-Object { $protectedPids += [int]$_.ProcessId; L "PROTECT non-Heavenward node pid $($_.ProcessId): $($_.CommandLine)" }
$protectedPids = $protectedPids | Select-Object -Unique

# Hard guard: this script must only ever act on the Heavenward service.
if ($SERVICE -ne 'Heavenward') { L "ABORT: service guard tripped"; exit 1 }

# 1. Stop the Heavenward service so NSSM won't auto-restart mid-cleanup.
L "stopping $SERVICE..."
& nssm stop $SERVICE confirm 2>&1 | Out-String | ForEach-Object { L $_ }
Start-Sleep -Seconds 2

# 2. Kill ONLY node.exe processes running Heavenward's server.js.
#    Triple-guarded: must be node.exe, must reference server.js, must NOT be a
#    protected (Kapitan) pid, must NOT be python.
$procs = Get-CimInstance Win32_Process -Filter "Name='node.exe'" |
  Where-Object { $_.CommandLine -and ($_.CommandLine -like "*$HW_MATCH*") }
foreach ($p in $procs) {
  if ($protectedPids -contains [int]$p.ProcessId) { L "REFUSE to kill protected pid $($p.ProcessId)"; continue }
  L "killing node PID $($p.ProcessId) (started $($p.CreationDate))  cmd=$($p.CommandLine)"
  try { Stop-Process -Id $p.ProcessId -Force -ErrorAction Stop } catch { L "  could not kill: $($_.Exception.Message)" }
}
Start-Sleep -Seconds 2

# 3. Confirm Heavenward's port is free; confirm Kapitan's port is UNTOUCHED.
$held = Get-NetTCPConnection -LocalPort $HW_PORT -State Listen -ErrorAction SilentlyContinue
if ($held) { L "WARNING: port $HW_PORT still held by PID $($held.OwningProcess)" } else { L "port $HW_PORT is free" }
$kapStill = (Get-NetTCPConnection -LocalPort $KAP_PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
L "Kapitan port $KAP_PORT still held by PID $kapStill (should be unchanged: $kapPid)"

# 4. Start Heavenward fresh.
L "starting $SERVICE..."
& nssm start $SERVICE 2>&1 | Out-String | ForEach-Object { L $_ }
Start-Sleep -Seconds 4

# 5. Verify Heavenward, and re-verify Kapitan is alive.
$owner = (Get-NetTCPConnection -LocalPort $HW_PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
L "port $HW_PORT held by PID: $owner"
L "$SERVICE status: $((Get-Service $SERVICE).Status)"
try { $h = Invoke-RestMethod ("http://localhost:{0}/api/health" -f $HW_PORT) -TimeoutSec 6; L "Heavenward health: $($h | ConvertTo-Json -Compress)" } catch { L "Heavenward health FAILED: $($_.Exception.Message)" }
$kapEnd = Get-CimInstance Win32_Service -Filter "Name='Kapitan'" -ErrorAction SilentlyContinue
L "Kapitan AFTER: service-state=$($kapEnd.State) port-$KAP_PORT-pid=$((Get-NetTCPConnection -LocalPort $KAP_PORT -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess)"
"== done ==" | Out-File -FilePath $log -Append -Encoding utf8
