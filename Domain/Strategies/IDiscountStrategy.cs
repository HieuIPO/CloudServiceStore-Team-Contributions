using Domain.Entities.Promotions;

namespace Domain.Strategies;

public interface IDiscountStrategy
{
    decimal CalculateDiscount(decimal originalPrice, Promotion promotion);
}
