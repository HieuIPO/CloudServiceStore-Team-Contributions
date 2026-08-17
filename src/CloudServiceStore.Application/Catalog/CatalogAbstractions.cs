using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Catalog;

public interface ICatalogRepository
{
    Task<(IReadOnlyList<ServiceCategory> Items, int Total)> GetCategoriesAsync(ServiceCategoryQuery query, CancellationToken cancellationToken);
    Task<ServiceCategory?> FindCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedId, CancellationToken cancellationToken);
    Task<bool> CategoryHasPlansAsync(Guid categoryId, CancellationToken cancellationToken);
    Task<(IReadOnlyList<ServicePlan> Items, int Total)> GetPlansAsync(ServicePlanQuery query, CancellationToken cancellationToken);
    Task<ServicePlan?> FindPlanAsync(Guid id, CancellationToken cancellationToken);
    Task<ServicePlan?> FindPlanBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<bool> PlanSlugExistsAsync(string slug, Guid? excludedId, CancellationToken cancellationToken);
    Task<PlanPrice?> FindPriceAsync(Guid id, CancellationToken cancellationToken);
    Task<IReadOnlyList<PlanPrice>> GetPricesForCycleAsync(Guid planId, Domain.Enums.BillingCycle cycle, CancellationToken cancellationToken);
    void AddCategory(ServiceCategory category);
    void AddPlan(ServicePlan plan);
    void AddPlanFeature(ServicePlanFeature feature);
    void RemovePlanFeature(ServicePlanFeature feature);
    void AddPrice(PlanPrice price);
    void AddAudit(Guid actorId, string action, string entityName, Guid entityId);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class CatalogNotFoundException(string message) : Exception(message);
public sealed class CatalogConflictException(string message) : Exception(message);
public sealed class CatalogValidationException(string message) : Exception(message);
