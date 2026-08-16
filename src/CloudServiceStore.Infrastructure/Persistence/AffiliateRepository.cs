using CloudServiceStore.Application.Affiliates;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class AffiliateRepository(CloudServiceStoreDbContext dbContext) : IAffiliateRepository
{
    public Task<AffiliateProgramContent?> FindProgramContentAsync(CancellationToken ct) =>
        dbContext.AffiliateProgramContents.FirstOrDefaultAsync(ct);

    public Task<bool> HasRecentApplicationAsync(string email, DateTimeOffset createdAfter, CancellationToken ct) =>
        dbContext.AffiliateApplications.AnyAsync(x => x.Email == email && x.CreatedAt >= createdAfter, ct);

    public async Task<(IReadOnlyList<AffiliateApplication> Items, int Total)> GetApplicationsAsync(AffiliateApplicationQuery query, CancellationToken ct)
    {
        IQueryable<AffiliateApplication> source = dbContext.AffiliateApplications.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            source = source.Where(x =>
                x.FullName.Contains(search)
                || x.Email.Contains(search)
                || x.PhoneNumber.Contains(search)
                || (x.CompanyName != null && x.CompanyName.Contains(search))
                || x.PromotionChannels.Contains(search));
        }
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status);
        if (query.CreatedFrom is not null) source = source.Where(x => x.CreatedAt >= query.CreatedFrom);
        if (query.CreatedTo is not null) source = source.Where(x => x.CreatedAt <= query.CreatedTo);
        var total = await source.CountAsync(ct);
        var items = await source.OrderByDescending(x => x.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<AffiliateApplication> Items, int Total)> GetApplicationsForCustomerAsync(Guid userId, CustomerAffiliateQuery query, CancellationToken ct)
    {
        IQueryable<AffiliateApplication> source = dbContext.AffiliateApplications
            .AsNoTracking()
            .Where(x => x.AppUserId == userId);
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status);

        var total = await source.CountAsync(ct);
        var items = await source.OrderByDescending(x => x.CreatedAt)
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public Task<AffiliateApplication?> FindApplicationAsync(Guid id, CancellationToken ct) =>
        dbContext.AffiliateApplications.Include(x => x.StatusHistory).FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<AffiliateApplication?> FindApplicationForCustomerAsync(Guid id, Guid userId, CancellationToken ct) =>
        dbContext.AffiliateApplications
            .AsNoTracking()
            .Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == id && x.AppUserId == userId, ct);

    public void AddApplication(AffiliateApplication application) => dbContext.AffiliateApplications.Add(application);
    public void AddStatusHistory(AffiliateApplicationStatusHistory history) => dbContext.AffiliateApplicationStatusHistories.Add(history);

    public void AddAudit(Guid? actorId, string action, string entityName, Guid entityId, string? oldValuesJson, string? newValuesJson, string? ipAddress) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            AppUserId = actorId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValuesJson = oldValuesJson,
            NewValuesJson = newValuesJson,
            IpAddress = ipAddress,
            OccurredAt = DateTimeOffset.UtcNow,
            CreatedBy = actorId
        });

    public Task SaveChangesAsync(CancellationToken ct) => dbContext.SaveChangesAsync(ct);
}
