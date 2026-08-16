using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

internal static partial class VisualQaDataSeeder
{
    private static async Task SeedLandingAsync(
        CloudServiceStoreDbContext dbContext,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var landing = await dbContext.LandingPageContents.FirstOrDefaultAsync(x => x.Id == VisualQaSeedIds.LandingContentId, cancellationToken);
        if (landing is null)
        {
            landing = new LandingPageContent
            {
                Id = VisualQaSeedIds.LandingContentId,
                HeroEyebrow = "VISUAL QA / HẠ TẦNG CLOUD",
                HeroTitle = "Dữ liệu tổng hợp để nhìn thấy cả đường đi bình thường lẫn góc cạnh.",
                HeroDescription = "Bộ dữ liệu này phục vụ kiểm thử giao diện Admin/Editor, không chứa thông tin khách hàng thật và không dùng cho giao dịch thật.",
                PrimaryCtaLabel = "Khám phá dịch vụ",
                PrimaryCtaUrl = "/services",
                SecondaryCtaLabel = "Xem bảng giá",
                SecondaryCtaUrl = "/pricing",
                AboutTitle = "Một workspace rõ ràng giúp đội ngũ vận hành tự tin hơn.",
                AboutMarkdown = "Nội dung mẫu có **Markdown**, tiếng Việt có dấu, chuỗi không dấu và nhiều dòng để kiểm tra khoảng cách, wrap và khả năng đọc.\n\n> Đây là dữ liệu QA tổng hợp.",
                InfrastructureMarkdown = "## Thiết kế theo lớp\n\n- **Compute:** cấu hình từ nhỏ đến doanh nghiệp.\n- **Storage:** tên gói dài để kiểm tra ellipsis.\n- **Observability:** timestamp ở nhiều khoảng thời gian.\n\n" + string.Join("\n", Enumerable.Repeat("Dòng mô tả dài dùng để kiểm tra vùng nội dung nhiều dòng và khả năng cuộn có chủ đích.", 12)),
                UptimeCommitment = "99,9% SLA",
                IsPublished = true
            };
            dbContext.LandingPageContents.Add(landing);
            await PersistNewEntitiesAsync(dbContext, new Dictionary<AuditableEntity, DateTimeOffset> { [landing] = now.AddDays(-3) }, cancellationToken);
        }

        var program = await dbContext.AffiliateProgramContents.FirstOrDefaultAsync(x => x.Id == VisualQaSeedIds.AffiliateProgramContentId, cancellationToken);
        if (program is null)
        {
            program = new AffiliateProgramContent
            {
                Id = VisualQaSeedIds.AffiliateProgramContentId,
                Title = "Chương trình Affiliate Visual QA",
                Summary = "Nội dung mẫu để kiểm tra tab chương trình, trường textarea nhiều dòng và trạng thái công khai.",
                CommissionSummary = "Hoa hồng mẫu được hiển thị để kiểm tra format; không gắn với thanh toán thật.",
                PolicyMarkdown = "## Quy tắc mẫu\n\n1. Không spam.\n2. Không giả mạo thương hiệu.\n3. Luôn hiển thị điều khoản rõ ràng.\n\n" + string.Join("\n", Enumerable.Repeat("Dòng chính sách dài giúp kiểm tra markdown và responsive layout.", 15)),
                IsPublished = true
            };
            dbContext.AffiliateProgramContents.Add(program);
            await PersistNewEntitiesAsync(dbContext, new Dictionary<AuditableEntity, DateTimeOffset> { [program] = now.AddDays(-4) }, cancellationToken);
        }

        var testimonialDefinitions = new[]
        {
            ("Nguyễn An", "CTO", "Mây Xanh", "Đội ngũ có thể kiểm tra cấu hình nhanh và mở rộng theo từng giai đoạn."),
            ("Tran Minh", "Founder", "Khong Dau Studio", "Chuỗi không dấu giúp chúng tôi rà lại cách trình bày tên riêng và tìm kiếm."),
            ("Lê Hải 🌱", "Product Lead", "Sông Dữ Liệu", "Một trải nghiệm gọn gàng, đủ chi tiết để ra quyết định mà không bị ngợp."),
            ("Alex QA", "Operations", "Edge Case Lab", "Long copy is intentional here so the review can catch wrapping regressions."),
            ("Phạm Linh", "Engineering Manager", "Bản Đồ Số", "Có cả nội dung ngắn và nội dung nhiều dòng để kiểm tra mọi trạng thái."),
            ("Đỗ Khoa", "Security", "Tầng Mây", "Dữ liệu tổng hợp, không chứa thông tin cá nhân thật.")
        };
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var index = 0; index < testimonialDefinitions.Length; index++)
        {
            var id = VisualQaSeedIds.Testimonial(index);
            if (await dbContext.Testimonials.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var definition = testimonialDefinitions[index];
            var testimonial = new Testimonial
            {
                Id = id,
                CustomerName = definition.Item1,
                CustomerRole = definition.Item2,
                CompanyName = definition.Item3,
                Quote = definition.Item4,
                AvatarUrl = "/window.svg",
                DisplayOrder = index + 1,
                IsActive = true
            };
            dbContext.Testimonials.Add(testimonial);
            newEntities[testimonial] = now.AddDays(-(index * 11 + 6));
        }
        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);

