# Visual QA stack

The Visual QA stack is isolated from the development SQL Server and API:

- Frontend: `http://localhost:3002` / `http://127.0.0.1:3002`
- API: `http://localhost:8081`
- Database: `CloudServiceStoreVisualQa`
- SQL Server port: `1434`
- Compose volume: `cloud-service-store-visual-qa-mssql-data`

The stack reads `MSSQL_SA_PASSWORD`, `SEED_ADMIN_PASSWORD` and `JWT_SIGNING_KEY` from the repository `.env` file. The password is used only to create the synthetic Admin and Editor accounts and is never written to audit artifacts.

```powershell
.\scripts\Start-VisualQa.ps1
.\scripts\Run-VisualQaAudit.ps1
```

The audit uses Chrome DevTools Protocol through the system Chrome binary. It does not add Playwright or another browser dependency to the frontend. Screenshots and reports are written to `tmp/admin-visual-qa/<timestamp>/`.

To reset only the QA stack and its named volumes:

```powershell
.\scripts\Reset-VisualQa.ps1
```

`Seed:VisualQaData=true` is rejected unless the API environment is `Development` or `Testing`. The seed uses fixed GUIDs, so restarting the API or running it twice does not create duplicate sample rows.
