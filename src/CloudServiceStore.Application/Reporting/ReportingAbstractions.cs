namespace CloudServiceStore.Application.Reporting;

public interface IReportingRepository
{
    Task<OrderSummaryDto> GetOrderSummaryAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
    Task<IReadOnlyList<PopularPlanDto>> GetPopularPlansAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
    Task<IReadOnlyList<ServiceInterestDto>> GetServiceInterestAsync(DateTimeOffset from, DateTimeOffset to, CancellationToken cancellationToken);
    Task<(IReadOnlyList<AuditLogDto> Items, int Total)> GetAuditLogsAsync(AuditLogQuery query, CancellationToken cancellationToken);
    Task<IReadOnlyList<OrderExportRow>> GetOrderExportRowsAsync(OrderExportQuery query, CancellationToken cancellationToken);
    void AddExportAudit(Guid actorId, int rowCount, string? ipAddress);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public interface IExcelExportService
{
    byte[] CreateOrderWorkbook(IReadOnlyList<OrderExportRow> rows);
}

public sealed class ReportingValidationException(string message) : Exception(message);
