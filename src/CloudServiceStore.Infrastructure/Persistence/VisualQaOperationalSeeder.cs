using System.Text.Json;
using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

internal static partial class VisualQaDataSeeder
{
    private static async Task SeedOrdersAsync(
        CloudServiceStoreDbContext dbContext,
        SeededActors actors,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var planNames = await dbContext.ServicePlans
            .AsNoTracking()
            .ToDictionaryAsync(x => x.Id, x => x.Name, cancellationToken);
        var statuses = new[]
        {
            OrderRequestStatus.Pending,
            OrderRequestStatus.Contacted,
            OrderRequestStatus.Approved,
            OrderRequestStatus.Rejected,
            OrderRequestStatus.Cancelled
        };
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();

        for (var index = 0; index < 60; index++)
        {
            var id = VisualQaSeedIds.Order(index);
            if (await dbContext.OrderRequests.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var planId = VisualQaSeedIds.ServicePlan(index % 12);
            var status = statuses[index % statuses.Length];
            var createdAt = index == 0
                ? now.AddHours(-6)
                : now.AddMonths(-((index % 8) + 1)).AddDays(-(index % 7));
            var amount = index == 59 ? 999_999_999m : (index % 12 + 1) * 99_000m;
            var customerName = index == 0
                ? "Nguyễn Minh An 😀"
                : index == 1
                    ? "Tran Minh Khong Dau"
                    : index == 59
                        ? "Khách hàng biên " + new string('K', 140)
                        : $"Khách QA {index + 1:00}";
            var email = index == 58
                ? "edge." + new string('e', 220) + "@qa.local"
                : $"visual.qa.order{index + 1:00}@example.invalid";
            var companyName = index == 59 ? new string('C', 150) : index % 4 == 0 ? null : $"Doanh nghiệp QA {index + 1:00}";
            var order = new OrderRequest
            {
                Id = id,
                ServicePlanId = planId,
                CustomerName = customerName,
                Email = email,
                PhoneNumber = $"090{index:0000000}",
                CompanyName = companyName,
                BillingCycle = index % 2 == 0 ? BillingCycle.Monthly : BillingCycle.Yearly,
                OriginalAmount = amount,
                QuotedAmount = index % 3 == 0 ? amount * 0.9m : amount,
                Currency = "VND",
                PlanNameSnapshot = planNames.GetValueOrDefault(planId, $"Visual QA Plan {index % 12 + 1}"),
                SpecificationSnapshot = JsonSerializer.Serialize(new
                {
                    cpu = index % 4 + 1,
                    region = index % 2 == 0 ? "Hà Nội" : "Ho Chi Minh",
                    synthetic = true
                }),
                PromotionCodeSnapshot = index % 2 == 0 ? "QA-ACTIVE-10" : null,
                Status = status,
                Note = index == 1
                    ? "Ghi chú nhiều dòng để kiểm tra layout.\nDòng thứ hai có tiếng Việt có dấu.\nDòng cuối ✅"
                    : index == 59 ? "Ghi chú biên với chuỗi dài và ký tự !@#$%^&*()" : null
            };
            dbContext.OrderRequests.Add(order);
            newEntities[order] = createdAt;

            for (var historyIndex = 0; historyIndex < (int)status; historyIndex++)
            {
                var fromStatus = historyIndex == 0 ? OrderRequestStatus.Pending : (OrderRequestStatus)historyIndex;
                var toStatus = (OrderRequestStatus)(historyIndex + 1);
                var history = new OrderRequestStatusHistory
                {
                    Id = VisualQaSeedIds.OrderHistory(index, historyIndex),
                    OrderRequestId = id,
                    FromStatus = fromStatus,
                    ToStatus = toStatus,
                    Note = historyIndex == 0 ? "Khởi tạo từ bộ dữ liệu Visual QA." : "Chuyển trạng thái mẫu để kiểm tra timeline.",
                    ChangedBy = historyIndex == 0 ? actors.EditorId : actors.AdminId
                };
                dbContext.OrderRequestStatusHistories.Add(history);
                newEntities[history] = createdAt.AddHours(historyIndex + 1);
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }

    private static async Task SeedAffiliatesAsync(
        CloudServiceStoreDbContext dbContext,
        SeededActors actors,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var statuses = new[]
        {
            AffiliateApplicationStatus.Pending,
            AffiliateApplicationStatus.UnderReview,
            AffiliateApplicationStatus.Approved,
            AffiliateApplicationStatus.Rejected
        };
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();

        for (var index = 0; index < 24; index++)
        {
            var id = VisualQaSeedIds.AffiliateApplication(index);
            if (await dbContext.AffiliateApplications.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var status = statuses[index % statuses.Length];
            var createdAt = index == 0
                ? now.AddHours(-4)
                : now.AddMonths(-((index % 8) + 1)).AddDays(-(index % 6));
            var application = new AffiliateApplication
            {
                Id = id,
                FullName = index == 5 ? "Hồ sơ rất dài " + new string('A', 130) : index % 2 == 0 ? $"Lê Affiliate {index + 1:00}" : $"Affiliate No Accent {index + 1:00}",
                Email = $"visual.qa.affiliate{index + 1:00}@example.invalid",
                PhoneNumber = $"091{index:0000000}",
                CompanyName = index % 3 == 0 ? null : $"Kênh đối tác QA {index + 1:00}",
                WebsiteUrl = $"https://example.invalid/visual-qa/affiliate/{index + 1:00}",
                PromotionChannels = index % 2 == 0 ? "Blog, LinkedIn, Newsletter" : "Cộng đồng, sự kiện, video ngắn",
                AudienceDescription = "Độc giả quan tâm đến hạ tầng số, backup, bảo mật và chi phí vận hành minh bạch.",
                ExperienceDescription = index == 3 ? "" : "Mô tả kinh nghiệm mẫu nhiều dòng.\nCó thể chứa tiếng Việt và emoji 🚀.",
                Status = status,
                ReviewNote = status == AffiliateApplicationStatus.Rejected ? "Từ chối mẫu để kiểm tra trạng thái và note." : null,
                ReviewedBy = status is AffiliateApplicationStatus.Approved or AffiliateApplicationStatus.Rejected ? actors.AdminId : null,
                ReviewedAt = status is AffiliateApplicationStatus.Approved or AffiliateApplicationStatus.Rejected ? createdAt.AddHours(6) : null
            };
            dbContext.AffiliateApplications.Add(application);
            newEntities[application] = createdAt;

            for (var historyIndex = 0; historyIndex < (int)status; historyIndex++)
            {
                var fromStatus = historyIndex == 0 ? AffiliateApplicationStatus.Pending : (AffiliateApplicationStatus)historyIndex;
                var toStatus = (AffiliateApplicationStatus)(historyIndex + 1);
                var history = new AffiliateApplicationStatusHistory
                {
                    Id = VisualQaSeedIds.AffiliateHistory(index, historyIndex),
                    AffiliateApplicationId = id,
                    FromStatus = fromStatus,
                    ToStatus = toStatus,
                    Note = historyIndex == 0 ? "Khởi tạo từ bộ dữ liệu Visual QA." : "Chuyển trạng thái mẫu để kiểm tra timeline.",
                    ChangedBy = historyIndex == 0 ? actors.EditorId : actors.AdminId
                };
                dbContext.AffiliateApplicationStatusHistories.Add(history);
                newEntities[history] = createdAt.AddHours(historyIndex + 1);
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }

    private static async Task SeedAuditLogsAsync(
        CloudServiceStoreDbContext dbContext,
        SeededActors actors,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        var entityNames = new[] { "ServicePlan", "Promotion", "OrderRequest", "AffiliateApplication", "NewsArticle", "LandingPageContent" };
        for (var index = 0; index < 40; index++)
        {
            var id = VisualQaSeedIds.AuditLog(index);
            if (await dbContext.AuditLogs.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var entityName = entityNames[index % entityNames.Length];
            var audit = new AuditLog
            {
                Id = id,
                AppUserId = index % 2 == 0 ? actors.AdminId : actors.EditorId,
                Action = index % 3 == 0 ? "Updated" : index % 3 == 1 ? "Created" : "Reviewed",
                EntityName = entityName,
                EntityId = entityName switch
                {
                    "ServicePlan" => VisualQaSeedIds.ServicePlan(index % 12),
                    "Promotion" => VisualQaSeedIds.Promotion(index % 6),
                    "OrderRequest" => VisualQaSeedIds.Order(index % 60),
                    "AffiliateApplication" => VisualQaSeedIds.AffiliateApplication(index % 24),
                    "NewsArticle" => VisualQaSeedIds.NewsArticle(index % 16),
                    _ => VisualQaSeedIds.LandingContentId
                },
                OldValuesJson = JsonSerializer.Serialize(new { status = "previous", synthetic = true }),
                NewValuesJson = JsonSerializer.Serialize(new { status = "current", synthetic = true }),
                IpAddress = "127.0.0.1",
                OccurredAt = now.AddDays(-(index * 4 + 1))
            };
            dbContext.AuditLogs.Add(audit);
            newEntities[audit] = audit.OccurredAt.AddMinutes(-1);
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }
}
