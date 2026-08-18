using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Entities;

public sealed class ServiceCategory : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<ServicePlan> ServicePlans { get; } = new List<ServicePlan>();
}

public sealed class ServicePlan : SoftDeletableEntity
{
    public Guid CategoryId { get; set; }
    public ServiceCategory Category { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;
    public string? QrCodePath { get; set; }
    public ICollection<ServicePlanFeature> Features { get; } = new List<ServicePlanFeature>();
    public ICollection<PlanPrice> Prices { get; } = new List<PlanPrice>();
    public ICollection<PromotionPlan> PromotionPlans { get; } = new List<PromotionPlan>();
}



public sealed class PlanPrice : AuditableEntity
{
    public Guid ServicePlanId { get; set; }
    public ServicePlan ServicePlan { get; set; } = null!;
    public BillingCycle BillingCycle { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "VND";
    public DateTimeOffset EffectiveFrom { get; set; }
    public DateTimeOffset? EffectiveTo { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class Promotion : SoftDeletableEntity
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public DiscountType DiscountType { get; set; }
    public decimal DiscountValue { get; set; }
    public BillingCycle? BillingCycle { get; set; }
    public DateTimeOffset StartsAt { get; set; }
    public DateTimeOffset EndsAt { get; set; }
    public bool IsActive { get; set; } = true;
    public bool ShowOnPublicBanner { get; set; }
    public ICollection<PromotionPlan> PromotionPlans { get; } = new List<PromotionPlan>();
}

public sealed class PromotionPlan : AuditableEntity
{
    public Guid PromotionId { get; set; }
    public Promotion Promotion { get; set; } = null!;
    public Guid ServicePlanId { get; set; }
    public ServicePlan ServicePlan { get; set; } = null!;
}
