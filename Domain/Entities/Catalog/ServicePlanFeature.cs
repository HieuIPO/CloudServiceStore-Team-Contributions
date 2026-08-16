using Domain.Common;

namespace Domain.Entities.Catalog;

public class ServicePlanFeature : BaseEntity
{
    public Guid ServicePlanId { get; set; }
    public required string FeatureName { get; set; }
    public string? Description { get; set; }
    public bool IsIncluded { get; set; }
}
