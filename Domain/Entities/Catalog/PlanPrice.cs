using Domain.Common;
using Domain.Enums;
using Domain.Exceptions;

namespace Domain.Entities.Catalog;

public class PlanPrice : BaseEntity, ISoftDelete
{
    public Guid ServicePlanId { get; set; }
    
    private decimal _price;
    public decimal Price
    {
        get => _price;
        set
        {
            if (value < 0)
                throw new DomainException("Price cannot be negative.");
            _price = value;
        }
    }

    public required string Currency { get; set; } = "VND";
    public BillingCycle BillingCycle { get; set; }
    
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }

    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation property
    public ServicePlan? ServicePlan { get; set; }
}
