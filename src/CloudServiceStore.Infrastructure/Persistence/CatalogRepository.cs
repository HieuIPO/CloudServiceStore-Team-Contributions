using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class CatalogRepository(CloudServiceStoreDbContext dbContext) : ICatalogRepository
{
    public async Task<(IReadOnlyList<ServiceCategory> Items, int Total)> GetCategoriesAsync(ServiceCategoryQuery query, CancellationToken ct)
    {
        IQueryable<ServiceCategory> source = dbContext.ServiceCategories.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search)) { var search = query.Search.Trim(); source = source.Where(x => x.Name.Contains(search) || x.Slug.Contains(search)); }
        if (query.IsActive is not null) source = source.Where(x => x.IsActive == query.IsActive);
        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "name" => descending
                ? source.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Name).ThenBy(x => x.Id),
            "createdat" => descending
                ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            "displayorder" => descending
                ? source.OrderByDescending(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id),
            _ => source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id)
        };
        var items = await ordered.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }
    public Task<ServiceCategory?> FindCategoryAsync(Guid id, CancellationToken ct) => dbContext.ServiceCategories.FirstOrDefaultAsync(x => x.Id == id, ct);
    public Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedId, CancellationToken ct) => dbContext.ServiceCategories.AnyAsync(x => x.Slug == slug && (!excludedId.HasValue || x.Id != excludedId), ct);
    public Task<bool> CategoryHasPlansAsync(Guid categoryId, CancellationToken ct) => dbContext.ServicePlans.AnyAsync(x => x.CategoryId == categoryId, ct);
    public async Task<(IReadOnlyList<ServicePlan> Items, int Total)> GetPlansAsync(ServicePlanQuery query, CancellationToken ct)
    {
        IQueryable<ServicePlan> source = dbContext.ServicePlans.AsNoTracking().AsSplitQuery().Include(x => x.Category).Include(x => x.Prices).Include(x => x.PromotionPlans).ThenInclude(x => x.Promotion);
        if (!string.IsNullOrWhiteSpace(query.Search)) { var search = query.Search.Trim(); source = source.Where(x => x.Name.Contains(search) || x.Slug.Contains(search)); }
        if (query.CategoryId is not null) source = source.Where(x => x.CategoryId == query.CategoryId);
        if (!query.IncludeInactive && query.IsActive is not null) source = source.Where(x => x.IsActive == query.IsActive);
        if (query.IsFeatured is not null) source = source.Where(x => x.IsFeatured == query.IsFeatured);
        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "name" => descending
                ? source.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Name).ThenBy(x => x.Id),
            "isfeatured" => descending
                ? source.OrderByDescending(x => x.IsFeatured).ThenBy(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.IsFeatured).ThenBy(x => x.Name).ThenBy(x => x.Id),
            "createdat" => descending
                ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            _ => source.OrderByDescending(x => x.IsFeatured).ThenBy(x => x.Name).ThenBy(x => x.Id)
        };
        var items = await ordered.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }
    public Task<ServicePlan?> FindPlanAsync(Guid id, CancellationToken ct) => PlanDetails().FirstOrDefaultAsync(x => x.Id == id, ct);
    public Task<ServicePlan?> FindPlanBySlugAsync(string slug, CancellationToken ct) => PlanDetails().AsNoTracking().FirstOrDefaultAsync(x => x.Slug == slug, ct);
    public Task<bool> PlanSlugExistsAsync(string slug, Guid? excludedId, CancellationToken ct) => dbContext.ServicePlans.AnyAsync(x => x.Slug == slug && (!excludedId.HasValue || x.Id != excludedId), ct);
    public Task<PlanPrice?> FindPriceAsync(Guid id, CancellationToken ct) => dbContext.PlanPrices.FirstOrDefaultAsync(x => x.Id == id, ct);
    public async Task<IReadOnlyList<PlanPrice>> GetPricesForCycleAsync(Guid planId, BillingCycle cycle, CancellationToken ct) => await dbContext.PlanPrices.Where(x => x.ServicePlanId == planId && x.BillingCycle == cycle).ToListAsync(ct);
    public void AddCategory(ServiceCategory category) => dbContext.ServiceCategories.Add(category);
    public void AddPlan(ServicePlan plan) => dbContext.ServicePlans.Add(plan);
    public void AddPlanFeature(ServicePlanFeature feature) => dbContext.ServicePlanFeatures.Add(feature);
    public void RemovePlanFeature(ServicePlanFeature feature) => dbContext.ServicePlanFeatures.Remove(feature);
    public void AddPrice(PlanPrice price) => dbContext.PlanPrices.Add(price);
    public void AddAudit(Guid actorId, string action, string entityName, Guid entityId) => dbContext.AuditLogs.Add(new AuditLog { AppUserId = actorId, Action = action, EntityName = entityName, EntityId = entityId, OccurredAt = DateTimeOffset.UtcNow });
    public Task SaveChangesAsync(CancellationToken ct) => dbContext.SaveChangesAsync(ct);

    private IQueryable<ServicePlan> PlanDetails() => dbContext.ServicePlans.AsSplitQuery()
        .Include(x => x.Category)
        .Include(x => x.Features)
        .Include(x => x.Prices)
        .Include(x => x.PromotionPlans)
        .ThenInclude(x => x.Promotion);
}
