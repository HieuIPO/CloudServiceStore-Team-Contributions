using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.ContactRequests;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class ContactRequestRepository(CloudServiceStoreDbContext dbContext) : IContactRequestRepository
{
    public Task<bool> HasRecentRequestAsync(string email, DateTimeOffset createdAfter, CancellationToken cancellationToken) =>
        dbContext.ContactRequests.AnyAsync(x => x.Email == email && x.CreatedAt >= createdAfter, cancellationToken);

    public async Task<(IReadOnlyList<ContactRequest> Items, int Total)> GetAsync(ContactRequestQuery query, CancellationToken cancellationToken)
    {
        IQueryable<ContactRequest> source = dbContext.ContactRequests.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            source = source.Where(x => x.FullName.Contains(search) || x.Email.Contains(search) || x.Subject.Contains(search));
        }
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status.Value);
        if (query.CreatedFrom is not null) source = source.Where(x => x.CreatedAt >= query.CreatedFrom.Value);
        if (query.CreatedTo is not null) source = source.Where(x => x.CreatedAt <= query.CreatedTo.Value);

        var descending = !string.Equals(query.SortDirection, "asc", StringComparison.OrdinalIgnoreCase);
        source = query.SortBy?.ToLowerInvariant() switch
        {
            "fullname" => descending ? source.OrderByDescending(x => x.FullName) : source.OrderBy(x => x.FullName),
            "subject" => descending ? source.OrderByDescending(x => x.Subject) : source.OrderBy(x => x.Subject),
            "status" => descending ? source.OrderByDescending(x => x.Status).ThenByDescending(x => x.CreatedAt) : source.OrderBy(x => x.Status).ThenBy(x => x.CreatedAt),
            _ => descending ? source.OrderByDescending(x => x.CreatedAt) : source.OrderBy(x => x.CreatedAt)
        };

        var total = await source.CountAsync(cancellationToken);
        var items = await source.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize)
            .ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<ContactRequest?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.ContactRequests
            .Include(x => x.StatusHistory.OrderBy(h => h.CreatedAt))
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public void Add(ContactRequest item) => dbContext.ContactRequests.Add(item);
    public void AddStatusHistory(ContactRequestStatusHistory history) => dbContext.ContactRequestStatusHistories.Add(history);

    public void AddAudit(Guid? actorId, string action, string entityName, Guid entityId, string? oldValues, string? newValues, string? ipAddress) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            ActorId = actorId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OldValuesJson = oldValues,
            NewValuesJson = newValues,
            IpAddress = ipAddress,
            OccurredAt = DateTimeOffset.UtcNow,
            CreatedBy = actorId
        });

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);
}
