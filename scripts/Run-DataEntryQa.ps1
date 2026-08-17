param(
    [switch]$SkipResetBefore
)

$ErrorActionPreference = "Stop"

$repositoryRoot = Split-Path -Parent $PSScriptRoot
$composeFile = Join-Path $repositoryRoot "docker-compose.visual-qa.yml"
$resetScript = Join-Path $repositoryRoot "scripts\Reset-VisualQa.ps1"
$runner = Join-Path $repositoryRoot "tools\data-entry-qa.mjs"
$projectName = "cloud-service-store-visual-qa"
$qaVolumeName = "cloud-service-store-visual-qa-mssql-data"

if (-not (Test-Path -LiteralPath $composeFile)) { throw "Visual QA compose file was not found: $composeFile" }
if (-not (Test-Path -LiteralPath $runner)) { throw "Data-entry QA runner was not found: $runner" }
if (-not (Test-Path -LiteralPath $resetScript)) { throw "Visual QA reset script was not found: $resetScript" }
if ($qaVolumeName -in @("sqlserver-data", "cloud-service-store-sqlserver")) { throw "Refusing to reset a non-Visual-QA volume." }

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

if (-not $env:DATA_ENTRY_QA_RUN_ID) {
    $env:DATA_ENTRY_QA_RUN_ID = [DateTime]::UtcNow.ToString("yyyyMMdd-HHmmss-fff")
}

function Wait-VisualQaFrontend {
    $deadline = [DateTime]::UtcNow.AddMinutes(5)
    while ([DateTime]::UtcNow -lt $deadline) {
        $response = $null
        try {
            $request = [System.Net.WebRequest]::CreateHttp("http://127.0.0.1:3002/login")
            $request.Timeout = 8000
            $response = $request.GetResponse()
            if ([int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 400) { $response.Close(); return }
        } catch {
            # The container can accept TCP before Next.js has completed its first compile.
        } finally {
            if ($response) { $response.Close() }
        }
        Start-Sleep -Seconds 2
    }
    throw "Visual QA frontend did not become reachable at http://127.0.0.1:3002/login within five minutes."
}

function Update-CleanupArtifact {
    param(
        [string]$Status,
        [string]$Detail
    )

    $artifactPath = Join-Path $repositoryRoot ("tmp\data-entry-qa\" + $env:DATA_ENTRY_QA_RUN_ID)
    $jsonPath = Join-Path $artifactPath "report.json"
    $markdownPath = Join-Path $artifactPath "report.md"
    $cleanupPath = Join-Path $artifactPath "cleanup.json"
    $cleanup = [ordered]@{
        status = $Status
        detail = $Detail
        database = "CloudServiceStoreVisualQa"
        project = $projectName
        volume = $qaVolumeName
        recordedAt = [DateTime]::UtcNow.ToString("o")
    }

    New-Item -ItemType Directory -Force -Path $artifactPath | Out-Null

    if (Test-Path -LiteralPath $jsonPath) {
        $report = Get-Content -LiteralPath $jsonPath -Raw | ConvertFrom-Json
        $report.cleanup.status = $Status
        if ($report.cleanup.PSObject.Properties.Name -contains "detail") { $report.cleanup.detail = $Detail } else { $report.cleanup | Add-Member -NotePropertyName detail -NotePropertyValue $Detail }
        if ($report.cleanup.PSObject.Properties.Name -contains "recordedAt") { $report.cleanup.recordedAt = $cleanup.recordedAt } else { $report.cleanup | Add-Member -NotePropertyName recordedAt -NotePropertyValue $cleanup.recordedAt }
        $report | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $jsonPath -Encoding utf8
    }
    if (Test-Path -LiteralPath $markdownPath) {
        $markdown = Get-Content -LiteralPath $markdownPath -Raw
        $markdown = $markdown -replace 'Recorded runner cleanup status: \*\*pending\*\*', "Recorded runner cleanup status: **$Status**"
        Add-Content -LiteralPath $markdownPath -Value "`nCleanup detail: $Detail"
        Set-Content -LiteralPath $markdownPath -Value $markdown -Encoding utf8
    }
    $cleanup | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $cleanupPath -Encoding utf8
}

$runnerExitCode = 1
$cleanupStatus = "failed"
$cleanupDetail = "Cleanup was not attempted."

try {
    if (-not $SkipResetBefore) {
        & $resetScript
    } else {
        docker compose --project-name $projectName --file $composeFile up --build --detach
    }

    Wait-VisualQaFrontend

    Push-Location $repositoryRoot
    try {
        node $runner
        $runnerExitCode = $LASTEXITCODE
    } finally {
        Pop-Location
    }
} finally {
    try {
        & $resetScript
        Wait-VisualQaFrontend
        $cleanupStatus = "reset-and-reseeded"
        $cleanupDetail = "Visual QA SQL volume was reset and the Visual QA stack was started again."
    } catch {
        $cleanupStatus = "failed"
        $cleanupDetail = "Visual QA reset failed: " + $_.Exception.Message
    }
    Update-CleanupArtifact -Status $cleanupStatus -Detail $cleanupDetail
}

Write-Output ("Data-entry QA artifact: tmp/data-entry-qa/" + $env:DATA_ENTRY_QA_RUN_ID)
Write-Output ("Runner exit code: " + $runnerExitCode)
Write-Output ("Cleanup status: " + $cleanupStatus)

if ($cleanupStatus -eq "failed") { exit 3 }
exit $runnerExitCode
