using Domain.Entities.Promotions;
using Domain.Exceptions;

namespace Domain.Strategies;

public class FixedAmountDiscountStrategy : IDiscountStrategy
{
    public decimal CalculateDiscount(decimal originalPrice, Promotion promotion)
    {
        if (promotion.DiscountValue < 0)
        {
            throw new DomainException("Fixed discount amount cannot be negative.");
        }

        var discount = promotion.DiscountValue;
        return discount > originalPrice ? originalPrice : discount;
    }
}
