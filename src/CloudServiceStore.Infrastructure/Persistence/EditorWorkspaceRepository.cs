using CloudServiceStore.Application.EditorWorkspace;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class EditorWorkspaceRepository(CloudServiceStoreDbContext dbContext) : IEditorWorkspaceRepository
{
    public async Task<EditorWorkspaceSummaryDto> GetSummaryAsync(DateTimeOffset now, CancellationToken ct)
    {
        var twentyFourHoursAgo = now.AddHours(-24);

        var newOrders = await dbContext.OrderRequests.AsNoTracking()
            .CountAsync(x => x.Status == OrderRequestStatus.Pending, ct);

        var newOrders24h = await dbContext.OrderRequests.AsNoTracking()
            .CountAsync(x => x.Status == OrderRequestStatus.Pending && x.CreatedAt >= twentyFourHoursAgo, ct);

        var inProgressOrders = await dbContext.OrderRequests.AsNoTracking()
            .CountAsync(x => x.Status == OrderRequestStatus.Contacted, ct);

        var overdueActiveOrders = await dbContext.OrderRequests.AsNoTracking()
            .CountAsync(x => (x.Status == OrderRequestStatus.Pending || x.Status == OrderRequestStatus.Contacted)
                && (x.UpdatedAt ?? x.CreatedAt) < twentyFourHoursAgo, ct);

        var pendingAffiliates = await dbContext.AffiliateApplications.AsNoTracking()
            .CountAsync(x => x.Status == AffiliateApplicationStatus.Pending, ct);

        var newAffiliates24h = await dbContext.AffiliateApplications.AsNoTracking()
            .CountAsync(x => x.Status == AffiliateApplicationStatus.Pending && x.CreatedAt >= twentyFourHoursAgo, ct);

        var draftArticles = await dbContext.NewsArticles.AsNoTracking()
            .CountAsync(x => x.Status == NewsArticleStatus.Draft, ct);

        var draftsUpdated24h = await dbContext.NewsArticles.AsNoTracking()
            .CountAsync(x => x.Status == NewsArticleStatus.Draft && (x.UpdatedAt ?? x.CreatedAt) >= twentyFourHoursAgo, ct);

        return new EditorWorkspaceSummaryDto(
            newOrders,
            newOrders24h,
            inProgressOrders,
            overdueActiveOrders,
            pendingAffiliates,
            newAffiliates24h,
            draftArticles,
            draftsUpdated24h);
    }

    public async Task<(IReadOnlyList<EditorWorkspaceQueueItemDto> Items, int Total)> GetQueueAsync(EditorWorkspaceQuery query, CancellationToken ct)
    {
        var normalizedType = query.NormalizedType;
        var normalizedStatus = query.NormalizedStatus;
        var normalizedSort = query.NormalizedSort;
        var search = query.NormalizedSearch;

        var page = Math.Max(1, query.SafePage);
        var pageSize = Math.Clamp(query.SafePageSize, 1, 100);

        var includeOrders = normalizedType is "all" or "order";
        var includeAffiliates = normalizedType is "all" or "affiliate";

        IQueryable<OrderRequest>? ordersQuery = null;
        IQueryable<AffiliateApplication>? affiliatesQuery = null;
        IQueryable<RawQueueItem>? ordersProj = null;
        IQueryable<RawQueueItem>? affiliatesProj = null;

        if (includeOrders)
        {
            var q = dbContext.OrderRequests.AsNoTracking();

            if (normalizedStatus != "all")
            {
                var targetStatus = normalizedStatus switch
                {
                    "new" => OrderRequestStatus.Pending,
                    "inProgress" => OrderRequestStatus.Contacted,
                    "completed" => OrderRequestStatus.Approved,
                    "rejected" => OrderRequestStatus.Rejected,
                    "cancelled" => OrderRequestStatus.Cancelled,
                    _ => (OrderRequestStatus?)null
                };

                if (targetStatus.HasValue)
                {
                    q = q.Where(x => x.Status == targetStatus.Value);
                }
                else
                {
                    q = q.Where(x => false);
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                q = q.Where(x => x.CustomerName.Contains(search) ||
                                 x.Email.Contains(search) ||
                                 x.PhoneNumber.Contains(search) ||
                                 (x.CompanyName != null && x.CompanyName.Contains(search)) ||
                                 x.PlanNameSnapshot.Contains(search));
            }

            ordersQuery = q;
            ordersProj = q.Select(x => new RawQueueItem(
                x.Id,
                "order",
                x.CustomerName,
                x.Email,
                x.PhoneNumber,
                x.CompanyName,
                x.PlanNameSnapshot,
                (int)x.Status,
                x.CreatedAt,
                x.UpdatedAt,
                x.UpdatedAt ?? x.CreatedAt
            ));
        }

        if (includeAffiliates)
        {
            var q = dbContext.AffiliateApplications.AsNoTracking();

            if (normalizedStatus != "all")
            {
                var targetStatus = normalizedStatus switch
                {
                    "new" => AffiliateApplicationStatus.Pending,
                    "inProgress" => AffiliateApplicationStatus.UnderReview,
                    "completed" => AffiliateApplicationStatus.Approved,
                    "rejected" => AffiliateApplicationStatus.Rejected,
                    _ => (AffiliateApplicationStatus?)null
                };

                if (targetStatus.HasValue)
                {
                    q = q.Where(x => x.Status == targetStatus.Value);
                }
                else
                {
                    q = q.Where(x => false);
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                q = q.Where(x => x.FullName.Contains(search) ||
                                 x.Email.Contains(search) ||
                                 x.PhoneNumber.Contains(search) ||
                                 (x.CompanyName != null && x.CompanyName.Contains(search)) ||
                                 "Hồ sơ Đăng ký Affiliate".Contains(search));
            }

            affiliatesQuery = q;
            affiliatesProj = q.Select(x => new RawQueueItem(
                x.Id,
                "affiliate",
                x.FullName,
                x.Email,
                x.PhoneNumber,
                x.CompanyName,
                "Hồ sơ Đăng ký Affiliate",
                (int)x.Status,
                x.CreatedAt,
                x.UpdatedAt,
                x.UpdatedAt ?? x.CreatedAt
            ));
        }

        if (ordersProj == null && affiliatesProj == null)
        {
            return (Array.Empty<EditorWorkspaceQueueItemDto>(), 0);
        }

        int total;
        List<RawQueueItem> rawPaged;

        if (dbContext.Database.IsRelational())
        {
            long skipCount = (long)(page - 1) * pageSize;
            int safeSkip = (int)Math.Min(skipCount, int.MaxValue - pageSize);
            int sourceTake = safeSkip + pageSize;

            var orderTotal = ordersQuery is null ? 0 : await ordersQuery.CountAsync(ct);
            var affiliateTotal = affiliatesQuery is null ? 0 : await affiliatesQuery.CountAsync(ct);
            total = orderTotal + affiliateTotal;

            var orderRows = new List<RawQueueItem>();
            if (ordersQuery is not null)
            {
                var sortedOrders = normalizedSort == "oldest"
                    ? ordersQuery.OrderBy(x => x.UpdatedAt ?? x.CreatedAt).ThenBy(x => x.Id)
                    : ordersQuery.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ThenByDescending(x => x.Id);

                orderRows = await sortedOrders
                    .Take(sourceTake)
                    .Select(x => new RawQueueItem(
                        x.Id,
                        "order",
                        x.CustomerName,
                        x.Email,
                        x.PhoneNumber,
                        x.CompanyName,
                        x.PlanNameSnapshot,
                        (int)x.Status,
                        x.CreatedAt,
                        x.UpdatedAt,
                        x.UpdatedAt ?? x.CreatedAt))
                    .ToListAsync(ct);
            }

            var affiliateRows = new List<RawQueueItem>();
            if (affiliatesQuery is not null)
            {
                var sortedAffiliates = normalizedSort == "oldest"
                    ? affiliatesQuery.OrderBy(x => x.UpdatedAt ?? x.CreatedAt).ThenBy(x => x.Id)
                    : affiliatesQuery.OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt).ThenByDescending(x => x.Id);

                affiliateRows = await sortedAffiliates
                    .Take(sourceTake)
                    .Select(x => new RawQueueItem(
                        x.Id,
                        "affiliate",
                        x.FullName,
                        x.Email,
                        x.PhoneNumber,
                        x.CompanyName,
                        "Hồ sơ Đăng ký Affiliate",
                        (int)x.Status,
                        x.CreatedAt,
                        x.UpdatedAt,
                        x.UpdatedAt ?? x.CreatedAt))
                    .ToListAsync(ct);
            }

            var combinedRows = orderRows.Concat(affiliateRows);
            var sortedRows = normalizedSort == "oldest"
                ? combinedRows.OrderBy(x => x.LastActivityAt).ThenBy(x => x.Id)
                : combinedRows.OrderByDescending(x => x.LastActivityAt).ThenByDescending(x => x.Id);

            rawPaged = sortedRows
                .Skip(safeSkip)
                .Take(pageSize)
                .ToList();
        }
        else
        {
            List<RawQueueItem> allItems = new();
            if (ordersProj != null)
            {
                allItems.AddRange(await ordersProj.ToListAsync(ct));
            }
            if (affiliatesProj != null)
            {
                allItems.AddRange(await affiliatesProj.ToListAsync(ct));
            }

            total = allItems.Count;

            long skipCount = (long)(page - 1) * pageSize;
            int safeSkip = (int)Math.Min(skipCount, int.MaxValue - pageSize);

            IEnumerable<RawQueueItem> sorted = normalizedSort == "oldest"
                ? allItems.OrderBy(x => x.LastActivityAt).ThenBy(x => x.Id)
                : allItems.OrderByDescending(x => x.LastActivityAt).ThenByDescending(x => x.Id);

            rawPaged = sorted.Skip(safeSkip).Take(pageSize).ToList();
        }

        var resultItems = rawPaged.Select(x =>
        {
            string sourceStatus;
            string statusGroup;

            if (x.Type == "order")
            {
                var st = (OrderRequestStatus)x.StatusValue;
                sourceStatus = st.ToString();
                statusGroup = st switch
                {
                    OrderRequestStatus.Pending => "new",
                    OrderRequestStatus.Contacted => "inProgress",
                    OrderRequestStatus.Approved => "completed",
                    OrderRequestStatus.Rejected => "rejected",
                    OrderRequestStatus.Cancelled => "cancelled",
                    _ => "new"
                };
            }
            else
            {
                var st = (AffiliateApplicationStatus)x.StatusValue;
                sourceStatus = st.ToString();
                statusGroup = st switch
                {
                    AffiliateApplicationStatus.Pending => "new",
                    AffiliateApplicationStatus.UnderReview => "inProgress",
                    AffiliateApplicationStatus.Approved => "completed",
                    AffiliateApplicationStatus.Rejected => "rejected",
                    _ => "new"
                };
            }

            return new EditorWorkspaceQueueItemDto(
                x.Id,
                x.Type,
                x.CustomerName,
                x.Email,
                x.PhoneNumber,
                x.CompanyName,
                x.Subject,
                sourceStatus,
                statusGroup,
                x.CreatedAt,
                x.UpdatedAt,
                x.LastActivityAt
            );
        }).ToList();

        return (resultItems, total);
    }

    public async Task<IReadOnlyList<EditorWorkspaceDraftArticleDto>> GetRecentDraftsAsync(int count, CancellationToken ct)
    {
        var drafts = await dbContext.NewsArticles.AsNoTracking()
            .Include(x => x.Category)
            .Where(x => x.Status == NewsArticleStatus.Draft)
            .OrderByDescending(x => x.UpdatedAt ?? x.CreatedAt)
            .Take(count)
            .Select(x => new EditorWorkspaceDraftArticleDto(
                x.Id,
                x.Title,
                x.Category.Name,
                x.UpdatedAt ?? x.CreatedAt))
            .ToListAsync(ct);

        return drafts;
    }

    private sealed record RawQueueItem(
        Guid Id,
        string Type,
        string CustomerName,
        string Email,
        string PhoneNumber,
        string? CompanyName,
        string Subject,
        int StatusValue,
        DateTimeOffset CreatedAt,
        DateTimeOffset? UpdatedAt,
        DateTimeOffset LastActivityAt);
}