        var logoNames = new[]
        {
            "Mây Xanh", "Sông Dữ Liệu", "Không Gian Số", "Bản Đồ 24", "Tầng Mây", "Edge Case Lab", "Cánh Buồm", "Vệt Sáng", "Phố Dữ Liệu", "Cloud QA 999"
        };
        newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var index = 0; index < logoNames.Length; index++)
        {
            var id = VisualQaSeedIds.CustomerLogo(index);
            if (await dbContext.CustomerLogos.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var logo = new CustomerLogo
            {
                Id = id,
                Name = logoNames[index],
                LogoUrl = "/window.svg",
                WebsiteUrl = $"https://example.invalid/visual-qa/{index + 1}",
                AltText = $"Logo mẫu {logoNames[index]}",
                DisplayOrder = index + 1,
                IsActive = true
            };
            dbContext.CustomerLogos.Add(logo);
            newEntities[logo] = now.AddDays(-(index * 8 + 2));
        }
        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }

    private static async Task SeedNewsAsync(
        CloudServiceStoreDbContext dbContext,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var categoryDefinitions = new[]
        {
            ("Thông báo", "thong-bao"),
            ("Hạ tầng Cloud", "ha-tang-cloud"),
            ("Bảo mật", "bao-mat"),
            ("Hướng dẫn", "huong-dan"),
            ("Không dấu", "khong-dau"),
            ("Góc thử nghiệm", "goc-thu-nghiem")
        };
        var categoryIds = new Guid[categoryDefinitions.Length];
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var index = 0; index < categoryDefinitions.Length; index++)
        {
            var id = VisualQaSeedIds.NewsCategory(index);
            categoryIds[index] = id;
            if (await dbContext.NewsCategories.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var category = new NewsCategory
            {
                Id = id,
                Name = categoryDefinitions[index].Item1,
                Slug = categoryDefinitions[index].Item2,
                Description = "Danh mục mẫu cho kiểm thử bộ lọc và trạng thái nội dung.",
                DisplayOrder = index + 1,
                IsActive = true
            };
            dbContext.NewsCategories.Add(category);
            newEntities[category] = now.AddDays(-(index * 17 + 5));
        }
        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);

        newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var index = 0; index < 16; index++)
        {
            var id = VisualQaSeedIds.NewsArticle(index);
            if (await dbContext.NewsArticles.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var published = index >= 8;
            var title = index == 15
                ? "Bài viết có tiêu đề rất dài để kiểm tra wrap, ellipsis và vùng thao tác trên màn hình nhỏ " + new string('Q', 112)
                : $"Bản tin Visual QA {index + 1:00}: {categoryDefinitions[index % categoryDefinitions.Length].Item1}";
            var markdown = index == 0
                ? string.Empty
                : index == 14
                    ? string.Join("\n\n", Enumerable.Range(1, 24).Select(item => $"## Phần {item}\n\nNội dung Markdown dài dùng cho kiểm tra cuộn và đọc toàn văn. Đây là dữ liệu tổng hợp, không đại diện cho khách hàng thật."))
                    : $"## Nội dung mẫu {index + 1}\n\nĐoạn văn nhiều dòng để kiểm tra khoảng cách và khả năng hiển thị.\n\n- Dòng thứ nhất\n- Dòng thứ hai\n- Ký tự đặc biệt: !@#$%^&*()\n- Emoji: ☁️ 🚀 ✅";
            var article = new NewsArticle
            {
                Id = id,
                CategoryId = categoryIds[index % categoryIds.Length],
                Title = title,
                Slug = $"visual-qa-article-{index + 1:00}",
                Excerpt = index == 13
                    ? ""
                    : "Đoạn tóm tắt mẫu với tiếng Việt có dấu, dùng để kiểm tra danh sách bài viết.",
                MarkdownContent = markdown,
                ThumbnailUrl = "/window.svg",
                Status = published ? NewsArticleStatus.Published : NewsArticleStatus.Draft,
                PublishedAt = published ? now.AddDays(-(index * 9 + 1)) : null
            };
            dbContext.NewsArticles.Add(article);
            newEntities[article] = now.AddDays(-(index * 22 + 3));
        }
        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }
}
