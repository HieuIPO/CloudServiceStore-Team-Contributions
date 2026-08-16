using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class OrderRepository(CloudServiceStoreDbContext dbContext) : IOrderRepository
{
    public Task<ServicePlan?> FindPlanForOrderAsync(Guid planId, CancellationToken ct) =>
        dbContext.ServicePlans
            .AsSplitQuery()
            .Include(x => x.Features)
            .Include(x => x.Prices)
            .Include(x => x.PromotionPlans)
            .ThenInclude(x => x.Promotion)
            .FirstOrDefaultAsync(x => x.Id == planId, ct);

    public Task<bool> HasRecentDuplicateAsync(string email, string phoneNumber, Guid planId, DateTimeOffset createdAfter, CancellationToken ct) =>
        dbContext.OrderRequests.AnyAsync(x =>
            x.ServicePlanId == planId
            && x.Email == email
            && x.PhoneNumber == phoneNumber
            && x.CreatedAt >= createdAfter, ct);

    public async Task<(IReadOnlyList<OrderRequest> Items, int Total)> GetAsync(OrderRequestQuery query, CancellationToken ct)
    {
        IQueryable<OrderRequest> source = dbContext.OrderRequests.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            source = source.Where(x =>
                x.CustomerName.Contains(search)
                || x.Email.Contains(search)
                || x.PhoneNumber.Contains(search)
                || (x.CompanyName != null && x.CompanyName.Contains(search))
                || x.PlanNameSnapshot.Contains(search));
        }
        if (query.ServicePlanId is not null) source = source.Where(x => x.ServicePlanId == query.ServicePlanId);
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status);
        if (query.CreatedFrom is not null) source = source.Where(x => x.CreatedAt >= query.CreatedFrom);
        if (query.CreatedTo is not null) source = source.Where(x => x.CreatedAt <= query.CreatedTo);

        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "customername" => descending
                ? source.OrderByDescending(x => x.CustomerName).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CustomerName).ThenBy(x => x.Id),
            "quotedamount" => descending
                ? source.OrderByDescending(x => x.QuotedAmount).ThenBy(x => x.Id)
                : source.OrderBy(x => x.QuotedAmount).ThenBy(x => x.Id),
            "status" => descending
                ? source.OrderByDescending(x => x.Status).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Status).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id),
            "createdat" => descending
                ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            _ => source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
        };
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<(IReadOnlyList<OrderRequest> Items, int Total)> GetForCustomerAsync(Guid userId, CustomerOrderQuery query, CancellationToken ct)
    {
        IQueryable<OrderRequest> source = dbContext.OrderRequests
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

    public Task<OrderRequest?> FindAsync(Guid id, CancellationToken ct) =>
        dbContext.OrderRequests
            .Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<OrderRequest?> FindForCustomerAsync(Guid id, Guid userId, CancellationToken ct) =>
        dbContext.OrderRequests
            .Include(x => x.StatusHistory)
            .FirstOrDefaultAsync(x => x.Id == id && x.AppUserId == userId, ct);

    public void Add(OrderRequest orderRequest) => dbContext.OrderRequests.Add(orderRequest);
    public void AddStatusHistory(OrderRequestStatusHistory history) => dbContext.OrderRequestStatusHistories.Add(history);

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
