# TV3 Contact Email Notification & Turnstile Setup

## 1. Phạm vi đã chốt

Email Notification chỉ gửi cho địa chỉ Admin được cấu hình khi public `POST /api/v1/contact-requests` đã tạo Contact thành công. Hệ thống không gửi auto-reply cho khách. Lỗi SMTP được log kèm request id, nhưng response tạo Contact vẫn giữ `201 Created`; đây là best-effort theo phương án nhóm đã duyệt.

Cloudflare Turnstile chỉ áp dụng cho public `POST /api/v1/contact-requests`. Client gửi token widget; backend là nơi duy nhất gọi Siteverify. List/detail/status Admin/Editor và các public form khác không dùng Turnstile trong scope này.

> Turnstile phải được validate ở backend; widget phía client một mình không bảo vệ form. Xem [Cloudflare Siteverify](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).

## 2. Cấu hình an toàn

Mặc định local trong `appsettings.json` để hai feature ở trạng thái tắt. `.env.example` chỉ chứa tên biến và giá trị trống; không điền mật khẩu, site secret hoặc App Password vào Git.

| Environment variable | Nơi dùng | Giá trị triển khai |
|---|---|---|
| `CONTACT_EMAIL__ENABLED` | API | `true` khi SMTP đã được cấu hình |
| `CONTACT_EMAIL__HOST` | API | `smtp.gmail.com` |
| `CONTACT_EMAIL__PORT` | API | `587` |
| `CONTACT_EMAIL__USE_SSL` | API | `true` |
| `CONTACT_EMAIL__USERNAME` | API | Gmail/Workspace address gửi mail |
| `CONTACT_EMAIL__PASSWORD` | API | Gmail App Password từ secret store |
| `CONTACT_EMAIL__FROM_ADDRESS` | API | Địa chỉ From đã được cấp quyền gửi |
| `CONTACT_EMAIL__FROM_DISPLAY_NAME` | API | `CloudServiceStore` hoặc tên nhóm chốt |
| `CONTACT_EMAIL__ADMIN_RECIPIENT_ADDRESS` | API | Hộp thư Admin nhận thông báo Contact mới |
| `CONTACT_TURNSTILE__ENABLED` | API | `true` sau khi cấu hình widget production/staging |
| `CONTACT_TURNSTILE__SECRET_KEY` | API | Turnstile secret key — backend only |
| `CONTACT_TURNSTILE__EXPECTED_ACTION` | API | `contact_submit` |
| `CONTACT_TURNSTILE__EXPECTED_HOSTNAME` | API | Hostname đã đăng ký cho widget, ví dụ `example.com` |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Frontend build/runtime | Turnstile **site key** công khai, không phải secret |

`.NET` map environment name dùng `__` thành section path. Ví dụ `CONTACT_EMAIL__PASSWORD` tương ứng `ContactEmail:Password` và `CONTACT_TURNSTILE__SECRET_KEY` tương ứng `ContactTurnstile:SecretKey`.

## 3. Gmail SMTP

Gmail SMTP dùng host `smtp.gmail.com`, TLS và port `587`; Google ghi nhận SMTP hỗ trợ TLS ở port 587.[1] Nếu nhóm dùng Gmail App Password, tài khoản phải bật 2-Step Verification; App Password là passcode 16 chữ số và chỉ được lưu trong secret store.[2]

Tạo secret backing trong Azure, ví dụ `css-contact-email-password`, rồi map giá trị secret đó vào biến runtime `CONTACT_EMAIL__PASSWORD`. Tương tự, map username, from address và Admin recipient qua Azure Secrets/App Service Configuration/Container App secret reference tùy môi trường deploy. Không dán giá trị thật vào PR description, workflow log, `appsettings*.json` hoặc `.env.example`.

Nếu SMTP không gửi được do credential, quota hoặc mạng, API vẫn trả `201` sau khi Contact đã lưu. Log chỉ chứa exception và Contact request id, không ghi email/message của khách.

## 4. Cloudflare Turnstile

Tạo Turnstile widget trên Cloudflare Dashboard, đăng ký đúng hostname staging/production và lưu hai key tách biệt:

1. Site key đặt vào `NEXT_PUBLIC_TURNSTILE_SITE_KEY` để browser render widget.
2. Secret key đặt vào Azure Secret rồi map vào `CONTACT_TURNSTILE__SECRET_KEY` cho API.

Widget render action `contact_submit`. Backend gửi `secret`, `response`, `remoteip` và `idempotency_key` tới `POST https://challenges.cloudflare.com/turnstile/v0/siteverify`, kiểm tra `success`, action và hostname trước khi gọi Contact service.[1]

| Kết quả validation | Response Contact POST | Có lưu Contact không? |
|---|---:|---|
| Token hợp lệ | `201 Created` | Có |
| Token thiếu/sai/hết hạn | `400 Verification failed` | Không |
| Siteverify không khả dụng hoặc secret backend thiếu khi feature bật | `503 Verification service unavailable` | Không |

Token có thời hạn năm phút và chỉ dùng một lần; sau một lần submit thành công hoặc lỗi, UI sẽ yêu cầu token mới thay vì tái sử dụng token cũ.[1]

## 5. Kiểm tra trước deploy

Chạy backend Release build/test, frontend lint/build, `node --test tests/contact-turnstile.test.mjs` và Contact public E2E. Test không gửi Gmail thật và không gọi secret production. Sau khi Azure Secrets được map vào staging, thực hiện smoke test thủ công: gửi Contact với Turnstile hợp lệ, xác nhận `201` và Admin nhận đúng một email; sau đó thử token thiếu/sai để xác nhận `400` và không tạo Contact.

## References

[1] [Cloudflare Turnstile — Validate the token](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
[2] [Google Gmail Help — Sign in with app passwords](https://support.google.com/mail/answer/185833?hl=en)
[3] [Google Workspace Gmail — IMAP, POP, and SMTP](https://developers.google.com/workspace/gmail/imap/imap-smtp)
