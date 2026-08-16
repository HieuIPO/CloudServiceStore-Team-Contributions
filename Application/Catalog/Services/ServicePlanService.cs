using System.Text.Json;
using Application.Catalog.Abstractions;
using Application.Catalog.Contracts;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Entities.Catalog;
using Domain.Exceptions;

namespace Application.Catalog.Services;

public class ServicePlanService : IServicePlanService
{
    private readonly IServicePlanRepository _planRepository;
    private readonly IPlanPriceRepository _priceRepository;
    private readonly IServiceCategoryRepository _categoryRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ICurrentUserService _currentUserService;

    public ServicePlanService(
        IServicePlanRepository planRepository,
        IPlanPriceRepository priceRepository,
        IServiceCategoryRepository categoryRepository,
        IAuditLogRepository auditLogRepository,
        ICurrentUserService currentUserService)
    {
        _planRepository = planRepository;
        _priceRepository = priceRepository;
        _categoryRepository = categoryRepository;
        _auditLogRepository = auditLogRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ServicePlanDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(id, includePrices: true, cancellationToken)
            ?? throw new DomainException($"ServicePlan with ID {id} not found.");

        return new ServicePlanDetailDto
        {
            Id = plan.Id,
            ServiceCategoryId = plan.ServiceCategoryId,
            Name = plan.Name,
            Description = plan.Description,
            IsActive = plan.IsActive,
            Prices = plan.Prices.Where(p => !p.IsDeleted).Select(p => new PlanPriceDetailDto
            {
                Id = p.Id,
                Price = p.Price,
                Currency = p.Currency,
                BillingCycle = p.BillingCycle,
                EffectiveFrom = p.EffectiveFrom,
                EffectiveTo = p.EffectiveTo
            }).ToList()
        };
    }

