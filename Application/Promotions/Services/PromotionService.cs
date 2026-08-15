using Application.Common.Interfaces;
using Application.Common.Models;
using Application.Promotions.Abstractions;
using Application.Promotions.Contracts;
using Domain.Entities;
using Domain.Entities.Promotions;
using Domain.Exceptions;
using System.Text.Json;

namespace Application.Promotions.Services;

public class PromotionService : IPromotionService
{
    private readonly IPromotionRepository _promotionRepository;
    private readonly IAuditLogRepository _auditLogRepository;
    private readonly ICurrentUserService _currentUserService;

    public PromotionService(
        IPromotionRepository promotionRepository,
        IAuditLogRepository auditLogRepository,
        ICurrentUserService currentUserService)
    {
        _promotionRepository = promotionRepository;
        _auditLogRepository = auditLogRepository;
        _currentUserService = currentUserService;
    }

    public async Task<PromotionDto> GetByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var promotion = await _promotionRepository.GetByIdAsync(id, cancellationToken);
        if (promotion == null)
            throw new KeyNotFoundException($"Promotion with ID {id} not found.");

        return MapToDto(promotion);
    }

    public async Task<PromotionDto> GetByCodeAsync(string code, CancellationToken cancellationToken = default)
    {
        var promotion = await _promotionRepository.GetByCodeAsync(code, cancellationToken);
        if (promotion == null)
            throw new KeyNotFoundException($"Promotion with Code {code} not found.");

        return MapToDto(promotion);
    }

    public async Task<PagedResult<PromotionDto>> GetPagedAsync(PromotionQuery query, CancellationToken cancellationToken = default)
    {
        var (items, totalCount) = await _promotionRepository.GetPagedAsync(
            query.SearchTerm, query.IsActive, query.PageIndex, query.PageSize, cancellationToken);

        var dtos = items.Select(MapToDto).ToList();
        return new PagedResult<PromotionDto> { Items = dtos, TotalCount = totalCount, PageIndex = query.PageIndex, PageSize = query.PageSize };
    }

    public async Task<PromotionDto> CreateAsync(CreatePromotionRequest request, CancellationToken cancellationToken = default)
    {
        var existing = await _promotionRepository.GetByCodeAsync(request.Code, cancellationToken);
        if (existing != null)
            throw new DomainException($"Promotion with code '{request.Code}' already exists.");

        if (request.DiscountValue < 0)
            throw new DomainException("Discount value cannot be negative.");

        var promotion = new Promotion
        {
            Code = request.Code.ToUpperInvariant(),
            Name = request.Name,
            Description = request.Description,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            EffectiveFrom = request.EffectiveFrom,
            EffectiveTo = request.EffectiveTo,
            IsActive = true
        };

        var created = await _promotionRepository.AddAsync(promotion, cancellationToken);
        await LogActionAsync("CREATE", null, created);

        return MapToDto(created);
    }

    public async Task UpdateAsync(Guid id, UpdatePromotionRequest request, CancellationToken cancellationToken = default)
    {
        var promotion = await _promotionRepository.GetByIdAsync(id, cancellationToken);
        if (promotion == null)
            throw new KeyNotFoundException($"Promotion with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(promotion);

        promotion.Name = request.Name;
        promotion.Description = request.Description;
        promotion.EffectiveTo = request.EffectiveTo;
        promotion.IsActive = request.IsActive;

        await _promotionRepository.UpdateAsync(promotion, cancellationToken);
        await LogActionAsync("UPDATE", beforeSnapshot, promotion);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var promotion = await _promotionRepository.GetByIdAsync(id, cancellationToken);
        if (promotion == null)
            throw new KeyNotFoundException($"Promotion with ID {id} not found.");

        var beforeSnapshot = JsonSerializer.Serialize(promotion);
        
        await _promotionRepository.DeleteAsync(promotion, cancellationToken);
        await LogActionAsync("DELETE", beforeSnapshot, promotion);
    }

    private PromotionDto MapToDto(Promotion p)
    {
        return new PromotionDto
        {
            Id = p.Id,
            Code = p.Code,
            Name = p.Name,
            Description = p.Description,
            DiscountType = p.DiscountType,
            DiscountValue = p.DiscountValue,
            EffectiveFrom = p.EffectiveFrom,
            EffectiveTo = p.EffectiveTo,
            IsActive = p.IsActive
        };
    }

    private async Task LogActionAsync(string action, string? beforeSnapshot, Promotion promotion)
    {
        var log = new AuditLog
        {
            EntityName = nameof(Promotion) + " - " + promotion.Id,
            Action = action,
            Actor = _currentUserService.UserId,
            BeforeSnapshot = beforeSnapshot,
            AfterSnapshot = action == "DELETE" ? null : JsonSerializer.Serialize(promotion)
        };
        await _auditLogRepository.AddAsync(log);
    }
}
