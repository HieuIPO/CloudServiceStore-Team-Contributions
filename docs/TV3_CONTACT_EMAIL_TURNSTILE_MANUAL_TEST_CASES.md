# Test Cases Thủ Công — Contact Email Notification & Cloudflare Turnstile

**Phạm vi:** Email Notification Gmail SMTP chỉ thông báo cho Admin khi Contact mới được tạo, và Cloudflare Turnstile chỉ bảo vệ public `POST /api/v1/contact-requests`.

**Môi trường:** Staging có HTTPS, backend và frontend được deploy từ branch `feature/contact-email-turnstile-hieu-dev-clean` tại exact HEAD của PR hiện tại. Không chạy test này bằng secret production nếu không có phê duyệt của nhóm.

> **Nguyên tắc:** Site key Turnstile có thể xuất hiện ở browser. SMTP App Password và Turnstile secret chỉ ở Azure Secrets/environment runtime; không dán chúng vào ticket, screenshot, DevTools export, log hoặc tài liệu test.[1] [2]

## 1. Chuẩn bị trước khi test

| Mục | Điều kiện cần có | Cách xác minh |
|---|---|---|
| Hostname | Hostname staging đã được đăng ký trong widget Turnstile | Mở `/contact` qua HTTPS; widget hiển thị bình thường |
| Turnstile | `CONTACT_TURNSTILE__ENABLED=true`, secret được map từ Azure Secrets, action là `contact_submit`, hostname expected đúng staging | Không hiển thị giá trị secret; chỉ xác nhận mapping runtime đã reload |
| Gmail SMTP | `CONTACT_EMAIL__ENABLED=true`, `smtp.gmail.com:587`, TLS, username/from/admin recipient và App Password được map từ Azure Secrets | Admin test mailbox truy cập được và không chia sẻ App Password |
| Dữ liệu test | Có một địa chỉ email khách test duy nhất, ví dụ `contact-qa+<thời-gian>@example.test` | Dùng địa chỉ mới cho từng happy-path để tránh rate limit/duplicate window |
| Quan sát | Có quyền xem Admin Contact Requests và log ứng dụng đã che thông tin nhạy cảm | Chuẩn bị DevTools Network và console/log viewer có quyền phù hợp |

Sau mỗi case lỗi cấu hình, khôi phục Azure Secret/environment về trạng thái ban đầu và restart/redeploy service nếu nền tảng yêu cầu reload biến môi trường.

## 2. Email Notification — test cases

| ID | Mục tiêu | Bước thực hiện | Kết quả mong đợi | Bằng chứng cần lưu |
|---|---|---|---|---|
| EML-01 | Xác minh Happy Path gửi đúng một mail Admin | Hoàn thành Turnstile hợp lệ, gửi form `/contact` với dữ liệu mới; ghi lại Contact ID trả về. | API trả **201**. Một Contact mới xuất hiện trong Admin. Admin mailbox nhận **đúng một** email có subject chứa subject Contact và body có Request ID, thời gian UTC, name/email/phone/company/subject. | Screenshot response 201 đã che PII, Contact ID, email header/body đã che email khách. |
| EML-02 | Không gửi auto-reply cho khách | Sau EML-01, kiểm tra inbox của email khách test. | Không có email auto-reply từ CloudServiceStore. Chỉ mailbox Admin nhận notification. | Screenshot inbox khách theo thời gian test, đã che địa chỉ. |
| EML-03 | Email chỉ chạy sau khi Contact tạo thành công | Gửi form bị validation backend reject hoặc vượt rate limit; không dùng dữ liệu hợp lệ mới. | Response là ProblemDetails (`400`/`429` tùy case); không có Contact mới và không có email Admin mới. | Status API, ảnh Admin list không có record, mailbox không có mail tương ứng. |
| EML-04 | SMTP/App Password sai không làm mất Contact | Tạm map **secret test sai** cho `CONTACT_EMAIL__PASSWORD`, giữ Email enabled; gửi Contact hợp lệ qua Turnstile. Khôi phục secret ngay sau test. | API vẫn trả **201** và Contact được lưu. Admin không nhận mail. Log có exception SMTP và Contact request id, không in password, Turnstile secret hay message/email khách đầy đủ. | 201 + Contact ID; log redacted; xác nhận không nhận email. |
| EML-05 | Recipient Admin sai/không hợp lệ vẫn là best-effort | Tạm dùng Admin recipient test không hợp lệ hoặc mailbox test không tồn tại; gửi Contact hợp lệ; sau đó khôi phục. | API vẫn **201**, Contact được lưu, lỗi email chỉ ở log. | 201, Contact record, log redacted. |
| EML-06 | Chống gửi trùng ngoài ý muốn | Gửi **một lần** Contact hợp lệ; chờ inbox ổn định. Không bấm submit lại. | Có đúng một Contact và đúng một email notification cho Contact ID đó. | Contact ID đối chiếu với email body/header timestamp. |

## 3. Cloudflare Turnstile — test cases

