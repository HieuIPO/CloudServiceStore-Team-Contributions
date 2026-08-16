using Domain.Entities.Catalog;

namespace Application.Catalog.Abstractions;

public interface IPlanPriceRepository
{
    Task<PlanPrice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(List<PlanPrice> Items, int TotalCount)> GetPagedAsync(Guid? servicePlanId, int pageIndex, int pageSize, CancellationToken cancellationToken = default);
    Task<PlanPrice?> GetActivePriceAsync(Guid servicePlanId, DateTime atDate, CancellationToken cancellationToken = default);
    Task<List<PlanPrice>> GetPricesForPlanAsync(Guid servicePlanId, CancellationToken cancellationToken = default);
    Task<PlanPrice> AddAsync(PlanPrice price, CancellationToken cancellationToken = default);
    Task UpdateAsync(PlanPrice price, CancellationToken cancellationToken = default);
    Task DeleteAsync(PlanPrice price, CancellationToken cancellationToken = default);
}
