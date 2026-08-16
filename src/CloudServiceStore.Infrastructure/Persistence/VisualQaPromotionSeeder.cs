using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

internal static partial class VisualQaDataSeeder
{
    private static async Task SeedPromotionsAsync(
        CloudServiceStoreDbContext dbContext,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var definitions = new[]
        {
            ("QA-ACTIVE-10", "Khuyến mãi khách hàng mới", DiscountType.Percentage, 10m, now.AddDays(-5), now.AddDays(20), true),
            ("QA-ACTIVE-FIXED", "Giảm trực tiếp gói Scale", DiscountType.FixedAmount, 150_000m, now.AddDays(-2), now.AddDays(12), true),
            ("QA-UPCOMING-20", "Ưu đãi mùa triển khai", DiscountType.Percentage, 20m, now.AddDays(4), now.AddDays(35), true),
            ("QA-UPCOMING-500", "Ưu đãi cuối tuần", DiscountType.FixedAmount, 500_000m, now.AddDays(10), now.AddDays(17), true),
            ("QA-EXPIRED-15", "Ưu đãi đã kết thúc", DiscountType.Percentage, 15m, now.AddDays(-65), now.AddDays(-20), true),
            ("QA-DISABLED", "Mã tạm ngưng để kiểm tra", DiscountType.Percentage, 5m, now.AddDays(-1), now.AddDays(40), false)
        };
        var promotionIds = new Guid[definitions.Length];
        var newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();

        for (var index = 0; index < definitions.Length; index++)
        {
            var definition = definitions[index];
            var id = VisualQaSeedIds.Promotion(index);
            promotionIds[index] = id;
            if (await dbContext.Promotions.AnyAsync(x => x.Id == id, cancellationToken)) continue;

            var promotion = new Promotion
            {
                Id = id,
                Code = definition.Item1,
                Name = definition.Item2,
                DiscountType = definition.Item3,
                DiscountValue = definition.Item4,
                StartsAt = definition.Item5,
                EndsAt = definition.Item6,
                IsActive = definition.Item7
            };
            dbContext.Promotions.Add(promotion);
            newEntities[promotion] = definition.Item5.AddDays(-1);
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);

        newEntities = new Dictionary<AuditableEntity, DateTimeOffset>();
        for (var promotionIndex = 0; promotionIndex < promotionIds.Length; promotionIndex++)
        {
            foreach (var planIndex in new[] { promotionIndex % 12, (promotionIndex * 2 + 3) % 12 })
            {
                var id = VisualQaSeedIds.PromotionPlan(promotionIndex, planIndex);
                if (await dbContext.PromotionPlans.AnyAsync(x => x.Id == id, cancellationToken)) continue;

                var link = new PromotionPlan
                {
                    Id = id,
                    PromotionId = promotionIds[promotionIndex],
                    ServicePlanId = VisualQaSeedIds.ServicePlan(planIndex)
                };
                dbContext.PromotionPlans.Add(link);
                newEntities[link] = now.AddDays(-(promotionIndex + 1));
            }
        }

        await PersistNewEntitiesAsync(dbContext, newEntities, cancellationToken);
    }
}
