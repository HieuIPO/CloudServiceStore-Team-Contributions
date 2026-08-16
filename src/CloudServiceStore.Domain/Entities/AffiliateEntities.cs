using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Entities;

public sealed class AffiliateProgramContent : AuditableEntity
{
    public string Title { get; set; } = string.Empty;
    public string Summary { get; set; } = string.Empty;
    public string CommissionSummary { get; set; } = string.Empty;
    public string PolicyMarkdown { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
}

public sealed class AffiliateApplication : AuditableEntity
{
    public Guid? AppUserId { get; set; }
    public AppUser? AppUser { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string? CompanyName { get; set; }
    public string? WebsiteUrl { get; set; }
    public string PromotionChannels { get; set; } = string.Empty;
    public string AudienceDescription { get; set; } = string.Empty;
    public string? ExperienceDescription { get; set; }
    public AffiliateApplicationStatus Status { get; set; } = AffiliateApplicationStatus.Pending;
    public string? ReviewNote { get; set; }
    public Guid? ReviewedBy { get; set; }
    public DateTimeOffset? ReviewedAt { get; set; }
    public ICollection<AffiliateApplicationStatusHistory> StatusHistory { get; } = new List<AffiliateApplicationStatusHistory>();
}

public sealed class AffiliateApplicationStatusHistory : AuditableEntity
{
    public Guid AffiliateApplicationId { get; set; }
    public AffiliateApplication AffiliateApplication { get; set; } = null!;
    public AffiliateApplicationStatus FromStatus { get; set; }
    public AffiliateApplicationStatus ToStatus { get; set; }
    public string? Note { get; set; }
    public Guid? ChangedBy { get; set; }
}
