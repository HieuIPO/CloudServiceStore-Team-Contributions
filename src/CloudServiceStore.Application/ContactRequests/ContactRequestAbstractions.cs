using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.ContactRequests;

public interface IContactRequestRepository
{
    Task<bool> HasRecentRequestAsync(string email, DateTimeOffset createdAfter, CancellationToken cancellationToken);
    Task<(IReadOnlyList<ContactRequest> Items, int Total)> GetAsync(ContactRequestQuery query, CancellationToken cancellationToken);
    Task<ContactRequest?> FindAsync(Guid id, CancellationToken cancellationToken);
    void Add(ContactRequest item);
    void AddStatusHistory(ContactRequestStatusHistory history);
    void AddAudit(Guid? actorId, string action, string entityName, Guid entityId, string? oldValues, string? newValues, string? ipAddress);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IContactRequestService
{
    Task<ContactRequestConfirmationDto> CreateAsync(CreateContactRequestRequest request, Guid? ownerId, string? ipAddress, CancellationToken cancellationToken);
    Task<PagedResult<ContactRequestListItemDto>> GetAsync(ContactRequestQuery query, CancellationToken cancellationToken);
    Task<ContactRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<ContactRequestDetailDto> UpdateStatusAsync(Guid id, UpdateContactRequestStatusRequest request, Guid actorId, string? ipAddress, CancellationToken cancellationToken);
}

public sealed class ContactRequestValidationException(string message) : Exception(message);
public sealed class ContactRequestConflictException(string message) : Exception(message);
public sealed class ContactRequestNotFoundException(string message) : Exception(message);
