using System.Net.Mail;
using System.Text.Json;
using System.Text.RegularExpressions;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Orders;

public sealed partial class OrderService(
    IOrderRepository repository,
    IDiscountStrategyFactory discountStrategyFactory,
    TimeProvider? timeProvider = null) : IOrderService
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;

    public async Task<OrderConfirmationDto> CreateAsync(CreateOrderRequest request, string? ipAddress, CancellationToken ct, OrderRequestOwner? owner = null)
    {
        var effectiveRequest = owner is null
            ? request
            : request with { CustomerName = owner.FullName, Email = owner.Email };
        ValidateCreate(effectiveRequest);
        var now = clock.GetUtcNow();
        var email = effectiveRequest.Email.Trim().ToLowerInvariant();
        var phone = NormalizePhone(effectiveRequest.PhoneNumber);
        var plan = await repository.FindPlanForOrderAsync(effectiveRequest.ServicePlanId, ct);
        if (plan is not { IsActive: true })
            throw new OrderValidationException("An active service plan is required.");

        var price = plan.Prices
            .Where(x => x.IsActive && x.BillingCycle == effectiveRequest.BillingCycle && x.EffectiveFrom <= now && (x.EffectiveTo is null || x.EffectiveTo > now))
            .OrderByDescending(x => x.EffectiveFrom)
            .FirstOrDefault()
            ?? throw new OrderValidationException("The selected plan does not have an active price for this billing cycle.");

        if (await repository.HasRecentDuplicateAsync(email, phone, plan.Id, now.AddMinutes(-5), ct))
            throw new OrderConflictException("A matching order request was submitted recently. Please wait before trying again.");

        var bestPromotion = plan.PromotionPlans
            .Select(x => x.Promotion)
            .Where(x => x.IsActive && x.StartsAt <= now && x.EndsAt > now && PromotionApplicability.AppliesToCycle(x, effectiveRequest.BillingCycle))
            .Select(x => new
            {
                Promotion = x,
                Amount = discountStrategyFactory.Get(x.DiscountType).Apply(price.Amount, x.DiscountValue)
            })
            .OrderBy(x => x.Amount)
            .FirstOrDefault();

        var entity = new OrderRequest
        {
            ServicePlanId = plan.Id,
            AppUserId = owner?.UserId,
            CustomerName = effectiveRequest.CustomerName.Trim(),
            Email = email,
            PhoneNumber = phone,
            CompanyName = CleanOptional(effectiveRequest.CompanyName),
            BillingCycle = effectiveRequest.BillingCycle,
            OriginalAmount = price.Amount,
            QuotedAmount = bestPromotion?.Amount ?? price.Amount,
            Currency = price.Currency,
            PlanNameSnapshot = plan.Name,
            SpecificationSnapshot = JsonSerializer.Serialize(plan.Features.OrderBy(x => x.DisplayOrder).Select(x => new
            {
                x.FeatureKey,
                x.DisplayName,
                x.Value,
                x.Unit
            })),
            PromotionCodeSnapshot = bestPromotion?.Promotion.Code,
            Status = OrderRequestStatus.Pending,
            Note = CleanOptional(effectiveRequest.Note),
            CreatedAt = now
        };

        entity.StatusHistory.Add(new OrderRequestStatusHistory
        {
            FromStatus = OrderRequestStatus.Pending,
            ToStatus = OrderRequestStatus.Pending,
            Note = "Order request received.",
            CreatedAt = now
        });
        repository.Add(entity);
        repository.AddAudit(owner?.UserId, "Order.Created", nameof(OrderRequest), entity.Id, null,
            JsonSerializer.Serialize(new { entity.Status, entity.QuotedAmount, entity.Currency, entity.PromotionCodeSnapshot }), ipAddress);
        await repository.SaveChangesAsync(ct);
        return new(entity.Id, entity.Status, entity.PlanNameSnapshot, entity.BillingCycle, entity.QuotedAmount, entity.Currency, entity.CreatedAt);
    }

    public async Task<PagedResult<OrderRequestListItemDto>> GetAsync(OrderRequestQuery query, CancellationToken ct)
    {
        ValidateQuery(query);
        var result = await repository.GetAsync(query, ct);
        return new(result.Items.Select(MapList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<OrderRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken ct) =>
        (await repository.FindAsync(id, ct)) is { } order ? MapDetail(order) : null;

    public async Task<PagedResult<CustomerOrderListItemDto>> GetCustomerOrdersAsync(Guid userId, CustomerOrderQuery query, CancellationToken ct)
    {
        ValidateCustomerQuery(userId, query);
        var result = await repository.GetForCustomerAsync(userId, query, ct);
        return new(result.Items.Select(MapCustomerList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<CustomerOrderDetailDto?> GetCustomerOrderByIdAsync(Guid userId, Guid id, CancellationToken ct)
    {
        if (userId == Guid.Empty || id == Guid.Empty) return null;
        return (await repository.FindForCustomerAsync(id, userId, ct)) is { } order ? MapCustomerDetail(order) : null;
    }

    public async Task<OrderRequestDetailDto> UpdateStatusAsync(Guid id, UpdateOrderStatusRequest request, Guid actorId, string? ipAddress, CancellationToken ct)
    {
        if (!Enum.IsDefined(request.Status))
            throw new OrderValidationException("Order status is not supported.");
        if (request.Status == OrderRequestStatus.Rejected && string.IsNullOrWhiteSpace(request.Note))
            throw new OrderValidationException("Ghi chú lý do từ chối là bắt buộc.");
        if (request.Note?.Trim().Length > 1000)
            throw new OrderValidationException("Status note must be 1000 characters or fewer.");

        var order = await repository.FindAsync(id, ct) ?? throw new OrderNotFoundException("Order request was not found.");
        if (order.Status == request.Status)
            throw new OrderConflictException("Order request already has the selected status.");
        if (!CanTransition(order.Status, request.Status))
            throw new OrderConflictException($"Cannot change order status from {order.Status} to {request.Status}.");

        var previous = order.Status;
        var now = clock.GetUtcNow();
        order.Status = request.Status;
        order.UpdatedBy = actorId;
        order.UpdatedAt = now;
        var history = new OrderRequestStatusHistory
        {
            FromStatus = previous,
            ToStatus = request.Status,
            Note = CleanOptional(request.Note),
            ChangedBy = actorId,
            CreatedBy = actorId,
            CreatedAt = now
        };
        order.StatusHistory.Add(history);
        repository.AddStatusHistory(history);
        repository.AddAudit(actorId, "Order.StatusChanged", nameof(OrderRequest), order.Id,
            JsonSerializer.Serialize(new { Status = previous }),
            JsonSerializer.Serialize(new { order.Status, Note = CleanOptional(request.Note) }),
            ipAddress);
        await repository.SaveChangesAsync(ct);
        return MapDetail(order);
    }

    private static bool CanTransition(OrderRequestStatus from, OrderRequestStatus to) => from switch
    {
        OrderRequestStatus.Pending => to is OrderRequestStatus.Contacted or OrderRequestStatus.Rejected or OrderRequestStatus.Cancelled,
        OrderRequestStatus.Contacted => to is OrderRequestStatus.Approved or OrderRequestStatus.Rejected or OrderRequestStatus.Cancelled,
        OrderRequestStatus.Approved => to is OrderRequestStatus.Cancelled,
        _ => false
    };

    private static void ValidateCreate(CreateOrderRequest request)
    {
        if (request.ServicePlanId == Guid.Empty)
            throw new OrderValidationException("Service plan is required.");
        if (string.IsNullOrWhiteSpace(request.CustomerName) || request.CustomerName.Trim().Length > 160)
            throw new OrderValidationException("Customer name is required and must be 160 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Trim().Length > 256 || !IsValidEmail(request.Email))
            throw new OrderValidationException("A valid email address is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || !PhonePattern().IsMatch(request.PhoneNumber.Trim()))
            throw new OrderValidationException("A valid phone number from 8 to 15 digits is required.");
        if (request.CompanyName?.Trim().Length > 160)
            throw new OrderValidationException("Company name must be 160 characters or fewer.");
        if (request.Note?.Trim().Length > 1000)
            throw new OrderValidationException("Note must be 1000 characters or fewer.");
        if (!Enum.IsDefined(request.BillingCycle))
            throw new OrderValidationException("Billing cycle is not supported.");
    }

    private static void ValidateQuery(OrderRequestQuery query)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new OrderValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Search?.Trim().Length > 256)
            throw new OrderValidationException("Search must be 256 characters or fewer.");
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new OrderValidationException("Order status is not supported.");
        if (query.CreatedFrom is not null && query.CreatedTo is not null && query.CreatedTo < query.CreatedFrom)
            throw new OrderValidationException("CreatedTo must be on or after CreatedFrom.");
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "customerName", "createdAt", "quotedAmount", "status" },
            message => new OrderValidationException(message));
    }

    private static void ValidateCustomerQuery(Guid userId, CustomerOrderQuery query)
    {
        if (userId == Guid.Empty)
            throw new OrderValidationException("A valid customer account is required.");
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new OrderValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new OrderValidationException("Order status is not supported.");
    }

    private static bool IsValidEmail(string value)
    {
        try { return new MailAddress(value.Trim()).Address == value.Trim(); }
        catch { return false; }
    }

    private static string NormalizePhone(string value) => Regex.Replace(value.Trim(), "[\\s().-]", "");
    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    [GeneratedRegex(@"^\+?(?:[\d][\s().-]*){8,15}$")]
    private static partial Regex PhonePattern();

    private static OrderRequestListItemDto MapList(OrderRequest x) => new(
        x.Id, x.CustomerName, x.Email, x.PhoneNumber, x.CompanyName, x.ServicePlanId, x.PlanNameSnapshot,
        x.BillingCycle, x.QuotedAmount, x.Currency, x.PromotionCodeSnapshot, x.Status, x.CreatedAt);

    private static OrderRequestDetailDto MapDetail(OrderRequest x) => new(
        x.Id, x.CustomerName, x.Email, x.PhoneNumber, x.CompanyName, x.ServicePlanId, x.PlanNameSnapshot,
        x.SpecificationSnapshot, x.BillingCycle, x.OriginalAmount, x.QuotedAmount, x.Currency,
        x.PromotionCodeSnapshot, x.Status, x.Note, x.CreatedAt, x.UpdatedAt,
        x.StatusHistory.OrderBy(item => item.CreatedAt).Select(item => new OrderStatusHistoryDto(
            item.Id, item.FromStatus, item.ToStatus, item.Note, item.ChangedBy, item.CreatedAt)).ToArray());

    private static CustomerOrderListItemDto MapCustomerList(OrderRequest x) => new(
        x.Id, x.ServicePlanId, x.PlanNameSnapshot, x.BillingCycle, x.QuotedAmount, x.Currency, x.Status, x.CreatedAt);

    private static CustomerOrderDetailDto MapCustomerDetail(OrderRequest x) => new(
        x.Id, x.ServicePlanId, x.PlanNameSnapshot, x.SpecificationSnapshot, x.BillingCycle,
        x.OriginalAmount, x.QuotedAmount, x.Currency, x.Status, x.CreatedAt, x.UpdatedAt,
        x.StatusHistory.OrderBy(item => item.CreatedAt).Select(item => new CustomerOrderStatusHistoryDto(
            item.Id, item.FromStatus, item.ToStatus, item.CreatedAt)).ToArray());
}
