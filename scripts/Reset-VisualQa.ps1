$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repositoryRoot "docker-compose.visual-qa.yml"
$projectName = "cloud-service-store-visual-qa"
$qaVolumeName = "cloud-service-store-visual-qa-mssql-data"

if (-not (Test-Path -LiteralPath $composeFile)) {
    throw "Visual QA compose file was not found: $composeFile"
}

if ($qaVolumeName -in @("sqlserver-data", "cloud-service-store-sqlserver")) {
    throw "Refusing to reset a non-Visual-QA volume."
}

docker compose --project-name $projectName --file $composeFile down --volumes --remove-orphans
docker compose --project-name $projectName --file $composeFile up --build --detach
