using Domain.Common;

namespace Domain.Entities.Catalog;

public class ServiceCategory : BaseEntity, ISoftDelete
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime? DeletedAt { get; set; }
    
    // Navigation property
    public ICollection<ServicePlan> ServicePlans { get; set; } = new List<ServicePlan>();
}
