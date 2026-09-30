<#
deploy-functions.ps1

Usage:
  .\deploy-functions.ps1            # uses embedded KEY (not recommended)
  .\deploy-functions.ps1 -Key "NEW_KEY"            # safer: pass key as argument
  .\deploy-functions.ps1 -Key "NEW_KEY" -Project "my-firebase-project-id"

Security notes:
- This script will contain or accept a secret API key. Do NOT commit this file to git with the key embedded.
- Prefer passing the key as a parameter at runtime, then delete this file after use.
#>

param(
    [string]$Key = "",
    [string]$Project = ""
)

Write-Host "WARNING: This script will set a secret on your Firebase Functions config." -ForegroundColor Yellow
Write-Host "Make sure you trust the environment and delete this script after use." -ForegroundColor Yellow

if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) {
    Write-Error "Firebase CLI not found in PATH. Install and login (firebase login) before running this script.";
    exit 1
}

if ([string]::IsNullOrWhiteSpace($Key)) {
    Write-Error "API key is empty. Provide a key with -Key parameter.";
    exit 1
}

if ($Project -ne "") {
    $setCmd = "firebase functions:config:set openai.key=`"$Key`" --project $Project"
    $deployCmd = "firebase deploy --only functions --project $Project"
} else {
    $setCmd = "firebase functions:config:set openai.key=`"$Key`""
    $deployCmd = "firebase deploy --only functions"
}

Write-Host "Setting functions config..." -ForegroundColor Cyan
Write-Host $setCmd
cmd.exe /c $setCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to set functions config. Aborting deploy.";
    exit $LASTEXITCODE
}

Write-Host "Deploying functions..." -ForegroundColor Cyan
Write-Host $deployCmd
cmd.exe /c $deployCmd

if ($LASTEXITCODE -ne 0) {
    Write-Error "Functions deploy failed.";
    exit $LASTEXITCODE
}

Write-Host "Done. After verifying, delete this script to avoid leaving secrets on disk." -ForegroundColor Green
