using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Promotions;

public static class PromotionApplicability
{
    public static bool AppliesToCycle(Promotion promotion, BillingCycle billingCycle) =>
        promotion.BillingCycle is null || promotion.BillingCycle == billingCycle;
}
