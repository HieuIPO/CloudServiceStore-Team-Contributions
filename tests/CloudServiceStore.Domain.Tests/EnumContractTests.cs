using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Tests;

public sealed class EnumContractTests
{
    [Theory]
    [InlineData(AffiliateApplicationStatus.Pending, 1)]
    [InlineData(AffiliateApplicationStatus.UnderReview, 2)]
    [InlineData(AffiliateApplicationStatus.Approved, 3)]
    [InlineData(AffiliateApplicationStatus.Rejected, 4)]
    public void Affiliate_status_values_are_stable(AffiliateApplicationStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }

    [Theory]
    [InlineData(BillingCycle.Monthly, 1)]
    [InlineData(BillingCycle.Yearly, 12)]
    public void Billing_cycle_values_match_price_contract(BillingCycle cycle, int expected)
    {
        Assert.Equal(expected, (int)cycle);
    }

    [Theory]
    [InlineData(DiscountType.Percentage, 1)]
    [InlineData(DiscountType.FixedAmount, 2)]
    public void Discount_type_values_are_stable(DiscountType type, int expected)
    {
        Assert.Equal(expected, (int)type);
    }

    [Theory]
    [InlineData(NewsArticleStatus.Draft, 1)]
    [InlineData(NewsArticleStatus.Published, 2)]
    public void News_status_values_match_persistence_contract(NewsArticleStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }

    [Theory]
    [InlineData(OrderRequestStatus.Pending, 1)]
    [InlineData(OrderRequestStatus.Contacted, 2)]
    [InlineData(OrderRequestStatus.Approved, 3)]
    [InlineData(OrderRequestStatus.Rejected, 4)]
    [InlineData(OrderRequestStatus.Cancelled, 5)]
    public void Order_status_values_are_stable(OrderRequestStatus status, int expected)
    {
        Assert.Equal(expected, (int)status);
    }
}
