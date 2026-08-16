using Domain.Common;
using Domain.Enums;

namespace Domain.Entities.Promotions;

public class Promotion : BaseEntity, ISoftDelete
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; } // Percentage or fixed amount
    
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
    
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
}
