# TV3 Contact Request API Guide

## 1. Mục đích và phạm vi

Tài liệu này mô tả API Contact Request đã merge qua chuỗi PR #10 → #14 → #15. Contract dùng route relative `/api/v1/contact-requests`, trả lỗi chuẩn `ProblemDetails` và không phụ thuộc vào URL Docker ở frontend. Public chỉ được gửi yêu cầu; Admin/Editor mới được xem, lọc và đổi trạng thái.

> Không đưa email notification, CAPTCHA, CRM, webhook hoặc secret vào contract này. Email là nhánh follow-up riêng và chỉ bắt đầu sau khi nhóm phê duyệt provider/cấu hình.

## 2. Endpoint summary

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `POST` | `/api/v1/contact-requests` | Public | Gửi yêu cầu liên hệ. Áp rate limit `contact-requests`. |
| `GET` | `/api/v1/contact-requests` | Admin, Editor | Danh sách server-side có search/filter/pagination. |
| `GET` | `/api/v1/contact-requests/{id}` | Admin, Editor | Xem chi tiết, history và allowed transitions. |
| `POST` | `/api/v1/contact-requests/{id}/status` | Admin, Editor | Đổi status theo workflow backend trả về. |

## 3. Auth matrix

| Actor | Public POST | GET list/detail | POST status |
|---|---:|---:|---:|
| Anonymous | `201`, `400`, `409`, `429`, `503` | `401` | `401` |
| Customer | Có thể gửi public | `403` | `403` |
| Editor | Có thể gửi public | `200` | `200` |
| Admin | Có thể gửi public | `200` | `200` |

`ManageContactRequests` yêu cầu role `Admin` hoặc `Editor`. Frontend không thay thế policy backend; giao diện chỉ là lớp điều hướng bổ sung.

## 4. Public create request

### Request

```json
POST /api/v1/contact-requests
Content-Type: application/json

{
  "fullName": "Nguyen Phuoc Duy",
  "email": "duy@example.test",
  "phoneNumber": "0901234567",
  "companyName": "CloudServiceStore QA",
  "subject": "Tu van ha tang Cloud",
  "message": "Toi can tu van giai phap Cloud cho doanh nghiep."
}
```

`fullName` tối đa 160 ký tự; `email` tối đa 256; `phoneNumber` gồm 8–15 chữ số; `subject` tối đa 180; `message` tối đa 4000. API normalize dữ liệu và kiểm tra duplicate-window theo email.

### Response `201 Created`

```json
{
  "id": "11111111-2222-3333-4444-555555555555",
  "status": 1,
  "createdAt": "2026-08-23T00:00:00Z"
}
```

## 5. Admin/Editor list query

```text
GET /api/v1/contact-requests?page=1&pageSize=12&search=duy&status=1
```

| Query | Kiểu | Quy tắc |
|---|---|---|
| `page` | number | Bắt đầu từ 1. |
| `pageSize` | number | 1–100. UI Admin hiện dùng 12. |
| `search` | string | Tìm server-side theo field contract. |
| `status` | enum number | `1` Pending, `2` Contacted, `3` Approved, `4` Rejected, `5` Cancelled. |
| `createdFrom`, `createdTo` | ISO 8601 | Lọc khoảng ngày; `createdTo` không trước `createdFrom`. |

Response là `PagedResult`: `items`, `totalCount`, `page`, `pageSize`, `totalPages`. UI phải dùng metadata này để phân trang, không tự tải toàn bộ record rồi slice ở browser.

## 6. Detail và status workflow

`GET /{id}` trả detail gồm `statusHistory` và `allowedTransitions`; client chỉ hiển thị nút transition do backend trả về.

```json
POST /api/v1/contact-requests/11111111-2222-3333-4444-555555555555/status
{
  "status": 2,
  "note": "Da lien he qua dien thoai."
}
```

Workflow contract: `Pending → Contacted → Approved`; từ `Pending` hoặc `Contacted` có thể `Rejected`/`Cancelled`; `Approved`, `Rejected`, `Cancelled` là terminal. Note là bắt buộc cho transition contract yêu cầu.

## 7. ProblemDetails

| HTTP | Title thường gặp | Ý nghĩa/nhánh UI |
|---:|---|---|
| `400` | `Validation failed` | Hiển thị error field/detail; không retry tự động. |
| `401` | Unauthorized | Chuyển login nếu route quản trị. |
| `403` | Forbidden | Customer không có quyền quản trị Contact. |
| `404` | Resource not found | Record không còn tồn tại. |
| `409` | Business conflict | Duplicate-window hoặc invalid transition. |
| `429` | Too many requests | Rate limit public; cho phép user thử lại sau. |
| `503` | Contact request queue is busy | SQL lock unavailable; hiển thị retry-safe message. |

Ví dụ:

```json
{
  "type": "about:blank",
  "title": "Business conflict",
  "status": 409,
  "detail": "A contact request with this email was submitted recently."
}
```

## 8. Demo script

```bash
# Public create
curl -i http://localhost:8080/api/v1/contact-requests \
  -H 'Content-Type: application/json' \
  --data '{"fullName":"Nguyen Phuoc Duy","email":"duy@example.test","phoneNumber":"0901234567","subject":"Tu van Cloud","message":"Can tu van ha tang."}'

# Admin/Editor list (thay $ACCESS_TOKEN bằng token login thật)
curl -i 'http://localhost:8080/api/v1/contact-requests?page=1&pageSize=12&status=1' \
  -H "Authorization: Bearer $ACCESS_TOKEN"

# Admin/Editor status update
curl -i -X POST 'http://localhost:8080/api/v1/contact-requests/$REQUEST_ID/status' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"status":2,"note":"Da lien he qua dien thoai."}'
```

## 9. Kiểm thử và evidence

Public Playwright E2E đã cover submit, 409, validation, 429, network failure, pending submit và mobile layout. Bổ sung `contact-admin.spec.ts` cover Admin login/list/search/filter/pagination, Editor detail/status transition, Customer redirect và API `403` mock contract. Backend application/integration tests vẫn là evidence cho policy thật, transition, query và SQL behavior.
