using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Orders;

public interface IOrderRepository
{
    Task<ServicePlan?> FindPlanForOrderAsync(Guid planId, CancellationToken cancellationToken);
    Task<bool> HasRecentDuplicateAsync(string email, string phoneNumber, Guid planId, DateTimeOffset createdAfter, CancellationToken cancellationToken);
    Task<(IReadOnlyList<OrderRequest> Items, int Total)> GetAsync(OrderRequestQuery query, CancellationToken cancellationToken);
    Task<(IReadOnlyList<OrderRequest> Items, int Total)> GetForCustomerAsync(Guid userId, CustomerOrderQuery query, CancellationToken cancellationToken);
    Task<OrderRequest?> FindAsync(Guid id, CancellationToken cancellationToken);
    Task<OrderRequest?> FindForCustomerAsync(Guid id, Guid userId, CancellationToken cancellationToken);
    void Add(OrderRequest orderRequest);
    void AddStatusHistory(OrderRequestStatusHistory history);
    void AddAudit(Guid? actorId, string action, string entityName, Guid entityId, string? oldValuesJson, string? newValuesJson, string? ipAddress);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class OrderNotFoundException(string message) : Exception(message);
public sealed class OrderConflictException(string message) : Exception(message);
public sealed class OrderValidationException(string message) : Exception(message);
