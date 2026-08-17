using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Orders;

public sealed record CreateOrderRequest(
    Guid ServicePlanId,
    string CustomerName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    BillingCycle BillingCycle,
    string? Note);

public sealed record OrderRequestOwner(Guid UserId, string FullName, string Email);

public sealed record OrderRequestQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    Guid? ServicePlanId = null,
    OrderRequestStatus? Status = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null,
    string? SortBy = null,
    string? SortDirection = null);

public sealed record UpdateOrderStatusRequest(OrderRequestStatus Status, string? Note);

public sealed record OrderConfirmationDto(
    Guid Id,
    OrderRequestStatus Status,
    string PlanName,
    BillingCycle BillingCycle,
    decimal QuotedAmount,
    string Currency,
    DateTimeOffset CreatedAt);

public sealed record OrderRequestListItemDto(
    Guid Id,
    string CustomerName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    Guid ServicePlanId,
    string PlanName,
    BillingCycle BillingCycle,
    decimal QuotedAmount,
    string Currency,
    string? PromotionCode,
    OrderRequestStatus Status,
    DateTimeOffset CreatedAt);

public sealed record OrderStatusHistoryDto(
    Guid Id,
    OrderRequestStatus FromStatus,
    OrderRequestStatus ToStatus,
    string? Note,
    Guid? ChangedBy,
    DateTimeOffset CreatedAt);

public sealed record OrderRequestDetailDto(
    Guid Id,
    string CustomerName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    Guid ServicePlanId,
    string PlanName,
    string SpecificationSnapshot,
    BillingCycle BillingCycle,
    decimal OriginalAmount,
    decimal QuotedAmount,
    string Currency,
    string? PromotionCode,
    OrderRequestStatus Status,
    string? Note,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<OrderStatusHistoryDto> StatusHistory);

public sealed record CustomerOrderQuery(
    int Page = 1,
    int PageSize = 20,
    OrderRequestStatus? Status = null);

public sealed record CustomerOrderListItemDto(
    Guid Id,
    Guid ServicePlanId,
    string PlanName,
    BillingCycle BillingCycle,
    decimal QuotedAmount,
    string Currency,
    OrderRequestStatus Status,
    DateTimeOffset CreatedAt);

public sealed record CustomerOrderStatusHistoryDto(
    Guid Id,
    OrderRequestStatus FromStatus,
    OrderRequestStatus ToStatus,
    DateTimeOffset CreatedAt);

public sealed record CustomerOrderDetailDto(
    Guid Id,
    Guid ServicePlanId,
    string PlanName,
    string SpecificationSnapshot,
    BillingCycle BillingCycle,
    decimal OriginalAmount,
    decimal QuotedAmount,
    string Currency,
    OrderRequestStatus Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    IReadOnlyList<CustomerOrderStatusHistoryDto> StatusHistory);

public interface IOrderService
{
    Task<OrderConfirmationDto> CreateAsync(CreateOrderRequest request, string? ipAddress, CancellationToken cancellationToken, OrderRequestOwner? owner = null);
    Task<PagedResult<OrderRequestListItemDto>> GetAsync(OrderRequestQuery query, CancellationToken cancellationToken);
    Task<OrderRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<PagedResult<CustomerOrderListItemDto>> GetCustomerOrdersAsync(Guid userId, CustomerOrderQuery query, CancellationToken cancellationToken);
    Task<CustomerOrderDetailDto?> GetCustomerOrderByIdAsync(Guid userId, Guid id, CancellationToken cancellationToken);
    Task<OrderRequestDetailDto> UpdateStatusAsync(Guid id, UpdateOrderStatusRequest request, Guid actorId, string? ipAddress, CancellationToken cancellationToken);
}
