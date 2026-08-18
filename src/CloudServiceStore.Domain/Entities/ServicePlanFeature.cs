using CloudServiceStore.Domain.Common;

namespace CloudServiceStore.Domain.Entities;

public sealed class ServicePlanFeature : AuditableEntity
{
    public Guid ServicePlanId { get; set; }
    public ServicePlan ServicePlan { get; set; } = null!;
    public string FeatureKey { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Unit { get; set; }
    public int DisplayOrder { get; set; }
}
