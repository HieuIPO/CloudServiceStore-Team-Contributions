using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Entities;

public sealed class OrderRequest : AuditableEntity
{
    public Guid? AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public Guid ServicePlanId { get; set; }
    public ServicePlan ServicePlan { get; set; } = null!;
    public string CustomerName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public BillingCycle BillingCycle { get; set; }
    public decimal OriginalAmount { get; set; }
    public decimal QuotedAmount { get; set; }
    public string Currency { get; set; } = "VND";
    public string PlanNameSnapshot { get; set; } = string.Empty;
    public string SpecificationSnapshot { get; set; } = "{}";
    public string? PromotionCodeSnapshot { get; set; }
    public OrderRequestStatus Status { get; set; } = OrderRequestStatus.Pending;
    public string? Note { get; set; }
    public ICollection<OrderRequestStatusHistory> StatusHistory { get; } = new List<OrderRequestStatusHistory>();
}

public sealed class OrderRequestStatusHistory : AuditableEntity
{
    public Guid OrderRequestId { get; set; }
    public OrderRequest OrderRequest { get; set; } = null!;
    public OrderRequestStatus FromStatus { get; set; }
    public OrderRequestStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public Guid? ChangedBy { get; set; }
}

public sealed class AuditLog : AuditableEntity
{
    public Guid? AppUserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public Guid? EntityId { get; set; }
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTimeOffset OccurredAt { get; set; }
}
