using Application.Promotions.Abstractions;
using Domain.Entities.Promotions;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Promotions;

public class PromotionRepository : IPromotionRepository
{
    private readonly ApplicationDbContext _context;

    public PromotionRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Promotion?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Promotion>()
            .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<Promotion?> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        return await _context.Set<Promotion>()
            .FirstOrDefaultAsync(x => x.Code == code, cancellationToken);
    }

    public async Task<(List<Promotion> Items, int TotalCount)> GetPagedAsync(
        string? searchTerm, bool? isActive, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.Set<Promotion>().AsQueryable();

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.Code.Contains(searchTerm) || x.Name.Contains(searchTerm));
        }

        if (isActive.HasValue)
        {
            query = query.Where(x => x.IsActive == isActive.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderByDescending(x => x.CreatedAt)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<Promotion> AddAsync(Promotion promotion, CancellationToken cancellationToken = default)
    {
        await _context.Set<Promotion>().AddAsync(promotion, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return promotion;
    }

    public async Task UpdateAsync(Promotion promotion, CancellationToken cancellationToken = default)
    {
        _context.Set<Promotion>().Update(promotion);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(Promotion promotion, CancellationToken cancellationToken = default)
    {
        promotion.IsDeleted = true;
        promotion.DeletedAt = DateTime.UtcNow;
        
        _context.Set<Promotion>().Update(promotion);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
