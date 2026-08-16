using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Catalog;

public sealed record ServiceCategoryQuery(
    int Page = 1,
    int PageSize = 12,
    string? Search = null,
    bool? IsActive = true,
    string? SortBy = null,
    string? SortDirection = null);
public sealed record CreateServiceCategoryRequest(string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);
public sealed record UpdateServiceCategoryRequest(string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);
public sealed record ServiceCategoryDto(Guid Id, string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);

public sealed record ServicePlanQuery(
    int Page = 1,
    int PageSize = 12,
    string? Search = null,
    Guid? CategoryId = null,
    bool? IsActive = true,
    bool? IsFeatured = null,
    bool IncludeInactive = false,
    string? SortBy = null,
    string? SortDirection = null);
public sealed record ServicePlanFeatureRequest(string FeatureKey, string DisplayName, string Value, string? Unit, int DisplayOrder);
public sealed record ServicePlanFeatureDto(Guid Id, string FeatureKey, string DisplayName, string Value, string? Unit, int DisplayOrder);
public sealed record CreateServicePlanRequest(Guid CategoryId, string Name, string Slug, string Summary, bool IsFeatured, bool IsActive, IReadOnlyList<ServicePlanFeatureRequest> Features);
public sealed record UpdateServicePlanRequest(Guid CategoryId, string Name, string Slug, string Summary, bool IsFeatured, bool IsActive, IReadOnlyList<ServicePlanFeatureRequest> Features);
public sealed record ActivePromotionDto(Guid Id, string Code, string Name, DiscountType DiscountType, decimal DiscountValue, BillingCycle? BillingCycle = null);
public sealed record ServicePlanListItemDto(Guid Id, Guid CategoryId, string CategoryName, string Name, string Slug, string Summary, bool IsFeatured, bool IsActive, decimal? CurrentMonthlyPrice, decimal? PromotionalMonthlyPrice, string Currency, ActivePromotionDto? ActivePromotion, string? QrCodePath);
public sealed record ServicePlanDetailDto(Guid Id, Guid CategoryId, string CategoryName, string Name, string Slug, string Summary, bool IsFeatured, bool IsActive, string? QrCodePath, IReadOnlyList<ServicePlanFeatureDto> Features, IReadOnlyList<PlanPriceDto> Prices, IReadOnlyList<ActivePromotionDto> ActivePromotions);

public sealed record CreatePlanPriceRequest(BillingCycle BillingCycle, decimal Amount, string Currency, DateTimeOffset EffectiveFrom, DateTimeOffset? EffectiveTo, bool IsActive = true);
public sealed record ClosePlanPriceRequest(DateTimeOffset EffectiveTo);
public sealed record PlanPriceDto(Guid Id, Guid ServicePlanId, BillingCycle BillingCycle, decimal Amount, string Currency, DateTimeOffset EffectiveFrom, DateTimeOffset? EffectiveTo, bool IsActive);
public sealed record QrCodeDto(string ImagePath, string TargetUrl);
public sealed record QrCodeImageDto(byte[] Content, string ContentType);

public interface IQrCodeService
{
    byte[] GeneratePng(string content);
}

public interface ICatalogService
{
    Task<PagedResult<ServiceCategoryDto>> GetCategoriesAsync(ServiceCategoryQuery query, CancellationToken cancellationToken);
    Task<ServiceCategoryDto?> GetCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task<ServiceCategoryDto> CreateCategoryAsync(CreateServiceCategoryRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<ServiceCategoryDto> UpdateCategoryAsync(Guid id, UpdateServiceCategoryRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeleteCategoryAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
    Task<PagedResult<ServicePlanListItemDto>> GetPlansAsync(ServicePlanQuery query, CancellationToken cancellationToken);
    Task<ServicePlanDetailDto?> GetPlanAsync(Guid id, CancellationToken cancellationToken);
    Task<ServicePlanDetailDto?> GetPlanBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<ServicePlanDetailDto> CreatePlanAsync(CreateServicePlanRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<ServicePlanDetailDto> UpdatePlanAsync(Guid id, UpdateServicePlanRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeletePlanAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
    Task<PlanPriceDto> CreatePriceAsync(Guid planId, CreatePlanPriceRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<PlanPriceDto> ClosePriceAsync(Guid priceId, ClosePlanPriceRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<QrCodeDto> GenerateQrCodeAsync(Guid planId, string publicBaseUrl, Guid actorId, CancellationToken cancellationToken);
    Task<QrCodeImageDto> GetQrCodeImageAsync(Guid planId, string publicBaseUrl, CancellationToken cancellationToken);
}
