# restart_service.ps1 - elevated restart of the Heavenward service, with a log
# so the (non-elevated) caller can see what actually happened.
$ErrorActionPreference = 'Continue'
$log = 'C:\heavenward\logs\restart.log'
"== restart attempt $(Get-Date -Format o) ==" | Out-File -FilePath $log -Encoding utf8
try {
  "whoami: $(whoami)" | Out-File -FilePath $log -Append -Encoding utf8
  $before = (Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*server.js*' })
  "before PID: $($before.ProcessId) started $($before.CreationDate)" | Out-File -FilePath $log -Append -Encoding utf8
  $out = & nssm restart Heavenward 2>&1
  "nssm output: $out" | Out-File -FilePath $log -Append -Encoding utf8
  Start-Sleep -Seconds 4
  $after = (Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*server.js*' })
  "after PID: $($after.ProcessId) started $($after.CreationDate)" | Out-File -FilePath $log -Append -Encoding utf8
  "service status: $((Get-Service Heavenward).Status)" | Out-File -FilePath $log -Append -Encoding utf8
} catch {
  "ERROR: $($_.Exception.Message)" | Out-File -FilePath $log -Append -Encoding utf8
}
"== done ==" | Out-File -FilePath $log -Append -Encoding utf8
