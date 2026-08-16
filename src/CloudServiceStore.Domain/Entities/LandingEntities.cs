using CloudServiceStore.Domain.Common;

namespace CloudServiceStore.Domain.Entities;

public sealed class LandingPageContent : AuditableEntity
{
    public string HeroEyebrow { get; set; } = string.Empty;
    public string HeroTitle { get; set; } = string.Empty;
    public string HeroDescription { get; set; } = string.Empty;
    public string PrimaryCtaLabel { get; set; } = string.Empty;
    public string PrimaryCtaUrl { get; set; } = string.Empty;
    public string SecondaryCtaLabel { get; set; } = string.Empty;
    public string SecondaryCtaUrl { get; set; } = string.Empty;
    public string AboutTitle { get; set; } = string.Empty;
    public string AboutMarkdown { get; set; } = string.Empty;
    public string InfrastructureMarkdown { get; set; } = string.Empty;
    public string UptimeCommitment { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
}

public sealed class Testimonial : SoftDeletableEntity
{
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerRole { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string Quote { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}

public sealed class CustomerLogo : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string? WebsiteUrl { get; set; }
    public string AltText { get; set; } = string.Empty;
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
