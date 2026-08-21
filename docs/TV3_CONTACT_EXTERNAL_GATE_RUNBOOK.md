# Runbook gate ngoài sandbox — Contact Request TV3/Duy

## Mục tiêu và phạm vi

Tài liệu này hướng dẫn chạy các gate không thể hoàn tất trong sandbox hiện tại: frontend production build bị dừng tại lỗi baseline `/admin/news`, Docker database rỗng, SQL Server disposable migration/app-lock và browser end-to-end. Nó **không** cho phép sửa `News`, `Reporting`, `Auth`, `Order`, `Affiliate`, `Landing` hoặc push vào repository `HieuIPO/CloudServiceStore-Team-Contributions`.

Source Contact đã được tích hợp cục bộ, build Release và `dotnet test` đã pass 234/234. Migration được sinh là `20260819141407_AddContactRequestManagement`. Khi chạy lại các gate ở máy team, luôn kiểm tra diff trước; không tạo migration thứ hai nếu migration này còn nguyên vẹn.

## Điều kiện đầu vào

| Điều kiện | Cách xác nhận | Không đạt thì làm gì |
|---|---|---|
| Working copy đúng baseline + Contact | Có `CloudServiceStore.sln`, `src/`, `frontend/`, `docker-compose.yml`, `docker-compose.contact-empty.yml` và migration Contact. | Dùng đúng working copy được bàn giao, không copy đè file shared. |
| Không ở `main` hoặc `dev` khi tạo migration mới | `git branch --show-current` trả feature branch. | Tạo branch feature từ `dev`; migration hiện tại không cần sinh lại nếu không có model change. |
| Docker Desktop/Engine đang chạy | `docker version` trả thông tin Server. | Không chạy command reset hoặc smoke; nhờ owner môi trường Docker. |
| Biến môi trường Compose được cấp an toàn | Có `.env` cục bộ theo `.env.example`; không commit `.env`. | Xin secret từ team lead/owner môi trường. |
| SQL Server integration database disposable | Database test có tiền tố `ContactRequestIntegration_`, không phải DB dev/staging/prod. | Không chạy test SQL Server destructive. |

## 1. Xử lý gate frontend ngoài phạm vi TV3

Trước tiên, owner module News cần xử lý hoặc xác nhận lỗi prerender `/admin/news`: `TypeError: Cannot read properties of null (reading 'use')`. TV3 chỉ được ghi nhận lỗi và chờ patch từ owner; không tự sửa nguồn News trong branch Contact.

Sau khi owner cập nhật baseline hoặc xác nhận cách khắc phục, chạy toàn frontend từ thư mục `frontend`:

```bash
npm ci --no-audit --no-fund
npm run lint
npm run build
```

Evidence hợp lệ là output `npm run build` có exit code 0, không chỉ có thông báo `Compiled successfully` trước giai đoạn prerender/export. Nếu build vẫn lỗi ở route ngoài Contact, lưu route, stack trace và owner; không đổi phạm vi PR TV3 để che lỗi baseline.

## 2. Kiểm tra cấu hình Compose trước khi chạy

Trong thư mục root repository, xác minh Compose render được mà không in warning thiếu biến:

```bash
docker compose -f docker-compose.yml -f docker-compose.contact-empty.yml config
```

File `.env` là secret cục bộ. Không gửi giá trị `MSSQL_SA_PASSWORD`, `JWT_SIGNING_KEY`, `SEED_ADMIN_PASSWORD` hoặc API key vào chat, log nộp, commit hay PR. Chỉ dùng `.env.example` làm danh sách tên biến.

## 3. Docker database rỗng và migrator one-shot

Chạy PowerShell tại root repository. Tham số `-Reset` chỉ tác động volume của Compose override Contact rỗng; không thay thế bằng lệnh xoá volume chung tùy ý.

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\Run-ContactRequestEmptyDatabase.ps1 -Reset
```

Script phải quan sát migrator tối đa 180 giây, yêu cầu `migrator` có state `exited` và exit code `0`, rồi yêu cầu `http://localhost:8080/health` trả HTTP 200. Khi fail, lưu nguyên output của ba lệnh chỉ đọc sau, đã che secret:

