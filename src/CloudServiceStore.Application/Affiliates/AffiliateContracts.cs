using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Affiliates;

public sealed record AffiliateProgramContentDto(
    Guid Id,
    string Title,
    string Summary,
    string CommissionSummary,
    string PolicyMarkdown,
    bool IsPublished,
    DateTimeOffset? UpdatedAt);

public sealed record UpdateAffiliateProgramContentRequest(
    string Title,
    string Summary,
    string CommissionSummary,
    string PolicyMarkdown,
    bool IsPublished);

public sealed record CreateAffiliateApplicationRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string? WebsiteUrl,
    string PromotionChannels,
    string AudienceDescription,
    string? ExperienceDescription);

public sealed record AffiliateApplicationOwner(Guid UserId, string FullName, string Email);

public sealed record AffiliateApplicationQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    AffiliateApplicationStatus? Status = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null);

public sealed record UpdateAffiliateStatusRequest(AffiliateApplicationStatus Status, string? Note);

public sealed record AffiliateApplicationConfirmationDto(
    Guid Id,
    AffiliateApplicationStatus Status,
    DateTimeOffset CreatedAt);

public sealed record AffiliateApplicationListItemDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string? WebsiteUrl,
    string PromotionChannels,
    AffiliateApplicationStatus Status,
    DateTimeOffset CreatedAt);

public sealed record AffiliateStatusHistoryDto(
    Guid Id,
    AffiliateApplicationStatus FromStatus,
    AffiliateApplicationStatus ToStatus,
    string? Note,
    Guid? ChangedBy,
    DateTimeOffset CreatedAt);

public sealed record AffiliateApplicationDetailDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string? WebsiteUrl,
    string PromotionChannels,
    string AudienceDescription,
    string? ExperienceDescription,
    AffiliateApplicationStatus Status,
    string? ReviewNote,
    Guid? ReviewedBy,
    DateTimeOffset? ReviewedAt,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<AffiliateStatusHistoryDto> StatusHistory);

public sealed record CustomerAffiliateQuery(
    int Page = 1,
    int PageSize = 20,
    AffiliateApplicationStatus? Status = null);

public sealed record CustomerAffiliateApplicationListItemDto(
    Guid Id,
    string FullName,
    string? CompanyName,
    AffiliateApplicationStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt);

public sealed record CustomerAffiliateStatusHistoryDto(
    Guid Id,
    AffiliateApplicationStatus FromStatus,
    AffiliateApplicationStatus ToStatus,
    DateTimeOffset CreatedAt);

public sealed record CustomerAffiliateApplicationDetailDto(
    Guid Id,
    string FullName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string? WebsiteUrl,
    string PromotionChannels,
    string AudienceDescription,
    string? ExperienceDescription,
    AffiliateApplicationStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<CustomerAffiliateStatusHistoryDto> StatusHistory);

public interface IAffiliateService
{
    Task<AffiliateProgramContentDto?> GetProgramContentAsync(bool publicOnly, CancellationToken cancellationToken);
    Task<AffiliateProgramContentDto> UpdateProgramContentAsync(UpdateAffiliateProgramContentRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<AffiliateApplicationConfirmationDto> CreateApplicationAsync(CreateAffiliateApplicationRequest request, AffiliateApplicationOwner owner, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<AffiliateApplicationListItemDto>> GetApplicationsAsync(AffiliateApplicationQuery query, CancellationToken cancellationToken);
    Task<AffiliateApplicationDetailDto?> GetApplicationAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<CustomerAffiliateApplicationListItemDto>> GetCustomerApplicationsAsync(Guid userId, CustomerAffiliateQuery query, CancellationToken cancellationToken);
    Task<CustomerAffiliateApplicationDetailDto?> GetCustomerApplicationAsync(Guid userId, Guid id, CancellationToken cancellationToken);
    Task<AffiliateApplicationDetailDto> UpdateStatusAsync(Guid id, UpdateAffiliateStatusRequest request, Guid actorId, string? ipAddress, CancellationToken cancellationToken);
}
