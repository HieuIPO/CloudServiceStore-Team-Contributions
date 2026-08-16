namespace CloudServiceStore.Application.Landing;

public sealed record UpdateLandingPageContentRequest(
    string HeroEyebrow,
    string HeroTitle,
    string HeroDescription,
    string PrimaryCtaLabel,
    string PrimaryCtaUrl,
    string SecondaryCtaLabel,
    string SecondaryCtaUrl,
    string AboutTitle,
    string AboutMarkdown,
    string InfrastructureMarkdown,
    string UptimeCommitment,
    bool IsPublished);

public sealed record LandingPageContentDto(
    Guid Id,
    string HeroEyebrow,
    string HeroTitle,
    string HeroDescription,
    string PrimaryCtaLabel,
    string PrimaryCtaUrl,
    string SecondaryCtaLabel,
    string SecondaryCtaUrl,
    string AboutTitle,
    string AboutMarkdown,
    string InfrastructureMarkdown,
    string UptimeCommitment,
    bool IsPublished,
    DateTimeOffset? UpdatedAt);

public sealed record CreateTestimonialRequest(
    string CustomerName,
    string? CustomerRole,
    string CompanyName,
    string Quote,
    string? AvatarUrl,
    int DisplayOrder,
    bool IsActive);

public sealed record UpdateTestimonialRequest(
    string CustomerName,
    string? CustomerRole,
    string CompanyName,
    string Quote,
    string? AvatarUrl,
    int DisplayOrder,
    bool IsActive);

public sealed record TestimonialDto(
    Guid Id,
    string CustomerName,
    string? CustomerRole,
    string CompanyName,
    string Quote,
    string? AvatarUrl,
    int DisplayOrder,
    bool IsActive);

public sealed record CreateCustomerLogoRequest(
    string Name,
    string LogoUrl,
    string? WebsiteUrl,
    string AltText,
    int DisplayOrder,
    bool IsActive);

public sealed record UpdateCustomerLogoRequest(
    string Name,
    string LogoUrl,
    string? WebsiteUrl,
    string AltText,
    int DisplayOrder,
    bool IsActive);

public sealed record CustomerLogoDto(
    Guid Id,
    string Name,
    string LogoUrl,
    string? WebsiteUrl,
    string AltText,
    int DisplayOrder,
    bool IsActive);

public sealed record PublicLandingContentDto(
    LandingPageContentDto Content,
    IReadOnlyList<TestimonialDto> Testimonials,
    IReadOnlyList<CustomerLogoDto> CustomerLogos);

public interface ILandingContentService
{
    Task<PublicLandingContentDto?> GetPublicAsync(CancellationToken cancellationToken);
    Task<PublicLandingContentDto> GetAdminAsync(CancellationToken cancellationToken);
    Task<LandingPageContentDto> UpdateContentAsync(UpdateLandingPageContentRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<TestimonialDto> CreateTestimonialAsync(CreateTestimonialRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<TestimonialDto> UpdateTestimonialAsync(Guid id, UpdateTestimonialRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeleteTestimonialAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
    Task<CustomerLogoDto> CreateCustomerLogoAsync(CreateCustomerLogoRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<CustomerLogoDto> UpdateCustomerLogoAsync(Guid id, UpdateCustomerLogoRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeleteCustomerLogoAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
}
