using Domain.Entities.Catalog;

namespace Application.Catalog.Abstractions;

public interface IServicePlanRepository
{
    Task<ServicePlan?> GetByIdAsync(Guid id, bool includePrices = false, CancellationToken cancellationToken = default);
    Task<(List<ServicePlan> Items, int TotalCount)> GetPagedAsync(Guid? categoryId, string? searchTerm, bool? isActive, int pageIndex, int pageSize, CancellationToken cancellationToken = default);
    Task<ServicePlan> AddAsync(ServicePlan plan, CancellationToken cancellationToken = default);
    Task UpdateAsync(ServicePlan plan, CancellationToken cancellationToken = default);
    Task DeleteAsync(ServicePlan plan, CancellationToken cancellationToken = default);
}