```bash
docker compose -f docker-compose.yml -f docker-compose.contact-empty.yml ps --all
docker compose -f docker-compose.yml -f docker-compose.contact-empty.yml logs migrator
docker compose -f docker-compose.yml -f docker-compose.contact-empty.yml logs api
```

Evidence đạt gồm compose config, state/exit code migrator, health HTTP 200 và log không chứa secret. Không ghi `Docker PASS` nếu thiếu một trong bốn bằng chứng này.

## 4. SQL Server disposable migration và app-lock

Chỉ sau khi có SQL Server test tách biệt, đặt biến cho **phiên shell hiện tại**, không hard-code connection string vào file:

```powershell
$env:CONTACT_TEST_SQLSERVER_CONNECTION_STRING = '<connection-string-to-ContactRequestIntegration_TV3>'
dotnet test tests/CloudServiceStore.Integration.Tests/CloudServiceStore.Integration.Tests.csproj `
  --configuration Release `
  --filter 'FullyQualifiedName~ContactRequestSqlServerMigrationTests'
```

Test này gọi `EnsureDeletedAsync()` và `MigrateAsync()`, vì vậy database phải disposable và tên phải bắt đầu `ContactRequestIntegration_`. Evidence đạt khi các case migration DB rỗng, concurrent same-email, concurrent different-email, cancellation, rollback và lock timeout pass. Không dùng database `CloudServiceStore` của dev/staging/prod.

Ngoài test thực, có thể tạo script SQL và rà scope trước khi update database:

```bash
dotnet ef migrations script 20260813143000_AddAffiliateApplicationCustomerOwnership 20260819141407_AddContactRequestManagement \
  --idempotent \
  --project src/CloudServiceStore.Infrastructure \
  --startup-project src/CloudServiceStore.WebApi \
  --configuration Release \
  --no-build \
  --output /tmp/contact-request-migration.sql
```

Chỉ chấp nhận DDL cho `ContactRequests`, `ContactRequestStatusHistories`, index Contact, FK `ContactRequests -> AppUsers` và history FK tới Contact. Nếu xuất hiện `CreateTable`, `DropTable` hoặc `AlterColumn` cho Auth, News, Order, Promotion hoặc Affiliate, dừng, xóa migration mới sinh và điều tra model drift. Không sửa migration bằng tay để che drift.

## 5. Smoke và browser end-to-end

Sau Docker health 200, demo theo thứ tự sau đây bằng account Admin/Editor do team cấp qua `SEED_ADMIN_PASSWORD` trong môi trường cục bộ. Không ghi password vào report.

| Bước | Thao tác | Kết quả cần thấy |
|---|---|---|
| Public submit | Mở `/contact`, nhập payload hợp lệ và gửi. | HTTP 201, màn hình xác nhận có request id. |
| Duplicate window | Gửi lại cùng email trong 24 giờ. | HTTP 409 với `application/problem+json`. |
| Rate limit | Gửi vượt `ContactPermitLimit` theo cùng trusted client IP. | HTTP 429 và ProblemDetails. |
| Admin list | Đăng nhập Admin/Editor, mở `/admin/contact-requests`. | List, search, filter, paging tải thành công. |
| Workflow | Mở detail Pending, chuyển Contacted, sau đó Approved/Rejected/Cancelled theo transition backend trả về. | History hiển thị; UI không tự hard-code workflow. |
| Authorization | Dùng account Customer gọi/list endpoint quản trị. | HTTP 403. |
| Terminal state | Thử chuyển sau Approved/Rejected/Cancelled. | HTTP 409. |

Chụp tối thiểu bốn ảnh evidence thật: `/contact` desktop, `/contact` 360px, `/admin/contact-requests` desktop sau đăng nhập, `/admin/contact-requests` 360px sau đăng nhập. Ảnh phải có nguồn từ môi trường đang chạy, không dùng mock hoặc asset tạo sẵn.

## 6. Điều kiện để chuyển sang GitHub

Chỉ sau khi frontend build, Docker/health và SQL Server disposable test đã có evidence, TV3 mới xin PAT mới cho repository integration riêng. Khi đó mới commit source đúng identity TV3, push branch feature riêng, mở PR vào `dev` và yêu cầu review thật. Không merge PR #1, không push trực tiếp `main`, không tự approve/review giả và không ghi vào repository HieuIPO.
