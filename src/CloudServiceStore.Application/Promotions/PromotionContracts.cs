using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Promotions;

public sealed record PromotionQuery(
    int Page = 1,
    int PageSize = 12,
    bool? IsActive = true,
    Guid? ServicePlanId = null,
    string? SortBy = null,
    string? SortDirection = null);

public sealed record CreatePromotionRequest(
    string Code,
    string Name,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool IsActive,
    IReadOnlyList<Guid> ServicePlanIds,
    bool ShowOnPublicBanner = false,
    BillingCycle? BillingCycle = null);

public sealed record UpdatePromotionRequest(
    string Code,
    string Name,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool IsActive,
    IReadOnlyList<Guid> ServicePlanIds,
    bool ShowOnPublicBanner = false,
    BillingCycle? BillingCycle = null);

public sealed record PromotionDto(
    Guid Id,
    string Code,
    string Name,
    DiscountType DiscountType,
    decimal DiscountValue,
    DateTimeOffset StartsAt,
    DateTimeOffset EndsAt,
    bool IsActive,
    IReadOnlyList<Guid> ServicePlanIds,
    bool ShowOnPublicBanner,
    BillingCycle? BillingCycle = null);

public interface IPromotionService
{
    Task<PagedResult<PromotionDto>> GetPromotionsAsync(PromotionQuery query, CancellationToken cancellationToken);
    Task<PromotionDto?> GetPromotionAsync(Guid id, CancellationToken cancellationToken);
    Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<PromotionDto> UpdatePromotionAsync(Guid id, UpdatePromotionRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeletePromotionAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
}
