using Application.Catalog.Contracts;
using Application.Common.Models;

namespace Application.Catalog.Services;

public interface IServiceCategoryService
{
    Task<ServiceCategoryDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ServiceCategoryListItemDto>> GetPagedAsync(ServiceCategoryQuery query, CancellationToken cancellationToken = default);
    Task<List<ServiceCategoryListItemDto>> GetAllAsync(CancellationToken cancellationToken = default);
    Task<ServiceCategoryDetailDto> CreateAsync(CreateServiceCategoryRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateServiceCategoryRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
