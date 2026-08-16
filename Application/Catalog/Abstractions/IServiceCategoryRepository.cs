using Domain.Entities.Catalog;

namespace Application.Catalog.Abstractions;

public interface IServiceCategoryRepository
{
    Task<ServiceCategory?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(List<ServiceCategory> Items, int TotalCount)> GetPagedAsync(string? searchTerm, int pageIndex, int pageSize, CancellationToken cancellationToken = default);
    Task<List<ServiceCategory>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ServiceCategory> AddAsync(ServiceCategory category, CancellationToken cancellationToken = default);
    Task UpdateAsync(ServiceCategory category, CancellationToken cancellationToken = default);
    Task DeleteAsync(ServiceCategory category, CancellationToken cancellationToken = default);
}
