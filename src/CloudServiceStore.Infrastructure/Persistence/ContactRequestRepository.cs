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
            source = source.Where(x => x.FullName.Contains(search) || x.Email.Contains(search) || x.PhoneNumber.Contains(search) || x.Subject.Contains(search) || x.Message.Contains(search));
        }
        if (query.Status is not null) source = source.Where(x => x.Status == query.Status);
        if (query.CreatedFrom is not null) source = source.Where(x => x.CreatedAt >= query.CreatedFrom);
        if (query.CreatedTo is not null) source = source.Where(x => x.CreatedAt <= query.CreatedTo);

        var total = await source.CountAsync(cancellationToken);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "fullname" => descending ? source.OrderByDescending(x => x.FullName).ThenBy(x => x.Id) : source.OrderBy(x => x.FullName).ThenBy(x => x.Id),
            "subject" => descending ? source.OrderByDescending(x => x.Subject).ThenBy(x => x.Id) : source.OrderBy(x => x.Subject).ThenBy(x => x.Id),
            "status" => descending ? source.OrderByDescending(x => x.Status).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id) : source.OrderBy(x => x.Status).ThenByDescending(x => x.CreatedAt).ThenBy(x => x.Id),
            "createdat" => descending ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id) : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            _ => source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
        };
        var items = await ordered.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(cancellationToken);
        return (items, total);
    }

    public Task<ContactRequest?> FindAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.ContactRequests.Include(x => x.StatusHistory).FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public void Add(ContactRequest request) => dbContext.ContactRequests.Add(request);
    public void AddStatusHistory(ContactRequestStatusHistory history) => dbContext.ContactRequestStatusHistories.Add(history);

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

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);
}
