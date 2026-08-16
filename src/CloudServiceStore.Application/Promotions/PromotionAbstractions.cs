using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Promotions;

public interface IPromotionRepository
{
    Task<(IReadOnlyList<Promotion> Items, int Total)> GetPromotionsAsync(PromotionQuery query, CancellationToken cancellationToken);
    Task<Promotion?> FindPromotionAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<Promotion>> GetPublicBannerPromotionsAsync(Guid? excludedId, CancellationToken cancellationToken);
    Task<bool> CodeExistsAsync(string code, Guid? excludedId, CancellationToken cancellationToken);
    Task<IReadOnlyList<Guid>> GetExistingPlanIdsAsync(IReadOnlyCollection<Guid> planIds, CancellationToken cancellationToken);
    void SyncPromotionPlans(Promotion promotion, IReadOnlyCollection<Guid> planIds, Guid actorId);
    void Add(Promotion promotion);
    void AddAudit(Guid actorId, string action, string entityName, Guid entityId);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class PromotionNotFoundException(string message) : Exception(message);
public sealed class PromotionConflictException(string message) : Exception(message);
public sealed class PromotionValidationException(string message) : Exception(message);
