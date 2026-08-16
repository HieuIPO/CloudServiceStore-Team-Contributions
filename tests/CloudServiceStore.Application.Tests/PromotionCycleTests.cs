using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Tests;

public sealed class PromotionCycleTests
{
    [Fact]
    public void Promotion_without_cycle_scope_applies_to_both_cycles()
    {
        var promotion = new Promotion();

        Assert.True(PromotionApplicability.AppliesToCycle(promotion, BillingCycle.Monthly));
        Assert.True(PromotionApplicability.AppliesToCycle(promotion, BillingCycle.Yearly));
    }

    [Fact]
    public void Promotion_with_yearly_scope_does_not_apply_to_monthly_cycle()
    {
        var promotion = new Promotion { BillingCycle = BillingCycle.Yearly };

        Assert.False(PromotionApplicability.AppliesToCycle(promotion, BillingCycle.Monthly));
        Assert.True(PromotionApplicability.AppliesToCycle(promotion, BillingCycle.Yearly));
    }
}
