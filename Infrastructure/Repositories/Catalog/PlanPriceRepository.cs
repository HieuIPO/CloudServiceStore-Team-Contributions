using Application.Catalog.Abstractions;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Catalog;

public class PlanPriceRepository : IPlanPriceRepository
{
    private readonly ApplicationDbContext _context;

    public PlanPriceRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<PlanPrice?> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        return await _context.PlanPrices.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<(List<PlanPrice> Items, int TotalCount)> GetPagedAsync(
        Guid? servicePlanId, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.PlanPrices.AsQueryable();

        if (servicePlanId.HasValue)
        {
            query = query.Where(x => x.ServicePlanId == servicePlanId.Value);
        }

        var totalCount = await query.CountAsync(cancellationToken);
        
        var items = await query
            .OrderByDescending(x => x.EffectiveFrom)
            .Skip((pageIndex - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalCount);
    }

    public async Task<PlanPrice?> GetActivePriceAsync(Guid servicePlanId, DateTime atDate, CancellationToken cancellationToken = default)
    {
        return await _context.PlanPrices
            .Where(x => x.ServicePlanId == servicePlanId &&
                        x.EffectiveFrom <= atDate &&
                        (x.EffectiveTo == null || x.EffectiveTo > atDate))
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<List<PlanPrice>> GetPricesForPlanAsync(Guid servicePlanId, CancellationToken cancellationToken = default)
    {
        return await _context.PlanPrices
            .Where(x => x.ServicePlanId == servicePlanId)
            .ToListAsync(cancellationToken);
    }

    public async Task<PlanPrice> AddAsync(PlanPrice price, CancellationToken cancellationToken = default)
    {
        await _context.PlanPrices.AddAsync(price, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return price;
    }

    public async Task UpdateAsync(PlanPrice price, CancellationToken cancellationToken = default)
    {
        _context.PlanPrices.Update(price);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(PlanPrice price, CancellationToken cancellationToken = default)
    {
        price.IsDeleted = true;
        price.DeletedAt = DateTime.UtcNow;
        
        _context.PlanPrices.Update(price);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
