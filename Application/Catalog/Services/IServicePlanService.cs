using Application.Catalog.Contracts;
using Application.Common.Models;

namespace Application.Catalog.Services;

public interface IServicePlanService
{
    Task<ServicePlanDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PagedResult<ServicePlanListItemDto>> GetPagedAsync(ServicePlanQuery query, CancellationToken cancellationToken = default);
    Task<ServicePlanDetailDto> CreateAsync(CreateServicePlanRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdateServicePlanRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
    
    // Price methods
    Task<PlanPriceDetailDto> AddPriceAsync(Guid planId, CreatePlanPriceRequest request, CancellationToken cancellationToken = default);
    Task UpdatePriceAsync(Guid priceId, UpdatePlanPriceRequest request, CancellationToken cancellationToken = default);
    Task DeletePriceAsync(Guid priceId, CancellationToken cancellationToken = default);
    Task UpdatePriceEffectiveToAsync(Guid priceId, DateTime? effectiveTo, CancellationToken cancellationToken = default);
}
