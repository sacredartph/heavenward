# deploy_auth_fix.ps1 - elevated: restart Heavenward to load the no-expiry auth
# change, then PROVE an already-expired token is accepted (so no family re-login).
$ErrorActionPreference = 'Continue'
$log = 'C:\heavenward\logs\deploy_auth_fix.log'
function L($m) { $m | Out-File -FilePath $log -Append -Encoding utf8 }
"== deploy auth fix $(Get-Date -Format o) ==" | Out-File -FilePath $log -Encoding utf8

# Restart ONLY the Heavenward service.
& nssm restart Heavenward 2>&1 | Out-String | ForEach-Object { L $_ }
Start-Sleep -Seconds 5
L "Heavenward status: $((Get-Service Heavenward).Status)"
$owner = (Get-NetTCPConnection -LocalPort 4200 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
L "port 4200 held by PID: $owner"

# Prove the fix: mint a token that EXPIRED an hour ago and confirm it now works.
$nodeTest = @'
require("dotenv").config({ path: "C:/heavenward/.env" });
const jwt = require("jsonwebtoken");
const http = require("http");
const SECRET = process.env.JWT_SECRET || "heavenward-manubag-family-deo-gratias-phase-0-9";
// iat 2h ago, exp 1h ago -> definitively expired under the old policy.
const now = Math.floor(Date.now()/1000);
const token = jwt.sign({ uid:3, email:"manubagbryan@gmail.com", role:"tatay", family_id:2, name:"Bryan", iat: now-7200, exp: now-3600 }, SECRET);
const req = http.request({ host:"localhost", port:4200, path:"/api/hours/today", headers:{ Authorization:"Bearer "+token } }, res => {
  console.log("EXPIRED-TOKEN TEST -> HTTP " + res.statusCode + (res.statusCode===200 ? " (ACCEPTED - no re-login needed)" : " (still rejected)"));
});
req.on("error", e => console.log("test error: " + e.message));
req.end();
'@
$nodeTest | Out-File -FilePath 'C:\heavenward\logs\_expirytest.js' -Encoding ascii
$result = & 'C:\Program Files\nodejs\node.exe' 'C:\heavenward\logs\_expirytest.js' 2>&1 | Out-String
L ("EXPIRY TEST: " + $result.Trim())
Remove-Item 'C:\heavenward\logs\_expirytest.js' -ErrorAction SilentlyContinue
"== done ==" | Out-File -FilePath $log -Append -Encoding utf8
