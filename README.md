# CloudServiceStore

## Tổng quan (Overview)
**CloudServiceStore** là một hệ thống/cửa hàng cung cấp và quản lý các dịch vụ đám mây. Dự án được xây dựng nhằm mục đích quản lý các danh mục dịch vụ, gói dịch vụ (Service Plans), chu kỳ thanh toán (Billing Cycles), cũng như các chương trình khuyến mãi (Promotions). 

Hệ thống cung cấp một giải pháp toàn diện để người dùng có thể duyệt, chọn mua các dịch vụ Cloud và thanh toán dễ dàng (bao gồm hỗ trợ tích hợp tạo mã QR).

## Kiến trúc (Architecture)
Dự án được xây dựng theo mô hình **Clean Architecture** (hoặc Onion Architecture) với nền tảng **.NET (C#)**, giúp chia tách rõ ràng các tầng, dễ dàng bảo trì và mở rộng:

- **Domain**: Chứa core business logic, các Entities, Enums (như `BillingCycle`) và Exceptions.
- **Application**: Chứa các Use Cases, DTOs (như `ServiceCategoryDtos`, `ServicePlanDtos`), và định nghĩa các Interfaces (như `IQrCodeGenerator`).
- **Infrastructure**: Đảm nhiệm việc giao tiếp với Database thông qua Entity Framework Core (chứa `ApplicationDbContext`), triển khai các Repositories (như `PromotionRepository`) và các dịch vụ bên ngoài.
- **WebApi**: Lớp API cung cấp các RESTful endpoint.
- **Frontend**: Giao diện người dùng cho hệ thống.

## Tài liệu làm việc nhóm
- **Bảng phân công công việc**: `Bang_phan_cong_cong_viec_CloudServiceStore.docx`
- **Quy ước kỹ thuật chung**: `Quy_uoc_ky_thuat_dung_chung_CloudServiceStore.docx`

## Bắt đầu (Getting Started)
*(Cần cập nhật thêm hướng dẫn cài đặt database, connection string và cách chạy dự án (run WebApi, frontend) tại đây)*

---
*Dự án thuộc môn học Lập trình hướng đối tượng.*