| ID | Mục tiêu | Bước thực hiện | Kết quả mong đợi | Bằng chứng cần lưu |
|---|---|---|---|---|
| CAP-01 | Widget load và khóa submit trước xác minh | Mở `/contact` bằng hostname staging đã đăng ký; điền tất cả field nhưng chưa hoàn thành challenge. | Widget Turnstile hiển thị. Nút gửi bị disable khi chưa có token. | Screenshot form + widget, không chứa token. |
| CAP-02 | Token hợp lệ cho phép tạo Contact | Hoàn thành widget, gửi form dữ liệu mới. | `POST /api/v1/contact-requests` trả **201**. Có Contact mới và theo EML-01 có một email Admin. | Network response 201 và Contact ID. |
| CAP-03 | Backend chặn request không token | Dùng DevTools/HTTP client gửi payload Contact hợp lệ **không có** `turnstileToken`. | API trả **400 Verification failed**. Không có Contact mới, không có email. | Request/response redacted và Admin list. |
| CAP-04 | Backend chặn token sai | Gửi payload có token giả hoặc token từ widget/site khác. | API trả **400 Verification failed**. Không có Contact/email. | Response ProblemDetails; không lưu token trong ảnh/tài liệu. |
| CAP-05 | Token single-use | Hoàn thành widget, sao chép request hợp lệ; gửi request lần một, sau đó replay y nguyên request/token lần hai trong vòng năm phút. | Lần một **201**. Lần hai **400**; chỉ có một Contact và một email. | Hai status response, Contact ID và số email nhận được. |
| CAP-06 | Token hết hạn | Hoàn thành widget, chờ quá năm phút rồi submit/replay token. | API trả **400**; không tạo Contact/email. | Timestamp và response. |
| CAP-07 | Secret Turnstile bị thiếu khi feature bật | Trên staging test, bật Turnstile nhưng bỏ mapping secret; reload service, gửi request có token; khôi phục mapping. | API trả **503 Verification service unavailable**. Không tạo Contact/email. | 503 ProblemDetails; log redacted. |
| CAP-08 | Siteverify không khả dụng | Theo quy trình staging được duyệt, tạm chặn outbound tới `challenges.cloudflare.com` hoặc dùng fault injection; submit token. | API trả **503**, không downgrade thành `201`, không tạo Contact/email. | 503 và bằng chứng rule/fault đã được gỡ sau test. |
| CAP-09 | Hostname/action mismatch bị từ chối | Dùng widget/test config có hostname khác expected hoặc action khác `contact_submit`. | API trả **400**, không tạo Contact/email. | Response 400 và config test đã che secret. |
| CAP-10 | Scope không lan sang route khác | Mở Admin Contact list/detail/status và các public form ngoài Contact. | Không xuất hiện widget Turnstile ngoài `/contact`; Admin/Editor flow vẫn hoạt động theo quyền hiện có. | Screenshot route liên quan. |

Cloudflare quy định token có thời hạn 300 giây và chỉ dùng một lần; do đó CAP-05/CAP-06 là bắt buộc khi staging đã có key thật.[1]

## 4. Kiểm tra bảo mật và hồi quy

| ID | Mục tiêu | Bước thực hiện | Kết quả mong đợi |
|---|---|---|---|
| SEC-01 | Không lộ SMTP/Turnstile secret ở browser | DevTools Network, Sources, page HTML và bundle search theo `CONTACT_EMAIL`, `PASSWORD`, `SECRET_KEY`. | Chỉ có site key công khai nếu Turnstile bật. Không có SMTP username/password, App Password, Turnstile secret hoặc Azure secret reference value. |
| SEC-02 | API không trả chi tiết nội bộ | Kích hoạt CAP-03, CAP-07 và EML-04. | Response chỉ có ProblemDetails an toàn; không chứa stack trace, host SMTP, credential, secret hoặc raw Siteverify error. |
| SEC-03 | Rate limit Contact vẫn còn hiệu lực | Gửi vượt limit Contact trong time window theo staging policy với dữ liệu test. | API trả `429`; request bị từ chối không tạo Contact/email. Sau window, happy path hoạt động lại. |
| SEC-04 | Refresh token UI sau lỗi/success | Hoàn thành Turnstile, gây request lỗi; kiểm tra widget reset. Sau success, bấm **Gửi yêu cầu khác**. | Widget yêu cầu token mới; token cũ không được tái dùng. |
| REG-01 | Feature flags tắt không làm hỏng local/dev | Tắt cả `CONTACT_EMAIL__ENABLED` và `CONTACT_TURNSTILE__ENABLED`; reload và submit Contact hợp lệ. | Không hiển thị widget, Contact vẫn **201**, không cố gửi SMTP; đây là behavior local/dev mặc định. |

## 5. Tiêu chí nghiệm thu và báo cáo

Chỉ đánh dấu đạt khi EML-01, EML-02, CAP-02, CAP-03, CAP-05, CAP-07, SEC-01 và REG-01 đạt. Các case EML-04/05/CAP-08 cần thực hiện trong staging được phép thay đổi secret/network tạm thời; nếu không có quyền, ghi rõ **Blocked by environment access**, không tự kết luận pass.

Mẫu ghi nhận cho mỗi case: `ID`, môi trường/commit, thời gian UTC, executor, actual status, Contact ID (nếu có), email count, log correlation id đã che dữ liệu, attachment screenshot/redacted và kết luận Pass/Fail/Blocked. Không đưa token, SMTP App Password, Turnstile secret hay địa chỉ khách thật vào ticket.

## References

[1] [Cloudflare Turnstile — Validate the token](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
[2] [Google Gmail Help — Sign in with app passwords](https://support.google.com/mail/answer/185833?hl=en)
[3] [Google Workspace Gmail — IMAP, POP, and SMTP](https://developers.google.com/workspace/gmail/imap/imap-smtp)
