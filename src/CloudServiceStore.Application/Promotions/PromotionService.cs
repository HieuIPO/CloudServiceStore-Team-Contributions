using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Promotions;

public sealed class PromotionService(IPromotionRepository repository) : IPromotionService
{
    private static readonly IReadOnlySet<string> SortFields =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "code", "name", "startsAt", "endsAt" };

    public async Task<PagedResult<PromotionDto>> GetPromotionsAsync(PromotionQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection, SortFields,
            message => new PromotionValidationException(message));
        var result = await repository.GetPromotionsAsync(query, ct);
        return new(result.Items.Select(Map).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<PromotionDto?> GetPromotionAsync(Guid id, CancellationToken ct) =>
        (await repository.FindPromotionAsync(id, ct)) is { } promotion ? Map(promotion) : null;

    public async Task<PromotionDto> CreatePromotionAsync(CreatePromotionRequest request, Guid actorId, CancellationToken ct)
    {
        Validate(request.Code, request.Name, request.DiscountType, request.DiscountValue, request.StartsAt, request.EndsAt, request.ServicePlanIds, request.BillingCycle);
        var code = NormalizeCode(request.Code);
        if (await repository.CodeExistsAsync(code, null, ct))
            throw new PromotionConflictException("Promotion code already exists.");

        await EnsurePlansExistAsync(request.ServicePlanIds, ct);
        var showOnPublicBanner = request.IsActive && request.ShowOnPublicBanner;
        await ClearOtherPublicBannersAsync(showOnPublicBanner, null, actorId, ct);
        var promotion = new Promotion
        {
            Code = code,
            Name = request.Name.Trim(),
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            BillingCycle = request.BillingCycle,
            StartsAt = request.StartsAt,
            EndsAt = request.EndsAt,
            IsActive = request.IsActive,
            ShowOnPublicBanner = showOnPublicBanner,
            CreatedBy = actorId
        };
        AddPlans(promotion, request.ServicePlanIds, actorId);
        repository.Add(promotion);
        repository.AddAudit(actorId, "Promotion.Created", nameof(Promotion), promotion.Id);
        await repository.SaveChangesAsync(ct);
        return Map(promotion);
    }

    public async Task<PromotionDto> UpdatePromotionAsync(Guid id, UpdatePromotionRequest request, Guid actorId, CancellationToken ct)
    {
        Validate(request.Code, request.Name, request.DiscountType, request.DiscountValue, request.StartsAt, request.EndsAt, request.ServicePlanIds, request.BillingCycle);
        var promotion = await repository.FindPromotionAsync(id, ct)
            ?? throw new PromotionNotFoundException("Promotion was not found.");
        var code = NormalizeCode(request.Code);
        if (await repository.CodeExistsAsync(code, id, ct))
            throw new PromotionConflictException("Promotion code already exists.");

        await EnsurePlansExistAsync(request.ServicePlanIds, ct);
        var showOnPublicBanner = request.IsActive && request.ShowOnPublicBanner;
        await ClearOtherPublicBannersAsync(showOnPublicBanner, id, actorId, ct);
        promotion.Code = code;
        promotion.Name = request.Name.Trim();
        promotion.DiscountType = request.DiscountType;
        promotion.DiscountValue = request.DiscountValue;
        promotion.BillingCycle = request.BillingCycle;
        promotion.StartsAt = request.StartsAt;
        promotion.EndsAt = request.EndsAt;
        promotion.IsActive = request.IsActive;
        promotion.ShowOnPublicBanner = showOnPublicBanner;
        promotion.UpdatedBy = actorId;
        repository.SyncPromotionPlans(promotion, request.ServicePlanIds, actorId);
        repository.AddAudit(actorId, "Promotion.Updated", nameof(Promotion), id);
        await repository.SaveChangesAsync(ct);
        return Map(promotion);
    }

    public async Task DeletePromotionAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var promotion = await repository.FindPromotionAsync(id, ct)
            ?? throw new PromotionNotFoundException("Promotion was not found.");
        promotion.IsDeleted = true;
        promotion.DeletedAt = DateTimeOffset.UtcNow;
        promotion.DeletedBy = actorId;
        promotion.ShowOnPublicBanner = false;
        repository.AddAudit(actorId, "Promotion.Deleted", nameof(Promotion), id);
        await repository.SaveChangesAsync(ct);
    }

    private async Task EnsurePlansExistAsync(IReadOnlyList<Guid> planIds, CancellationToken ct)
    {
        var distinctIds = planIds.Distinct().ToArray();
        var existingIds = await repository.GetExistingPlanIdsAsync(distinctIds, ct);
        if (existingIds.Count != distinctIds.Length)
            throw new PromotionValidationException("Every selected service plan must exist.");
    }

    private static void AddPlans(Promotion promotion, IEnumerable<Guid> planIds, Guid actorId)
    {
        foreach (var planId in planIds.Distinct())
            promotion.PromotionPlans.Add(new PromotionPlan { ServicePlanId = planId, CreatedBy = actorId });
    }

    private async Task ClearOtherPublicBannersAsync(bool showOnPublicBanner, Guid? excludedId, Guid actorId, CancellationToken ct)
    {
        if (!showOnPublicBanner) return;

        var selectedPromotions = await repository.GetPublicBannerPromotionsAsync(excludedId, ct);
        foreach (var selectedPromotion in selectedPromotions)
        {
            selectedPromotion.ShowOnPublicBanner = false;
            selectedPromotion.UpdatedBy = actorId;
        }
    }

    private static void Validate(string code, string name, DiscountType discountType, decimal discountValue, DateTimeOffset startsAt, DateTimeOffset endsAt, IReadOnlyList<Guid> planIds, BillingCycle? billingCycle)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Trim().Length > 50)
            throw new PromotionValidationException("Promotion code is required and must be 50 characters or fewer.");
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 160)
            throw new PromotionValidationException("Promotion name is required and must be 160 characters or fewer.");
        if (endsAt <= startsAt)
            throw new PromotionValidationException("EndsAt must be after StartsAt.");
        if (discountValue <= 0)
            throw new PromotionValidationException("Discount value must be greater than zero.");
        if (discountType == DiscountType.Percentage && discountValue > 100)
            throw new PromotionValidationException("Percentage discount cannot exceed 100.");
        if (!Enum.IsDefined(discountType))
            throw new PromotionValidationException("Discount type is not supported.");
        if (billingCycle is not null && !Enum.IsDefined(billingCycle.Value))
            throw new PromotionValidationException("Billing cycle is not supported.");
        if (planIds.Count == 0 || planIds.Any(x => x == Guid.Empty))
            throw new PromotionValidationException("At least one valid service plan is required.");
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100)
            throw new PromotionValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
    }

    private static string NormalizeCode(string code) => code.Trim().ToUpperInvariant();
    private static PromotionDto Map(Promotion x) => new(
        x.Id,
        x.Code,
        x.Name,
        x.DiscountType,
        x.DiscountValue,
        x.StartsAt,
        x.EndsAt,
        x.IsActive,
        x.PromotionPlans.Select(item => item.ServicePlanId).ToArray(),
        x.ShowOnPublicBanner,
        x.BillingCycle);
}
