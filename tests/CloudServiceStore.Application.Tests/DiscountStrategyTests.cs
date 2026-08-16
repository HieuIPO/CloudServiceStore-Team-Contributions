using CloudServiceStore.Application.Promotions;

namespace CloudServiceStore.Application.Tests;

public sealed class DiscountStrategyTests
{
    [Fact]
    public void Percentage_discount_returns_discounted_price()
    {
        var result = new PercentageDiscountStrategy().Apply(100_000, 10);

        Assert.Equal(90_000, result);
    }

    [Fact]
    public void Fixed_discount_greater_than_price_never_returns_negative_amount()
    {
        var result = new FixedAmountDiscountStrategy().Apply(50_000, 70_000);

        Assert.Equal(0, result);
    }
}
