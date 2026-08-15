using Application.Common.Models;
using Application.Promotions.Contracts;

namespace Application.Promotions.Services;

public interface IPromotionService
{
    Task<PromotionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<PromotionDto> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<PagedResult<PromotionDto>> GetPagedAsync(PromotionQuery query, CancellationToken cancellationToken = default);
    Task<PromotionDto> CreateAsync(CreatePromotionRequest request, CancellationToken cancellationToken = default);
    Task UpdateAsync(Guid id, UpdatePromotionRequest request, CancellationToken cancellationToken = default);
    Task DeleteAsync(Guid id, CancellationToken cancellationToken = default);
}
