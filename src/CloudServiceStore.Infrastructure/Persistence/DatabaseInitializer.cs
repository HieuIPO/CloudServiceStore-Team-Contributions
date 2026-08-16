using CloudServiceStore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task SeedAsync(
        this CloudServiceStoreDbContext dbContext,
        string? adminPassword,
        bool visualQaData = false,
        CancellationToken cancellationToken = default)
    {
        if (visualQaData)
        {
            await VisualQaDataSeeder.SeedAsync(dbContext, adminPassword, cancellationToken);
            return;
        }

        await SeedDefaultAsync(dbContext, adminPassword, cancellationToken);
    }

    private static async Task SeedDefaultAsync(CloudServiceStoreDbContext dbContext, string? adminPassword, CancellationToken cancellationToken)
    {
        if (!await dbContext.LandingPageContents.AnyAsync(cancellationToken))
        {
            dbContext.LandingPageContents.Add(new LandingPageContent
            {
                HeroEyebrow = "CLOUD HẠ TẦNG CHO DOANH NGHIỆP",
                HeroTitle = "Hạ tầng Cloud vững vàng cho mọi chặng tăng trưởng.",
                HeroDescription = "VPS, Hosting và dịch vụ bảo mật được thiết kế minh bạch, linh hoạt và luôn có đội ngũ kỹ thuật đồng hành.",
                PrimaryCtaLabel = "Khám phá dịch vụ",
                PrimaryCtaUrl = "/services",
                SecondaryCtaLabel = "Xem bảng giá",
                SecondaryCtaUrl = "/pricing",
                AboutTitle = "Hạ tầng đáng tin cậy, vận hành bởi con người tận tâm.",
                AboutMarkdown = "CloudServiceStore đồng hành cùng doanh nghiệp từ website đầu tiên đến hệ thống cần mở rộng quy mô. Chúng tôi ưu tiên **minh bạch cấu hình**, **giá rõ ràng** và hỗ trợ có trách nhiệm.",
                InfrastructureMarkdown = "Hạ tầng được thiết kế theo lớp với giám sát liên tục, lưu trữ hiệu năng cao và kết nối dự phòng. Quy trình vận hành tập trung vào khả năng phục hồi, bảo mật và trải nghiệm ổn định.",
                UptimeCommitment = "99,9% SLA",
                IsPublished = true
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        if (!await dbContext.AffiliateProgramContents.AnyAsync(cancellationToken))
        {
            dbContext.AffiliateProgramContents.Add(new AffiliateProgramContent
            {
                Title = "Đồng hành cùng CloudServiceStore",
                Summary = "Giới thiệu giải pháp Cloud phù hợp tới cộng đồng của bạn và nhận quyền lợi minh bạch khi khách hàng đăng ký thành công.",
                CommissionSummary = "Hoa hồng được xác nhận theo từng dịch vụ và thỏa thuận hợp tác; không có phí tham gia.",
                PolicyMarkdown = """
                    ## Nguyên tắc chương trình

                    - Cung cấp thông tin chính xác, không cam kết thay CloudServiceStore.
                    - Không spam, giả mạo thương hiệu hoặc sử dụng nội dung gây hiểu nhầm.
                    - Hoa hồng chỉ được ghi nhận với khách hàng hợp lệ và sau khi dịch vụ được xác nhận.
                    - Thông tin chi tiết về mức hoa hồng và đối soát được thống nhất khi hồ sơ được duyệt.

                    ## Quy trình

                    1. Gửi hồ sơ và mô tả kênh tiếp cận khách hàng.
                    2. Đội ngũ vận hành xem xét và liên hệ xác minh.
                    3. Hai bên thống nhất chính sách trước khi bắt đầu giới thiệu dịch vụ.
                    """,
                IsPublished = true
            });
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        var roles = new[]
        {
            new Role { Id = SeedIds.AdminRoleId, Name = "Admin", Description = "Full system access" },
            new Role { Id = SeedIds.EditorRoleId, Name = "Editor", Description = "Content and order management" },
            new Role { Id = SeedIds.CustomerRoleId, Name = "Customer", Description = "Customer account access" }
        };

        foreach (var role in roles.Where(role => !dbContext.Roles.Any(current => current.Name == role.Name)))
        {
            dbContext.Roles.Add(role);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        if (string.IsNullOrWhiteSpace(adminPassword) || await dbContext.AppUsers.AnyAsync(cancellationToken)) return;

        var passwordHasher = new PasswordHasher<AppUser>();
        var admin = new AppUser { Id = SeedIds.AdminUserId, Email = "admin@cloud.local", FullName = "Cloud Admin" };
        admin.PasswordHash = passwordHasher.HashPassword(admin, adminPassword);
        var editor = new AppUser { Id = SeedIds.EditorUserId, Email = "editor@cloud.local", FullName = "Cloud Editor" };
        editor.PasswordHash = passwordHasher.HashPassword(editor, adminPassword);

        dbContext.AppUsers.AddRange(admin, editor);
        dbContext.Set<AppUserRole>().AddRange(
            new AppUserRole { AppUserId = admin.Id, RoleId = SeedIds.AdminRoleId },
            new AppUserRole { AppUserId = editor.Id, RoleId = SeedIds.EditorRoleId });
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private static class SeedIds
    {
        public static readonly Guid AdminRoleId = Guid.Parse("9c04c7d6-a437-4ac2-bfb7-a75588672b2a");
        public static readonly Guid EditorRoleId = Guid.Parse("df2b3cb9-a12f-4751-a8f6-b69b3f294739");
        public static readonly Guid CustomerRoleId = Guid.Parse("c2b5f92d-bf3e-45d1-8fb0-c6e7bcf3ef52");
        public static readonly Guid AdminUserId = Guid.Parse("7ea04c83-2a66-4b7c-a2cf-7ef0469f836e");
        public static readonly Guid EditorUserId = Guid.Parse("67265e8d-b9c3-4f4f-9cea-71f2f7f0262b");
    }
}
