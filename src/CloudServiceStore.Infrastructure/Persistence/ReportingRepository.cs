using System.Text.Json;
using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class ReportingRepository(CloudServiceStoreDbContext dbContext) : IReportingRepository
{
    public async Task<OrderSummaryDto> GetOrderSummaryAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        var period = dbContext.OrderRequests.AsNoTracking().Where(x => x.CreatedAt >= from && x.CreatedAt <= to);
        var totalOrders = await dbContext.OrderRequests.CountAsync(ct);
        var periodOrders = await period.CountAsync(ct);
        var pending = await dbContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Pending, ct);
        var approved = await dbContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Approved, ct);
        var approvedAmount = await dbContext.OrderRequests
            .Where(x => x.Status == OrderRequestStatus.Approved)
            .SumAsync(x => (decimal?)x.QuotedAmount, ct) ?? 0;
        var affiliateTotal = await dbContext.AffiliateApplications.CountAsync(ct);
        var affiliatePending = await dbContext.AffiliateApplications.CountAsync(x => x.Status == AffiliateApplicationStatus.Pending, ct);
        var publishedNews = await dbContext.NewsArticles.CountAsync(x => x.Status == NewsArticleStatus.Published, ct);
        var statuses = await period.GroupBy(x => x.Status)
            .Select(group => new { Status = group.Key, Count = group.Count() })
            .OrderBy(x => x.Status)
            .ToListAsync(ct);
        var monthlyRows = await period.Select(x => new { x.CreatedAt, x.QuotedAmount, x.Status }).ToListAsync(ct);
        var monthly = monthlyRows.GroupBy(x => new { x.CreatedAt.Year, x.CreatedAt.Month })
            .Select(group => new MonthlyOrderDto(
                group.Key.Year,
                group.Key.Month,
                group.Count(),
                group.Sum(x => x.QuotedAmount),
                group.Count(x => x.Status == OrderRequestStatus.Approved)))
            .OrderBy(x => x.Year).ThenBy(x => x.Month).ToArray();
        return new(from, to, totalOrders, periodOrders, pending, approved, approvedAmount, affiliateTotal,
            affiliatePending, publishedNews, statuses.Select(x => new NamedCountDto(x.Status.ToString(), x.Count)).ToArray(), monthly);
    }

    public async Task<IReadOnlyList<PopularPlanDto>> GetPopularPlansAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        var rows = await dbContext.OrderRequests.AsNoTracking()
            .Where(x => x.CreatedAt >= from && x.CreatedAt <= to)
            .GroupBy(x => x.PlanNameSnapshot)
            .Select(group => new { PlanName = group.Key, OrderCount = group.Count(), QuotedAmount = group.Sum(x => x.QuotedAmount) })
            .OrderByDescending(x => x.OrderCount).ThenBy(x => x.PlanName)
            .Take(8).ToListAsync(ct);
        return rows.Select(x => new PopularPlanDto(x.PlanName, x.OrderCount, x.QuotedAmount)).ToArray();
    }

    public async Task<IReadOnlyList<ServiceInterestDto>> GetServiceInterestAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken ct)
    {
        var rows = await dbContext.OrderRequests.AsNoTracking()
            .Where(x => x.CreatedAt >= from && x.CreatedAt <= to)
            .GroupBy(x => x.ServicePlan.Category.Name)
            .Select(group => new { ServiceName = group.Key, OrderCount = group.Count() })
            .OrderByDescending(x => x.OrderCount).ThenBy(x => x.ServiceName)
            .ToListAsync(ct);
        return rows.Select(x => new ServiceInterestDto(x.ServiceName, x.OrderCount)).ToArray();
    }

    public async Task<(IReadOnlyList<AuditLogDto> Items, int Total)> GetAuditLogsAsync(AuditLogQuery query, CancellationToken ct)
    {
        var source =
            from log in dbContext.AuditLogs.AsNoTracking()
            join user in dbContext.AppUsers.AsNoTracking() on log.AppUserId equals user.Id into users
            from user in users.DefaultIfEmpty()
            select new { Log = log, ActorEmail = user == null ? null : user.Email };
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var value = query.Search.Trim();
            source = source.Where(x => x.Log.Action.Contains(value) || x.Log.EntityName.Contains(value)
                || (x.ActorEmail != null && x.ActorEmail.Contains(value)));
        }
        if (!string.IsNullOrWhiteSpace(query.Action)) source = source.Where(x => x.Log.Action == query.Action.Trim());
        if (!string.IsNullOrWhiteSpace(query.EntityName)) source = source.Where(x => x.Log.EntityName == query.EntityName.Trim());
        if (query.From is not null) source = source.Where(x => x.Log.OccurredAt >= query.From);
        if (query.To is not null) source = source.Where(x => x.Log.OccurredAt <= query.To);
        var total = await source.CountAsync(ct);
        var items = await source.OrderByDescending(x => x.Log.OccurredAt)
            .Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .Select(x => new AuditLogDto(x.Log.Id, x.Log.AppUserId, x.ActorEmail, x.Log.Action, x.Log.EntityName,
                x.Log.EntityId, x.Log.OldValuesJson, x.Log.NewValuesJson, x.Log.IpAddress, x.Log.OccurredAt))
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<IReadOnlyList<OrderExportRow>> GetOrderExportRowsAsync(OrderExportQuery query, CancellationToken ct)
    {
        var source = dbContext.OrderRequests.AsNoTracking();
        if (query.From is not null) source = source.Where(x => x.CreatedAt >= query.From);
        if (query.To is not null) source = source.Where(x => x.CreatedAt <= query.To);
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status);
        return await source.OrderByDescending(x => x.CreatedAt)
            .Select(x => new OrderExportRow(x.Id, x.CreatedAt, x.CustomerName, x.Email, x.PhoneNumber, x.CompanyName,
                x.PlanNameSnapshot, x.BillingCycle, x.OriginalAmount, x.QuotedAmount, x.Currency,
                x.PromotionCodeSnapshot, x.Status, x.Note))
            .ToListAsync(ct);
    }

    public void AddExportAudit(Guid actorId, int rowCount, string? ipAddress) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            AppUserId = actorId,
            Action = "Orders.Exported",
            EntityName = nameof(OrderRequest),
            NewValuesJson = JsonSerializer.Serialize(new { RowCount = rowCount }),
            IpAddress = ipAddress,
            OccurredAt = DateTimeOffset.UtcNow,
            CreatedBy = actorId
        });

    public Task SaveChangesAsync(CancellationToken ct) => dbContext.SaveChangesAsync(ct);
}
