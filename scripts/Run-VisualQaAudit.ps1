$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$auditScript = Join-Path $repositoryRoot "tools\visual-qa-audit.mjs"

if (-not $env:SEED_ADMIN_PASSWORD) {
    $envFile = Join-Path $repositoryRoot ".env"
    if (Test-Path -LiteralPath $envFile) {
        $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^SEED_ADMIN_PASSWORD=' } | Select-Object -First 1
        if ($line) { $env:SEED_ADMIN_PASSWORD = $line.Substring("SEED_ADMIN_PASSWORD=".Length) }
    }
}

if (-not $env:SEED_ADMIN_PASSWORD) {
    throw "SEED_ADMIN_PASSWORD must be provided through the environment or the local .env file."
}

Push-Location $repositoryRoot
try {
    node $auditScript
}
finally {
    Pop-Location
}
