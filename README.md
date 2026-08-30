# CloudServiceStore

Website giới thiệu dịch vụ Cloud và tiếp nhận yêu cầu đặt VPS, Hosting, Domain, Email doanh nghiệp, SSL và Anti-DDoS. MVP không thực hiện thanh toán hoặc tự cấp phát VPS/domain thật.

## Kiến trúc

- Backend: ASP.NET Core Web API (.NET 10 LTS), Clean Architecture: Domain, Application, Infrastructure, WebApi. Đề PDF nêu .NET 8/9; nhóm giữ .NET 10 LTS theo xác nhận/trao đổi với giảng viên về việc dùng công nghệ mới nhất. Khi nộp báo cáo cần đính kèm hoặc ghi rõ căn cứ xác nhận này.
- Frontend: Next.js App Router + TypeScript tại `frontend/`.
- Database: SQL Server; ERD và quy tắc version giá: [docs/erd.md](docs/erd.md).

## Chạy local

1. Cài .NET SDK 10, Node.js 24+ và Docker Desktop.
2. Sao chép `.env.example` thành `.env`, sau đó thay các giá trị phát triển trong file `.env`.
3. Chạy `docker compose up --build`.
4. Terminal khác: chạy `cd frontend; npm ci; npm run dev` để mở frontend tại `http://localhost:3000`.
5. API health check: `http://localhost:8080/health`.

Khi database trống, API chạy EF migrations và seed hai tài khoản demo. Seed mặc định không đưa dữ liệu vận hành giả vào Catalog/News.

### Tài khoản demo

- **Admin:** `admin@cloud.local`
- **Editor:** `editor@cloud.local`
- **Mật khẩu ban đầu:** giá trị `SEED_ADMIN_PASSWORD` trong file `.env` (mẫu trong `.env.example` là `ChangeMe123!`). Cả hai tài khoản staff dùng cùng mật khẩu seed này trong môi trường phát triển.
- `MSSQL_SA_PASSWORD` chỉ là mật khẩu tài khoản `sa` của SQL Server, không phải mật khẩu đăng nhập website.
- **Customer:** không seed sẵn; đăng ký tài khoản mới tại `/login` để thực hiện luồng đặt dịch vụ và affiliate.

Dữ liệu Catalog, Pricing, Promotion, News, Order, Affiliate, Dashboard và Audit Log được đọc/ghi trên SQL Server thật của stack chính. Docker lưu database trong volume `sqlserver-data`; volume và dữ liệu runtime không được đưa lên Git, chỉ migration và mã nguồn được quản lý phiên bản.

## Authentication

- `POST /api/v1/auth/login`: trả access token 15 phút và đặt refresh token 7 ngày trong HttpOnly cookie.
- `POST /api/v1/auth/refresh`: xoay refresh token; token đã bị dùng lại sẽ thu hồi mọi refresh token còn hoạt động của user.
- `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`.
- `PUT /api/v1/auth/password`: đổi mật khẩu, thu hồi refresh session hiện có.
- Trang thử đăng nhập: `http://localhost:3000/login`.

Khi chạy API không qua Docker, đặt `Jwt__SigningKey` (ít nhất 32 ký tự) và `Seed__AdminPassword` trong environment variables; không thêm chúng vào appsettings hoặc Git.

## Nội dung công khai

- Trang chủ `/` tổng hợp nội dung Hero/About, gói nổi bật, khuyến mãi đang chạy, testimonial, customer logo và tin mới.
- Trang `/about` hiển thị nội dung doanh nghiệp, hạ tầng datacenter và cam kết SLA từ API.
- Admin quản lý tại `/admin/landing`; nội dung public đọc từ `GET /api/v1/landing-content`.
- Migration `AddPublicLandingContent` tạo `LandingPageContents`, `Testimonials` và `CustomerLogos`.

## Yêu cầu dịch vụ