    public async Task<PagedResult<ServicePlanListItemDto>> GetPagedAsync(ServicePlanQuery query, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _planRepository.GetPagedAsync(
            query.ServiceCategoryId, query.SearchTerm, query.IsActive, query.PageIndex, query.PageSize, cancellationToken);

        var dtos = new List<ServicePlanListItemDto>();
        var now = DateTime.UtcNow;

        foreach (var item in items)
        {
            // For listing, we might just want to show the current active price
            var activePrice = await _priceRepository.GetActivePriceAsync(item.Id, now, cancellationToken);
            
            dtos.Add(new ServicePlanListItemDto
            {
                Id = item.Id,
                ServiceCategoryId = item.ServiceCategoryId,
                Name = item.Name,
                IsActive = item.IsActive,
                CurrentPrice = activePrice?.Price
            });
        }

        return new PagedResult<ServicePlanListItemDto>
        {
            Items = dtos,
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<ServicePlanDetailDto> CreateAsync(CreateServicePlanRequest request, CancellationToken cancellationToken = default)
    {
        // Verify category exists
        _ = await _categoryRepository.GetByIdAsync(request.ServiceCategoryId, cancellationToken)
            ?? throw new DomainException($"ServiceCategory with ID {request.ServiceCategoryId} not found.");

        var plan = new ServicePlan
        {
            Id = Guid.NewGuid(),
            ServiceCategoryId = request.ServiceCategoryId,
            Name = request.Name,
            Description = request.Description,
            IsActive = request.IsActive,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        await _planRepository.AddAsync(plan, cancellationToken);
        await LogAuditAsync(nameof(ServicePlan), "CREATE", null, plan, cancellationToken);

        return await GetByIdAsync(plan.Id, cancellationToken);
    }

    public async Task UpdateAsync(Guid id, UpdateServicePlanRequest request, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new DomainException($"ServicePlan with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(plan);

        plan.Name = request.Name;
        plan.Description = request.Description;
        plan.IsActive = request.IsActive;
        plan.UpdatedAt = DateTime.UtcNow;
        plan.UpdatedBy = _currentUserService.UserId;

        await _planRepository.UpdateAsync(plan, cancellationToken);
        await LogAuditAsync(nameof(ServicePlan), "UPDATE", beforeSnapshot, plan, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(id, false, cancellationToken)
            ?? throw new DomainException($"ServicePlan with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(plan);

        await _planRepository.DeleteAsync(plan, cancellationToken);
        await LogAuditAsync(nameof(ServicePlan), "DELETE", beforeSnapshot, null, cancellationToken);
    }

    public async Task<PlanPriceDetailDto> AddPriceAsync(Guid planId, CreatePlanPriceRequest request, CancellationToken cancellationToken = default)
    {
        var plan = await _planRepository.GetByIdAsync(planId, false, cancellationToken)
            ?? throw new DomainException($"ServicePlan with ID {planId} not found.");

        if (request.EffectiveTo.HasValue && request.EffectiveFrom >= request.EffectiveTo.Value)
            throw new DomainException("EffectiveFrom must be before EffectiveTo.");

        // Overlap check
        var existingPrices = await _priceRepository.GetPricesForPlanAsync(planId, cancellationToken);
        foreach (var ep in existingPrices)
        {
            bool overlap = request.EffectiveFrom < (ep.EffectiveTo ?? DateTime.MaxValue) &&
                           (request.EffectiveTo ?? DateTime.MaxValue) > ep.EffectiveFrom;
            if (overlap)
                throw new DomainException("Price date range overlaps with an existing price.");
        }

        var price = new PlanPrice
        {
            Id = Guid.NewGuid(),
            ServicePlanId = planId,
            Price = request.Price,
            Currency = request.Currency,
            BillingCycle = request.BillingCycle,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        await _priceRepository.AddAsync(price, cancellationToken);
        await LogAuditAsync(nameof(PlanPrice), "CREATE", null, price, cancellationToken);

        return new PlanPriceDetailDto
        {
            Id = price.Id,
            Price = price.Price,
            Currency = price.Currency,
            BillingCycle = price.BillingCycle,
            EffectiveFrom = price.EffectiveFrom,
            EffectiveTo = price.EffectiveTo
        };
    }

    public async Task UpdatePriceAsync(Guid priceId, UpdatePlanPriceRequest request, CancellationToken cancellationToken = default)
    {
        var price = await _priceRepository.GetByIdAsync(priceId, cancellationToken)
            ?? throw new DomainException($"PlanPrice with ID {priceId} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(price);

        if (request.EffectiveTo.HasValue && request.EffectiveFrom >= request.EffectiveTo.Value)
            throw new DomainException("EffectiveFrom must be before EffectiveTo.");

        var existingPrices = await _priceRepository.GetPricesForPlanAsync(price.ServicePlanId, cancellationToken);
        foreach (var ep in existingPrices.Where(p => p.Id != priceId))
        {
            bool overlap = request.EffectiveFrom < (ep.EffectiveTo ?? DateTime.MaxValue) &&
                           (request.EffectiveTo ?? DateTime.MaxValue) > ep.EffectiveFrom;
            if (overlap)
                throw new DomainException("Price date range overlaps with an existing price.");
        }

        price.Price = request.Price;
        price.Currency = request.Currency;
        price.BillingCycle = request.BillingCycle;
        price.EffectiveFrom = request.EffectiveFrom;
        price.EffectiveTo = request.EffectiveTo;
        price.UpdatedAt = DateTime.UtcNow;
        price.UpdatedBy = _currentUserService.UserId;

        await _priceRepository.UpdateAsync(price, cancellationToken);
        await LogAuditAsync(nameof(PlanPrice), "UPDATE", beforeSnapshot, price, cancellationToken);
    }
    
    public async Task UpdatePriceEffectiveToAsync(Guid priceId, DateTime? effectiveTo, CancellationToken cancellationToken = default)
    {
        var price = await _priceRepository.GetByIdAsync(priceId, cancellationToken)
            ?? throw new DomainException($"PlanPrice with ID {priceId} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(price);

        if (effectiveTo.HasValue && price.EffectiveFrom >= effectiveTo.Value)
            throw new DomainException("EffectiveFrom must be before EffectiveTo.");

        var existingPrices = await _priceRepository.GetPricesForPlanAsync(price.ServicePlanId, cancellationToken);
        foreach (var ep in existingPrices.Where(p => p.Id != priceId))
        {
            bool overlap = price.EffectiveFrom < (ep.EffectiveTo ?? DateTime.MaxValue) &&
                           (effectiveTo ?? DateTime.MaxValue) > ep.EffectiveFrom;
            if (overlap)
                throw new DomainException("Price date range overlaps with an existing price after update.");
        }

        price.EffectiveTo = effectiveTo;
        price.UpdatedAt = DateTime.UtcNow;
        price.UpdatedBy = _currentUserService.UserId;

        await _priceRepository.UpdateAsync(price, cancellationToken);
        await LogAuditAsync(nameof(PlanPrice), "UPDATE_EFFECTIVE_TO", beforeSnapshot, price, cancellationToken);
    }

    public async Task DeletePriceAsync(Guid priceId, CancellationToken cancellationToken = default)
    {
        var price = await _priceRepository.GetByIdAsync(priceId, cancellationToken)
            ?? throw new DomainException($"PlanPrice with ID {priceId} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(price);

        await _priceRepository.DeleteAsync(price, cancellationToken);
        await LogAuditAsync(nameof(PlanPrice), "DELETE", beforeSnapshot, null, cancellationToken);
    }

    private async Task LogAuditAsync(string entityName, string action, string? before, object? after, CancellationToken cancellationToken)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityName = entityName,
            Action = action,
            Actor = _currentUserService.UserId,
            BeforeSnapshot = before,
            AfterSnapshot = after != null ? JsonSerializer.Serialize(after) : null,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };
        await _auditLogRepository.AddAsync(log, cancellationToken);
    }
}
