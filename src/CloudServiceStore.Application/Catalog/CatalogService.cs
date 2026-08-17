using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Entities.Catalog;

namespace CloudServiceStore.Application.Catalog;

public sealed class CatalogService(
    ICatalogRepository repository,
    IDiscountStrategyFactory? discountStrategyFactory = null,
    IQrCodeService? qrCodeService = null) : ICatalogService
{
    private static readonly IReadOnlySet<string> CategorySortFields =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "name", "displayOrder", "createdAt" };
    private static readonly IReadOnlySet<string> PlanSortFields =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "name", "isFeatured", "createdAt" };

    private readonly IDiscountStrategyFactory discountStrategyFactory = discountStrategyFactory
        ?? new DiscountStrategyFactory(new PercentageDiscountStrategy(), new FixedAmountDiscountStrategy());

    public async Task<PagedResult<ServiceCategoryDto>> GetCategoriesAsync(ServiceCategoryQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection, CategorySortFields,
            message => new CatalogValidationException(message));
        var result = await repository.GetCategoriesAsync(query, ct);
        return new(result.Items.Select(Map).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<ServiceCategoryDto?> GetCategoryAsync(Guid id, CancellationToken ct) => (await repository.FindCategoryAsync(id, ct)) is { } category ? Map(category) : null;

    public async Task<ServiceCategoryDto> CreateCategoryAsync(CreateServiceCategoryRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateCategory(request.Name, request.Slug);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, null, ct)) throw new CatalogConflictException("Service category slug already exists.");
        var category = new ServiceCategory { Name = request.Name.Trim(), Slug = slug, Description = CleanOptional(request.Description), DisplayOrder = request.DisplayOrder, IsActive = request.IsActive, CreatedBy = actorId };
        repository.AddCategory(category); repository.AddAudit(actorId, "Catalog.CategoryCreated", nameof(ServiceCategory), category.Id);
        await repository.SaveChangesAsync(ct); return Map(category);
    }

    public async Task<ServiceCategoryDto> UpdateCategoryAsync(Guid id, UpdateServiceCategoryRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateCategory(request.Name, request.Slug); var category = await repository.FindCategoryAsync(id, ct) ?? throw new CatalogNotFoundException("Service category was not found.");
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, id, ct)) throw new CatalogConflictException("Service category slug already exists.");
        category.Name = request.Name.Trim(); category.Slug = slug; category.Description = CleanOptional(request.Description); category.DisplayOrder = request.DisplayOrder; category.IsActive = request.IsActive; category.UpdatedAt = DateTimeOffset.UtcNow; category.UpdatedBy = actorId;
        repository.AddAudit(actorId, "Catalog.CategoryUpdated", nameof(ServiceCategory), id); await repository.SaveChangesAsync(ct); return Map(category);
    }

    public async Task DeleteCategoryAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var category = await repository.FindCategoryAsync(id, ct) ?? throw new CatalogNotFoundException("Service category was not found.");
        if (await repository.CategoryHasPlansAsync(id, ct)) throw new CatalogConflictException("A category with service plans cannot be deleted.");
        category.IsDeleted = true; category.DeletedAt = DateTimeOffset.UtcNow; category.DeletedBy = actorId; repository.AddAudit(actorId, "Catalog.CategoryDeleted", nameof(ServiceCategory), id); await repository.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<ServicePlanListItemDto>> GetPlansAsync(ServicePlanQuery query, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection, PlanSortFields,
            message => new CatalogValidationException(message));
        var result = await repository.GetPlansAsync(query, ct);
        return new(result.Items.Select(MapList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<ServicePlanDetailDto?> GetPlanAsync(Guid id, CancellationToken ct) => (await repository.FindPlanAsync(id, ct)) is { } plan ? MapDetail(plan) : null;
    public async Task<ServicePlanDetailDto?> GetPlanBySlugAsync(string slug, CancellationToken ct) =>
        (await repository.FindPlanBySlugAsync(NormalizeSlug(slug), ct)) is { } plan ? MapDetail(plan) : null;

    public async Task<ServicePlanDetailDto> CreatePlanAsync(CreateServicePlanRequest request, Guid actorId, CancellationToken ct)
    {
        ValidatePlan(request.CategoryId, request.Name, request.Slug, request.Summary, request.Features);
        if (await repository.FindCategoryAsync(request.CategoryId, ct) is not { IsActive: true } category) throw new CatalogValidationException("An active service category is required.");
        var slug = NormalizeSlug(request.Slug); if (await repository.PlanSlugExistsAsync(slug, null, ct)) throw new CatalogConflictException("Service plan slug already exists.");
        var plan = new ServicePlan { CategoryId = request.CategoryId, Category = category, Name = request.Name.Trim(), Slug = slug, Summary = request.Summary.Trim(), IsFeatured = request.IsFeatured, IsActive = request.IsActive, CreatedBy = actorId };
        AddFeatures(plan, request.Features, actorId); repository.AddPlan(plan); repository.AddAudit(actorId, "Catalog.PlanCreated", nameof(ServicePlan), plan.Id); await repository.SaveChangesAsync(ct); return MapDetail(plan);
    }

    public async Task<ServicePlanDetailDto> UpdatePlanAsync(Guid id, UpdateServicePlanRequest request, Guid actorId, CancellationToken ct)
    {
        ValidatePlan(request.CategoryId, request.Name, request.Slug, request.Summary, request.Features);
        if (await repository.FindCategoryAsync(request.CategoryId, ct) is not { IsActive: true } category) throw new CatalogValidationException("An active service category is required.");
        var plan = await repository.FindPlanAsync(id, ct) ?? throw new CatalogNotFoundException("Service plan was not found."); var slug = NormalizeSlug(request.Slug);
        if (await repository.PlanSlugExistsAsync(slug, id, ct)) throw new CatalogConflictException("Service plan slug already exists.");
        plan.CategoryId = request.CategoryId; plan.Category = category; plan.Name = request.Name.Trim(); plan.Slug = slug; plan.Summary = request.Summary.Trim(); plan.IsFeatured = request.IsFeatured; plan.IsActive = request.IsActive; plan.UpdatedAt = DateTimeOffset.UtcNow; plan.UpdatedBy = actorId;
        ReplaceFeatures(repository, plan, request.Features, actorId); repository.AddAudit(actorId, "Catalog.PlanUpdated", nameof(ServicePlan), id); await repository.SaveChangesAsync(ct); return MapDetail(plan);
    }

    public async Task DeletePlanAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var plan = await repository.FindPlanAsync(id, ct) ?? throw new CatalogNotFoundException("Service plan was not found."); plan.IsDeleted = true; plan.DeletedAt = DateTimeOffset.UtcNow; plan.DeletedBy = actorId; repository.AddAudit(actorId, "Catalog.PlanDeleted", nameof(ServicePlan), id); await repository.SaveChangesAsync(ct);
    }

    public async Task<PlanPriceDto> CreatePriceAsync(Guid planId, CreatePlanPriceRequest request, Guid actorId, CancellationToken ct)
    {
        if (request.Amount < 0) throw new CatalogValidationException("Price amount cannot be negative."); if (request.EffectiveTo is not null && request.EffectiveTo <= request.EffectiveFrom) throw new CatalogValidationException("EffectiveTo must be after EffectiveFrom.");
        if (string.IsNullOrWhiteSpace(request.Currency) || request.Currency.Trim().Length != 3) throw new CatalogValidationException("Currency must be a three-letter code.");
        _ = await repository.FindPlanAsync(planId, ct) ?? throw new CatalogNotFoundException("Service plan was not found."); var prices = await repository.GetPricesForCycleAsync(planId, request.BillingCycle, ct);
        foreach (var price in prices.Where(x => x.IsActive))
        {
            if (price.EffectiveTo is null && price.EffectiveFrom <= request.EffectiveFrom) { price.EffectiveTo = request.EffectiveFrom; price.UpdatedAt = DateTimeOffset.UtcNow; price.UpdatedBy = actorId; continue; }
            var newEnd = request.EffectiveTo ?? DateTimeOffset.MaxValue; var existingEnd = price.EffectiveTo ?? DateTimeOffset.MaxValue;
            if (price.EffectiveFrom < newEnd && request.EffectiveFrom < existingEnd) throw new CatalogConflictException("Price effective period overlaps an existing price.");
        }
        var entity = new PlanPrice { ServicePlanId = planId, BillingCycle = request.BillingCycle, Amount = request.Amount, Currency = request.Currency.Trim().ToUpperInvariant(), EffectiveFrom = request.EffectiveFrom, EffectiveTo = request.EffectiveTo, IsActive = request.IsActive, CreatedBy = actorId };
        repository.AddPrice(entity); repository.AddAudit(actorId, "Catalog.PriceCreated", nameof(PlanPrice), entity.Id); await repository.SaveChangesAsync(ct); return Map(entity);
    }

    public async Task<PlanPriceDto> ClosePriceAsync(Guid priceId, ClosePlanPriceRequest request, Guid actorId, CancellationToken ct)
    {
        var price = await repository.FindPriceAsync(priceId, ct) ?? throw new CatalogNotFoundException("Plan price was not found."); if (request.EffectiveTo <= price.EffectiveFrom) throw new CatalogValidationException("EffectiveTo must be after EffectiveFrom.");
        price.EffectiveTo = request.EffectiveTo; price.UpdatedAt = DateTimeOffset.UtcNow; price.UpdatedBy = actorId; repository.AddAudit(actorId, "Catalog.PriceClosed", nameof(PlanPrice), priceId); await repository.SaveChangesAsync(ct); return Map(price);
    }

    public async Task<QrCodeDto> GenerateQrCodeAsync(Guid planId, string publicBaseUrl, Guid actorId, CancellationToken ct)
    {
        var plan = await repository.FindPlanAsync(planId, ct) ?? throw new CatalogNotFoundException("Service plan was not found.");
        var targetUrl = BuildPlanUrl(publicBaseUrl, plan.Slug);
        _ = RequireQrCodeService().GeneratePng(targetUrl);
        plan.QrCodePath = $"/api/v1/service-plans/{plan.Id}/qr-code/image";
        plan.UpdatedBy = actorId;
        repository.AddAudit(actorId, "Catalog.QrCodeRegenerated", nameof(ServicePlan), plan.Id);
        await repository.SaveChangesAsync(ct);
        return new(plan.QrCodePath, targetUrl);
    }

    public async Task<QrCodeImageDto> GetQrCodeImageAsync(Guid planId, string publicBaseUrl, CancellationToken ct)
    {
        var plan = await repository.FindPlanAsync(planId, ct) ?? throw new CatalogNotFoundException("Service plan was not found.");
        var content = RequireQrCodeService().GeneratePng(BuildPlanUrl(publicBaseUrl, plan.Slug));
        return new(content, "image/png");
    }

    private static void AddFeatures(ServicePlan plan, IReadOnlyList<ServicePlanFeatureRequest> features, Guid actorId) { foreach (var feature in features) plan.Features.Add(new ServicePlanFeature { FeatureKey = feature.FeatureKey.Trim().ToUpperInvariant(), DisplayName = feature.DisplayName.Trim(), Value = feature.Value.Trim(), Unit = CleanOptional(feature.Unit), DisplayOrder = feature.DisplayOrder, CreatedBy = actorId }); }
    private static void ReplaceFeatures(ICatalogRepository repository, ServicePlan plan, IReadOnlyList<ServicePlanFeatureRequest> requests, Guid actorId)
    {
        var existing = plan.Features.ToArray();
        var requested = requests.Select((feature, index) => new
        {
            Key = feature.FeatureKey.Trim().ToUpperInvariant(),
            feature.DisplayName,
            feature.Value,
            feature.Unit,
            DisplayOrder = index + 1
        }).ToArray();
        var requestedKeys = requested.Select(feature => feature.Key).ToHashSet(StringComparer.OrdinalIgnoreCase);

        foreach (var feature in existing.Where(feature => !requestedKeys.Contains(feature.FeatureKey)))
        {
            repository.RemovePlanFeature(feature);
            plan.Features.Remove(feature);
        }

        var existingByKey = existing.ToDictionary(feature => feature.FeatureKey, StringComparer.OrdinalIgnoreCase);
        foreach (var requestedFeature in requested)
        {
            if (existingByKey.TryGetValue(requestedFeature.Key, out var existingFeature) && plan.Features.Contains(existingFeature))
            {
                existingFeature.FeatureKey = requestedFeature.Key;
                existingFeature.DisplayName = requestedFeature.DisplayName.Trim();
                existingFeature.Value = requestedFeature.Value.Trim();
                existingFeature.Unit = CleanOptional(requestedFeature.Unit);
                existingFeature.DisplayOrder = requestedFeature.DisplayOrder;
                existingFeature.UpdatedBy = actorId;
                continue;
            }

            var newFeature = new ServicePlanFeature
            {
                ServicePlanId = plan.Id,
                ServicePlan = plan,
                FeatureKey = requestedFeature.Key,
                DisplayName = requestedFeature.DisplayName.Trim(),
                Value = requestedFeature.Value.Trim(),
                Unit = CleanOptional(requestedFeature.Unit),
                DisplayOrder = requestedFeature.DisplayOrder,
                CreatedBy = actorId
            };
            plan.Features.Add(newFeature);
            repository.AddPlanFeature(newFeature);
        }
    }
    private static void ValidateCategory(string name, string slug) { if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 120) throw new CatalogValidationException("Category name is required and must be 120 characters or fewer."); ValidateSlug(slug, 140); }
    private static void ValidatePlan(Guid categoryId, string name, string slug, string summary, IReadOnlyList<ServicePlanFeatureRequest> features) { if (categoryId == Guid.Empty) throw new CatalogValidationException("Category is required."); if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 160) throw new CatalogValidationException("Plan name is required and must be 160 characters or fewer."); ValidateSlug(slug, 180); if (string.IsNullOrWhiteSpace(summary) || summary.Trim().Length > 500) throw new CatalogValidationException("Plan summary is required and must be 500 characters or fewer."); if (features.GroupBy(x => x.FeatureKey.Trim(), StringComparer.OrdinalIgnoreCase).Any(x => x.Count() > 1) || features.Any(x => string.IsNullOrWhiteSpace(x.FeatureKey) || x.FeatureKey.Trim().Length > 60 || string.IsNullOrWhiteSpace(x.DisplayName) || x.DisplayName.Trim().Length > 120 || string.IsNullOrWhiteSpace(x.Value) || x.Value.Trim().Length > 160 || x.Unit?.Length > 30)) throw new CatalogValidationException("Plan features are invalid or duplicate."); }
    private static void ValidateSlug(string slug, int maxLength) { if (string.IsNullOrWhiteSpace(slug) || slug.Trim().Length > maxLength || !System.Text.RegularExpressions.Regex.IsMatch(slug.Trim(), "^[a-z0-9]+(?:-[a-z0-9]+)*$")) throw new CatalogValidationException("Slug must contain lowercase letters, numbers, and hyphens only."); }
    private static void ValidatePage(int page, int pageSize) { if (page < 1 || pageSize is < 1 or > 100) throw new CatalogValidationException("Page must be at least 1 and PageSize must be from 1 to 100."); }
    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant(); private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static ServiceCategoryDto Map(ServiceCategory x) => new(x.Id, x.Name, x.Slug, x.Description, x.DisplayOrder, x.IsActive);
    private static ServicePlanFeatureDto Map(ServicePlanFeature x) => new(x.Id, x.FeatureKey, x.DisplayName, x.Value, x.Unit, x.DisplayOrder);
    private static PlanPriceDto Map(PlanPrice x) => new(x.Id, x.ServicePlanId, x.BillingCycle, x.Amount, x.Currency, x.EffectiveFrom, x.EffectiveTo, x.IsActive);
    private ServicePlanListItemDto MapList(ServicePlan x)
    {
        var now = DateTimeOffset.UtcNow;
        var price = x.Prices.Where(p => p.IsActive && p.BillingCycle == Domain.Enums.BillingCycle.Monthly && p.EffectiveFrom <= now && (p.EffectiveTo == null || p.EffectiveTo > now)).OrderByDescending(p => p.EffectiveFrom).FirstOrDefault();
        var promotion = GetBestPromotion(x, price?.Amount, now, Domain.Enums.BillingCycle.Monthly);
        return new(x.Id, x.CategoryId, x.Category.Name, x.Name, x.Slug, x.Summary, x.IsFeatured, x.IsActive, price?.Amount, promotion?.Price, price?.Currency ?? "VND", promotion?.Dto, x.QrCodePath);
    }

    private ServicePlanDetailDto MapDetail(ServicePlan x)
    {
        var now = DateTimeOffset.UtcNow;
        return new(x.Id, x.CategoryId, x.Category.Name, x.Name, x.Slug, x.Summary, x.IsFeatured, x.IsActive, x.QrCodePath, x.Features.OrderBy(f => f.DisplayOrder).Select(Map).ToArray(), x.Prices.OrderByDescending(p => p.EffectiveFrom).Select(Map).ToArray(), GetActivePromotions(x, now).Select(MapPromotion).ToArray());
    }

    private (decimal Price, ActivePromotionDto Dto)? GetBestPromotion(ServicePlan plan, decimal? originalAmount, DateTimeOffset now, Domain.Enums.BillingCycle billingCycle)
    {
        if (originalAmount is null) return null;
        return GetActivePromotions(plan, now, billingCycle)
            .Select(p => (Price: discountStrategyFactory.Get(p.DiscountType).Apply(originalAmount.Value, p.DiscountValue), Dto: MapPromotion(p)))
            .OrderBy(x => x.Price)
            .Cast<(decimal Price, ActivePromotionDto Dto)?>()
            .FirstOrDefault();
    }

    private static IEnumerable<Promotion> GetActivePromotions(ServicePlan plan, DateTimeOffset now, Domain.Enums.BillingCycle? billingCycle = null) =>
        plan.PromotionPlans
            .Select(x => x.Promotion)
            .Where(x => x.IsActive && x.StartsAt <= now && x.EndsAt > now)
            .Where(x => billingCycle is null || PromotionApplicability.AppliesToCycle(x, billingCycle.Value));

    private static ActivePromotionDto MapPromotion(Promotion x) => new(x.Id, x.Code, x.Name, x.DiscountType, x.DiscountValue, x.BillingCycle);
    private static string BuildPlanUrl(string publicBaseUrl, string slug) => $"{publicBaseUrl.TrimEnd('/')}/services/{slug}";
    private IQrCodeService RequireQrCodeService() => qrCodeService ?? throw new InvalidOperationException("QR code service is not configured.");
}
