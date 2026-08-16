using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class PromotionRepository(CloudServiceStoreDbContext dbContext) : IPromotionRepository
{
    public async Task<(IReadOnlyList<Promotion> Items, int Total)> GetPromotionsAsync(PromotionQuery query, CancellationToken ct)
    {
        IQueryable<Promotion> source = dbContext.Promotions.AsNoTracking().Include(x => x.PromotionPlans);
        if (query.IsActive is not null) source = source.Where(x => x.IsActive == query.IsActive);
        if (query.ServicePlanId is not null) source = source.Where(x => x.PromotionPlans.Any(item => item.ServicePlanId == query.ServicePlanId));
        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "code" => descending
                ? source.OrderByDescending(x => x.Code).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Code).ThenBy(x => x.Id),
            "name" => descending
                ? source.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Name).ThenBy(x => x.Id),
            "endsat" => descending
                ? source.OrderByDescending(x => x.EndsAt).ThenBy(x => x.Code).ThenBy(x => x.Id)
                : source.OrderBy(x => x.EndsAt).ThenBy(x => x.Code).ThenBy(x => x.Id),
            "startsat" => descending
                ? source.OrderByDescending(x => x.StartsAt).ThenBy(x => x.Code).ThenBy(x => x.Id)
                : source.OrderBy(x => x.StartsAt).ThenBy(x => x.Code).ThenBy(x => x.Id),
            _ => source.OrderByDescending(x => x.StartsAt).ThenBy(x => x.Code).ThenBy(x => x.Id)
        };
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }

    public Task<Promotion?> FindPromotionAsync(Guid id, CancellationToken ct) =>
        dbContext.Promotions.Include(x => x.PromotionPlans).FirstOrDefaultAsync(x => x.Id == id, ct);

    public async Task<IReadOnlyList<Promotion>> GetPublicBannerPromotionsAsync(Guid? excludedId, CancellationToken ct) =>
        await dbContext.Promotions
            .Where(x => x.ShowOnPublicBanner && (!excludedId.HasValue || x.Id != excludedId.Value))
            .ToListAsync(ct);

    public Task<bool> CodeExistsAsync(string code, Guid? excludedId, CancellationToken ct) =>
        dbContext.Promotions.AnyAsync(x => x.Code == code && (!excludedId.HasValue || x.Id != excludedId), ct);

    public async Task<IReadOnlyList<Guid>> GetExistingPlanIdsAsync(IReadOnlyCollection<Guid> planIds, CancellationToken ct) =>
        await dbContext.ServicePlans.Where(x => planIds.Contains(x.Id)).Select(x => x.Id).ToListAsync(ct);

    public void SyncPromotionPlans(Promotion promotion, IReadOnlyCollection<Guid> planIds, Guid actorId)
    {
        var desiredPlanIds = planIds.Distinct().ToHashSet();
        var existingLinks = promotion.PromotionPlans.ToArray();

        foreach (var link in existingLinks.Where(x => !desiredPlanIds.Contains(x.ServicePlanId)))
        {
            promotion.PromotionPlans.Remove(link);
            dbContext.PromotionPlans.Remove(link);
        }

        var existingPlanIds = existingLinks.Select(x => x.ServicePlanId).ToHashSet();
        foreach (var planId in desiredPlanIds.Except(existingPlanIds))
        {
            var link = new PromotionPlan
            {
                PromotionId = promotion.Id,
                ServicePlanId = planId,
                CreatedBy = actorId
            };
            dbContext.PromotionPlans.Add(link);
            promotion.PromotionPlans.Add(link);
        }
    }

    public void Add(Promotion promotion) => dbContext.Promotions.Add(promotion);
    public void AddAudit(Guid actorId, string action, string entityName, Guid entityId) =>
        dbContext.AuditLogs.Add(new AuditLog { AppUserId = actorId, Action = action, EntityName = entityName, EntityId = entityId, OccurredAt = DateTimeOffset.UtcNow });
    public Task SaveChangesAsync(CancellationToken ct) => dbContext.SaveChangesAsync(ct);
}
