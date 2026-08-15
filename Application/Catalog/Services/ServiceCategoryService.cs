using System.Text.Json;
using Application.Catalog.Abstractions;
using Application.Catalog.Contracts;
using Application.Common.Interfaces;
using Application.Common.Models;
using Domain.Entities;
using Domain.Entities.Catalog;
using Domain.Exceptions;

namespace Application.Catalog.Services;

public class ServiceCategoryService : IServiceCategoryService
{
    private readonly IServiceCategoryRepository _categoryRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ICurrentUserService _currentUserService;

    public ServiceCategoryService(
        IServiceCategoryRepository categoryRepository,
        IAuditLogRepository auditLogRepository,
        ICurrentUserService currentUserService)
    {
        _categoryRepository = categoryRepository;
        _auditLogRepository = auditLogRepository;
        _currentUserService = currentUserService;
    }

    public async Task<ServiceCategoryDetailDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DomainException($"ServiceCategory with ID {id} not found.");

        return new ServiceCategoryDetailDto
        {
            Id = category.Id,
            Name = category.Name,
            Description = category.Description,
            CreatedAt = category.CreatedAt,
            UpdatedAt = category.UpdatedAt
        };
    }

    public async Task<PagedResult<ServiceCategoryListItemDto>> GetPagedAsync(ServiceCategoryQuery query, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _categoryRepository.GetPagedAsync(query.SearchTerm, query.PageIndex, query.PageSize, cancellationToken);

        return new PagedResult<ServiceCategoryListItemDto>
        {
            Items = items.Select(x => new ServiceCategoryListItemDto
            {
                Id = x.Id,
                Name = x.Name,
                Description = x.Description,
                CreatedAt = x.CreatedAt
            }).ToList(),
            TotalCount = totalCount,
            PageIndex = query.PageIndex,
            PageSize = query.PageSize
        };
    }

    public async Task<List<ServiceCategoryListItemDto>> GetAllAsync(CancellationToken cancellationToken = default)
    {
        var items = await _categoryRepository.GetAllAsync(cancellationToken);
        
        return items.Select(x => new ServiceCategoryListItemDto
        {
            Id = x.Id,
            Name = x.Name,
            Description = x.Description,
            CreatedAt = x.CreatedAt
        }).ToList();
    }

    public async Task<ServiceCategoryDetailDto> CreateAsync(CreateServiceCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = new ServiceCategory
        {
            Id = Guid.NewGuid(),
            Name = request.Name,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            CreatedBy = _currentUserService.UserId
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await LogAuditAsync("CREATE", null, category, cancellationToken);

        return await GetByIdAsync(category.Id, cancellationToken);
    }

    public async Task UpdateAsync(Guid id, UpdateServiceCategoryRequest request, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DomainException($"ServiceCategory with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(category);

        category.Name = request.Name;
        category.Description = request.Description;
        category.UpdatedAt = DateTime.UtcNow;
        category.UpdatedBy = _currentUserService.UserId;

        await _categoryRepository.UpdateAsync(category, cancellationToken);
        await LogAuditAsync("UPDATE", beforeSnapshot, category, cancellationToken);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var category = await _categoryRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new DomainException($"ServiceCategory with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(category);
        
        await _categoryRepository.DeleteAsync(category, cancellationToken);
        await LogAuditAsync("DELETE", beforeSnapshot, null, cancellationToken);
    }

    private async Task LogAuditAsync(string action, string? before, object? after, CancellationToken cancellationToken)
    {
        var log = new AuditLog
        {
            Id = Guid.NewGuid(),
            EntityName = nameof(ServiceCategory),
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
