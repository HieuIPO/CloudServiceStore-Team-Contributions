using Domain.Entities.Promotions;
using Domain.Exceptions;

namespace Domain.Strategies;

public class PercentageDiscountStrategy : IDiscountStrategy
{
    public decimal CalculateDiscount(decimal originalPrice, Promotion promotion)
    {
        if (promotion.DiscountValue < 0 || promotion.DiscountValue > 100)
        {
            throw new DomainException("Percentage discount must be between 0 and 100.");
        }

        return originalPrice * (promotion.DiscountValue / 100m);
    }
}
