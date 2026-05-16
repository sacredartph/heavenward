# Run this as Administrator.
# Updates the SYSTEM cloudflared config to route heavenward.sacredartph.com -> localhost:4200,
# restarts the service, and verifies.

$ErrorActionPreference = 'Stop'

$systemConfig = 'C:\Windows\System32\config\systemprofile\.cloudflared\config.yml'

Write-Host "[1/4] Reading current SYSTEM config..."
$content = Get-Content -Raw $systemConfig
Write-Host $content

if ($content -match 'heavenward\.sacredartph\.com') {
  Write-Host "[2/4] heavenward already present in SYSTEM config; skipping edit."
} else {
  Write-Host "[2/4] Adding heavenward.sacredartph.com -> http://localhost:4200"
  # Insert the new ingress before the catch-all '- service: http_status:404' line.
  $insert = "  - hostname: heavenward.sacredartph.com`r`n    service: http://localhost:4200`r`n"
  $new = $content -replace '(?m)^(\s*- service:\s*http_status:404)', ($insert + '$1')
  Copy-Item $systemConfig "$systemConfig.bak" -Force
  Set-Content -Path $systemConfig -Value $new -Encoding utf8 -NoNewline
  Write-Host "Backup saved at $systemConfig.bak"
  Write-Host "New config:"
  Get-Content -Raw $systemConfig
}

Write-Host "[3/4] Restarting Cloudflared service..."
Restart-Service Cloudflared
Start-Sleep -Seconds 4

Write-Host "[4/4] Verifying https://heavenward.sacredartph.com/api/health"
try {
  $resp = Invoke-WebRequest -Uri 'https://heavenward.sacredartph.com/api/health' -UseBasicParsing -TimeoutSec 10
  Write-Host "HTTP $($resp.StatusCode):"
  Write-Host $resp.Content
} catch {
  Write-Host "Request failed: $($_.Exception.Message)"
}
