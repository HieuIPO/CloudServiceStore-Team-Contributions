using Domain.Entities.Promotions;

namespace Application.Promotions.Abstractions;

public interface IPromotionRepository
{
    Task<Promotion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<Promotion?> GetByCodeAsync(string code, CancellationToken cancellationToken = default);
    Task<(List<Promotion> Items, int TotalCount)> GetPagedAsync(
        string? searchTerm, bool? isActive, int pageIndex, int pageSize, CancellationToken cancellationToken = default);
    Task<Promotion> AddAsync(Promotion promotion, CancellationToken cancellationToken = default);
    Task UpdateAsync(Promotion promotion, CancellationToken cancellationToken = default);
    Task DeleteAsync(Promotion promotion, CancellationToken cancellationToken = default);
}
