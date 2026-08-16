$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repositoryRoot "docker-compose.visual-qa.yml"
$projectName = "cloud-service-store-visual-qa"

if (-not (Test-Path -LiteralPath $composeFile)) {
    throw "Visual QA compose file was not found: $composeFile"
}

docker compose --project-name $projectName --file $composeFile up --build --detach
