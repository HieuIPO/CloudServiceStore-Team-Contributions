using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Promotions;

public interface IPromotionDiscountStrategy
{
    decimal Apply(decimal originalAmount, decimal discountValue);
}

public sealed class PercentageDiscountStrategy : IPromotionDiscountStrategy
{
    public decimal Apply(decimal originalAmount, decimal discountValue) =>
        Math.Max(0, decimal.Round(originalAmount * (1 - discountValue / 100), 2, MidpointRounding.AwayFromZero));
}

public sealed class FixedAmountDiscountStrategy : IPromotionDiscountStrategy
{
    public decimal Apply(decimal originalAmount, decimal discountValue) =>
        Math.Max(0, originalAmount - discountValue);
}

public interface IDiscountStrategyFactory
{
    IPromotionDiscountStrategy Get(DiscountType discountType);
}

public sealed class DiscountStrategyFactory(
    PercentageDiscountStrategy percentage,
    FixedAmountDiscountStrategy fixedAmount) : IDiscountStrategyFactory
{
    public IPromotionDiscountStrategy Get(DiscountType discountType) => discountType switch
    {
        DiscountType.Percentage => percentage,
        DiscountType.FixedAmount => fixedAmount,
        _ => throw new PromotionValidationException("Discount type is not supported.")
    };
}