- Public có thể xem catalog và mở form tại `/order`; để gửi yêu cầu, người dùng phải đăng ký/đăng nhập tài khoản `Customer`. Backend gắn yêu cầu với đúng tài khoản Customer qua `POST /api/v1/orders` và giới hạn tần suất theo IP.
- Mỗi yêu cầu chụp tên/cấu hình gói, giá gốc, giá sau khuyến mãi, mã khuyến mãi và loại tiền tại thời điểm gửi.
- Admin và Editor quản lý tại `/admin/orders`, có tìm kiếm, lọc, phân trang, chi tiết và lịch sử đổi trạng thái.
- `GET /api/v1/orders`, `GET /api/v1/orders/{id}` và `PATCH /api/v1/orders/{id}/status` yêu cầu policy `ManageOrders`.
- Migration `AddOrderRequestManagement` bổ sung snapshot giá và ràng buộc/index cho Order.

## Chương trình Affiliate

- Public xem chính sách tại `/affiliate`; để gửi hồ sơ hợp tác, người dùng phải đăng ký/đăng nhập tài khoản `Customer`. Backend gắn hồ sơ với đúng tài khoản Customer qua `POST /api/v1/affiliate-applications` và giới hạn tần suất theo IP.
- Hồ sơ trùng email trong vòng 30 ngày bị từ chối; trạng thái đi theo luồng `Pending` → `UnderReview` → `Approved`/`Rejected` và lưu lịch sử.
- Admin và Editor quản lý hồ sơ tại `/admin/affiliates`; chỉ Admin được chỉnh hoặc ẩn/hiện nội dung chương trình.
- Các thao tác tạo hồ sơ, đổi trạng thái và cập nhật chính sách đều ghi audit log.
- Migration `AddAffiliateManagement` tạo nội dung chương trình, hồ sơ đăng ký và lịch sử trạng thái.

## Dashboard, Excel và Audit Log

- Admin xem tổng quan vận hành tại `/admin/dashboard`: số Order, trạng thái xử lý, giá trị đã duyệt, Affiliate, tin tức, xu hướng theo tháng và dịch vụ được quan tâm.
- `GET /api/v1/dashboard/order-summary`, `/popular-plans` và `/service-interest` hỗ trợ lọc khoảng ngày và yêu cầu policy `ViewDashboard`.
- Admin tải `order-requests.xlsx` tại Dashboard; backend tạo workbook bằng ClosedXML và hỗ trợ lọc ngày/trạng thái.
- Mỗi lần export ghi audit `Orders.Exported`; màn `/admin/audit-logs` hỗ trợ tìm kiếm, lọc entity, phân trang và xem dữ liệu before/after.
- Dashboard, export và audit đều Admin-only; Editor nhận `403 Forbidden`.
- Module chỉ đọc các bảng hiện có nên không tạo migration mới.

## Kiểm thử chất lượng và kịch bản demo

- Chạy toàn bộ backend: `dotnet test CloudServiceStore.sln --no-restore`.
- Thu coverage Cobertura: `dotnet test CloudServiceStore.sln --collect:"XPlat Code Coverage" --results-directory TestResults`.
- CI lưu các file `coverage.cobertura.xml` thành artifact `coverage-reports` trong 14 ngày.
- Mốc kiểm chứng gần nhất: 183 backend test pass (Domain 22, Application 103, Integration 58) và 141 frontend test pass. Coverage source-only sau khi loại `obj` và EF migrations: Domain `98,85%`, Application `89,07%`, Infrastructure `86,45%`, WebApi `58,05%`.
- Frontend đã được kiểm tra ở viewport 360 px: menu mobile, bảng giá cuộn nội bộ, form Order/Affiliate và Admin Dashboard không tràn ngang.
- Trước khi chạy `npm run build`, dừng phiên `next dev` đang dùng chung thư mục `.next`; `tsc --noEmit` phải đạt trong mọi trường hợp.

Kịch bản demo đề xuất:

1. Mở `/`, `/services`, `/pricing` để giới thiệu Landing, Catalog, Promotion và QR.
2. Đăng ký/đăng nhập tài khoản Customer, gửi một yêu cầu tư vấn tại `/order`; đăng nhập Editor để xử lý tại `/admin/orders`.
3. Soạn và publish Markdown tại `/admin/news`, sau đó mở bài ở `/news`.
4. Đăng ký/đăng nhập tài khoản Customer, gửi hồ sơ tại `/affiliate`; dùng Editor để review tại `/admin/affiliates`.
5. Đăng nhập Admin, mở `/admin/dashboard`, xuất Excel và kiểm tra sự kiện tại `/admin/audit-logs`.
