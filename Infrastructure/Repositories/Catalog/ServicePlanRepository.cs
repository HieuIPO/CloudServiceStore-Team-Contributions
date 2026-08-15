using Application.Catalog.Abstractions;
using Domain.Entities.Catalog;
using Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Repositories.Catalog;

public class ServicePlanRepository : IServicePlanRepository
{
    private readonly ApplicationDbContext _context;

    public ServicePlanRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServicePlan?> GetByIdAsync(Guid id, bool includePrices = false, CancellationToken cancellationToken = default)
    {
        var query = _context.ServicePlans.AsQueryable();

        if (includePrices)
        {
            query = query.Include(x => x.Prices);
        }

        return await query.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);
    }

    public async Task<(List<ServicePlan> Items, int TotalCount)> GetPagedAsync(
        Guid? categoryId, string? searchTerm, bool? isActive, int pageIndex, int pageSize, CancellationToken cancellationToken = default)
    {
        var query = _context.ServicePlans.AsQueryable();

        if (categoryId.HasValue)
        {
            query = query.Where(x => x.ServiceCategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(searchTerm))
        {
            query = query.Where(x => x.Name.Contains(searchTerm) || (x.Description != null && x.Description.Contains(searchTerm)));
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

    public async Task<ServicePlan> AddAsync(ServicePlan plan, CancellationToken cancellationToken = default)
    {
        await _context.ServicePlans.AddAsync(plan, cancellationToken);
        await _context.SaveChangesAsync(cancellationToken);
        return plan;
    }

    public async Task UpdateAsync(ServicePlan plan, CancellationToken cancellationToken = default)
    {
        _context.ServicePlans.Update(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task DeleteAsync(ServicePlan plan, CancellationToken cancellationToken = default)
    {
        plan.IsDeleted = true;
        plan.DeletedAt = DateTime.UtcNow;
        
        _context.ServicePlans.Update(plan);
        await _context.SaveChangesAsync(cancellationToken);
    }
}
