using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Reporting;

public sealed record ReportingPeriodQuery(DateTimeOffset? From = null, DateTimeOffset? To = null);
public sealed record OrderExportQuery(DateTimeOffset? From = null, DateTimeOffset? To = null, OrderRequestStatus? Status = null);
public sealed record AuditLogQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    string? Action = null,
    string? EntityName = null,
    DateTimeOffset? From = null,
    DateTimeOffset? To = null);

public sealed record NamedCountDto(string Name, int Count);
public sealed record MonthlyOrderDto(int Year, int Month, int Count, decimal QuotedAmount, int ApprovedCount);
public sealed record OrderSummaryDto(
    DateTimeOffset From,
    DateTimeOffset To,
    int TotalOrders,
    int PeriodOrders,
    int PendingOrders,
    int ApprovedOrders,
    decimal ApprovedQuotedAmount,
    int TotalAffiliateApplications,
    int PendingAffiliateApplications,
    int PublishedNewsArticles,
    IReadOnlyList<NamedCountDto> Statuses,
    IReadOnlyList<MonthlyOrderDto> MonthlyOrders);
public sealed record PopularPlanDto(string PlanName, int OrderCount, decimal QuotedAmount);
public sealed record ServiceInterestDto(string ServiceName, int OrderCount);

public sealed record AuditLogDto(
    Guid Id,
    Guid? ActorId,
    string? ActorEmail,
    string Action,
    string EntityName,
    Guid? EntityId,
    string? OldValuesJson,
    string? NewValuesJson,
    string? IpAddress,
    DateTimeOffset OccurredAt);

public sealed record OrderExportRow(
    Guid Id,
    DateTimeOffset CreatedAt,
    string CustomerName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string PlanName,
    BillingCycle BillingCycle,
    decimal OriginalAmount,
    decimal QuotedAmount,
    string Currency,
    string? PromotionCode,
    OrderRequestStatus Status,
    string? Note);

public sealed record ExportedFileDto(byte[] Content, string ContentType, string FileName);

public interface IReportingService
{
    Task<OrderSummaryDto> GetOrderSummaryAsync(ReportingPeriodQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<PopularPlanDto>> GetPopularPlansAsync(ReportingPeriodQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<ServiceInterestDto>> GetServiceInterestAsync(ReportingPeriodQuery query, CancellationToken cancellationToken);
    Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogQuery query, CancellationToken cancellationToken);
    Task<ExportedFileDto> ExportOrdersAsync(OrderExportQuery query, Guid actorId, string? ipAddress, CancellationToken cancellationToken);
}
