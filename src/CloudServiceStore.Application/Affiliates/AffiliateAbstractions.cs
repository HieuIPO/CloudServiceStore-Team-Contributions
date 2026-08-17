using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Affiliates;

public interface IAffiliateRepository
{
    Task<AffiliateProgramContent?> FindProgramContentAsync(CancellationToken cancellationToken);
    Task<bool> HasRecentApplicationAsync(string email, DateTimeOffset createdAfter, CancellationToken cancellationToken);
    Task<(IReadOnlyList<AffiliateApplication> Items, int Total)> GetApplicationsAsync(AffiliateApplicationQuery query, CancellationToken cancellationToken);
    Task<(IReadOnlyList<AffiliateApplication> Items, int Total)> GetApplicationsForCustomerAsync(Guid userId, CustomerAffiliateQuery query, CancellationToken cancellationToken);
    Task<AffiliateApplication?> FindApplicationAsync(Guid id, CancellationToken cancellationToken);
    Task<AffiliateApplication?> FindApplicationForCustomerAsync(Guid id, Guid userId, CancellationToken cancellationToken);
    void AddApplication(AffiliateApplication application);
    void AddStatusHistory(AffiliateApplicationStatusHistory history);
    void AddAudit(Guid? actorId, string action, string entityName, Guid entityId, string? oldValuesJson, string? newValuesJson, string? ipAddress);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class AffiliateNotFoundException(string message) : Exception(message);
public sealed class AffiliateConflictException(string message) : Exception(message);
public sealed class AffiliateValidationException(string message) : Exception(message);
