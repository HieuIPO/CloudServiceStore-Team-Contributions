Write-Host "=========================================="
Write-Host "CloudServiceStore - System Test Automation"
Write-Host "=========================================="

Write-Host "`n[1/3] Updating Database & Applying Migrations..."
dotnet ef database update -p Infrastructure/Infrastructure.csproj -s WebApi/WebApi.csproj

Write-Host "`n[2/3] Starting Backend API Server (WebApi)..."
Start-Process "dotnet" -ArgumentList "run --project WebApi" -WindowStyle Normal

Write-Host "`n[3/3] Starting Frontend Next.js Server..."
Set-Location "frontend"
Start-Process "npm" -ArgumentList "run dev" -WindowStyle Normal
Set-Location ".."

Write-Host "`n=========================================="
Write-Host "Servers are starting up!"
Write-Host "- Backend API: https://localhost:7225/swagger"
Write-Host "- Frontend Web: http://localhost:3000/admin/promotions"
Write-Host "=========================================="
Write-Host "Press any key to exit this script..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
