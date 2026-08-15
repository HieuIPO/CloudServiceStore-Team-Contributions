using Domain.Common;

namespace Domain.Entities.Catalog;

public class ServicePlan : BaseEntity, ISoftDelete
{
    public Guid ServiceCategoryId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }

    // Navigation properties
    public ServiceCategory? ServiceCategory { get; set; }
    public ICollection<PlanPrice> Prices { get; set; } = new List<PlanPrice>();
    public ICollection<ServicePlanFeature> Features { get; set; } = new List<ServicePlanFeature>();
}
