using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Entities.Catalog;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

internal static partial class VisualQaDataSeeder
{
    private static async Task SeedCatalogAsync(
        CloudServiceStoreDbContext dbContext,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var categories = new[]
        {
            ("VPS", "vps", "Máy chủ ảo linh hoạt cho website, API và hệ thống dữ liệu."),
            ("Hosting", "hosting", "Hosting quản trị sẵn cho website và ứng dụng doanh nghiệp."),
            ("Domain", "domain", "Tên miền quốc tế và tên miền thương hiệu cho doanh nghiệp."),
            ("Email doanh nghiệp", "email-doanh-nghiep", "Email theo tên miền riêng, chuyên nghiệp và bảo mật."),
            ("SSL", "ssl", "Chứng chỉ SSL bảo vệ kết nối và tăng độ tin cậy cho website."),
            ("Firewall chống DDoS", "firewall-chong-ddos", "Lớp bảo vệ lưu lượng và giảm thiểu tấn công DDoS.")
        };
        var categoryIds = new Guid[categories.Length];
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();

        for (var index = 0; index < categories.Length; index++)
        {
            var id = VisualQaSeedIds.ServiceCategory(index);
            categoryIds[index] = id;
            var existing = await dbContext.ServiceCategories.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            var category = existing ?? new ServiceCategory { Id = id };
            category.Name = categories[index].Item1;
            category.Slug = categories[index].Item2;
            category.Description = index == 5
                ? categories[index].Item3 + " " + new string('x', 420)
                : categories[index].Item3;
            category.DisplayOrder = index + 1;
            category.IsActive = true;
            category.IsDeleted = false;
            category.DeletedAt = null;
            category.DeletedBy = null;

            if (existing is null)
            {
                dbContext.ServiceCategories.Add(category);
                newEntities[category] = now.AddDays(-(index * 19 + 2));
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);

        var planIds = new Guid[12];
        var planNames = new string[12];
        var planPrices = new[] { 99_000m, 199_000m, 399_000m, 699_000m, 1_490_000m, 2_990_000m, 4_990_000m, 7_990_000m, 12_990_000m, 24_990_000m, 49_990_000m, 999_999_999m };
        newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();

        for (var index = 0; index < planIds.Length; index++)
        {
            var id = VisualQaSeedIds.ServicePlan(index);
            planIds[index] = id;
            var categoryIndex = index / 2;
            var name = index == 11
                ? "Enterprise Ultra Long Plan Name " + new string('W', 105)
                : $"{categories[categoryIndex].Item1} {(index % 2 == 0 ? "Starter" : "Scale")}";
            planNames[index] = name;

            var existing = await dbContext.ServicePlans.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
            var plan = existing ?? new ServicePlan { Id = id };
            plan.CategoryId = categoryIds[categoryIndex];
            plan.Name = name;
            plan.Slug = $"visual-qa-plan-{index + 1:00}";
            plan.Summary = index == 10
                ? "Gói doanh nghiệp có thông số mở rộng, mô tả dài để kiểm tra wrap trên màn hình hẹp."
                : $"Gói {name} với cấu hình minh bạch và hỗ trợ kỹ thuật theo từng giai đoạn.";
            plan.IsFeatured = index % 3 == 0;
            plan.IsActive = true;
            plan.IsDeleted = false;
            plan.DeletedAt = null;
            plan.DeletedBy = null;
            plan.QrCodePath = $"/api/v1/service-plans/{id}/qr-code/image";

            if (existing is null)
            {
                dbContext.ServicePlans.Add(plan);
                newEntities[plan] = now.AddDays(-(index * 13 + 4));
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);

        newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var planIndex = 0; planIndex < planIds.Length; planIndex++)
        {
            var featureValues = new[]
            {
                ("cpu", "vCPU", $"{Math.Max(1, planIndex + 1)}", "vCPU"),
                ("memory", "RAM", $"{Math.Max(2, (planIndex + 1) * 2)}", "GB"),
                ("storage", "SSD NVMe", $"{Math.Max(20, (planIndex + 1) * 40)}", "GB"),
                ("support", "Hỗ trợ", planIndex % 2 == 0 ? "8x5" : "24x7", null)
            };

            for (var featureIndex = 0; featureIndex < featureValues.Length; featureIndex++)
            {
                var id = VisualQaSeedIds.ServicePlanFeature(planIndex, featureIndex);
                if (await dbContext.ServicePlanFeatures.AnyAsync(x => x.Id == id, cancellationToken)) continue;

                var feature = new ServicePlanFeature
                {
                    Id = id,
                    ServicePlanId = planIds[planIndex],
                    FeatureKey = featureValues[featureIndex].Item1,
                    DisplayName = featureValues[featureIndex].Item2,
                    Value = featureValues[featureIndex].Item3,
                    Unit = featureValues[featureIndex].Item4,
                    DisplayOrder = featureIndex + 1
                };
                dbContext.ServicePlanFeatures.Add(feature);
                newEntities[feature] = now.AddDays(-(planIndex * 9 + featureIndex + 1));
            }

            var priceVersions = new[]
            {
                (BillingCycle.Monthly, planPrices[planIndex] * 0.85m, now.AddDays(-180), now.AddDays(-90), false),
                (BillingCycle.Monthly, planPrices[planIndex], now.AddDays(-90), (DateTimeOffset?)null, true),
                (BillingCycle.Yearly, planPrices[planIndex] * 10m, now.AddDays(-180), now.AddDays(-90), false),
                (BillingCycle.Yearly, planPrices[planIndex] * 12m, now.AddDays(-90), (DateTimeOffset?)null, true)
            };
            for (var version = 0; version < priceVersions.Length; version++)
            {
                var id = VisualQaSeedIds.PlanPrice(planIndex, version);
                if (await dbContext.PlanPrices.AnyAsync(x => x.Id == id, cancellationToken)) continue;

                var price = priceVersions[version];
                var planPrice = new PlanPrice
                {
                    Id = id,
                    ServicePlanId = planIds[planIndex],
                    BillingCycle = price.Item1,
                    Amount = price.Item2,
                    Currency = "VND",
                    EffectiveFrom = price.Item3,
                    EffectiveTo = price.Item4,
                    IsActive = price.Item5
                };
                dbContext.PlanPrices.Add(planPrice);
                newEntities[planPrice] = price.Item3.AddDays(-1);
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }
}
