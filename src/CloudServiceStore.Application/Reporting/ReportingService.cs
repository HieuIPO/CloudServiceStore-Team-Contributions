using CloudServiceStore.Application.Common;

namespace CloudServiceStore.Application.Reporting;

public sealed class ReportingService(
    IReportingRepository repository,
    IExcelExportService excelExportService,
    TimeProvider? timeProvider = null) : IReportingService
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;

    public Task<OrderSummaryDto> GetOrderSummaryAsync(ReportingPeriodQuery query, CancellationToken ct)
    {
        var period = ResolvePeriod(query.From, query.To, 730);
        return repository.GetOrderSummaryAsync(period.From, period.To, ct);
    }

    public Task<IReadOnlyList<PopularPlanDto>> GetPopularPlansAsync(ReportingPeriodQuery query, CancellationToken ct)
    {
        var period = ResolvePeriod(query.From, query.To, 730);
        return repository.GetPopularPlansAsync(period.From, period.To, ct);
    }

    public Task<IReadOnlyList<ServiceInterestDto>> GetServiceInterestAsync(ReportingPeriodQuery query, CancellationToken ct)
    {
        var period = ResolvePeriod(query.From, query.To, 730);
        return repository.GetServiceInterestAsync(period.From, period.To, ct);
    }

    public async Task<PagedResult<AuditLogDto>> GetAuditLogsAsync(AuditLogQuery query, CancellationToken ct)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new ReportingValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Search?.Trim().Length > 256 || query.Action?.Trim().Length > 120 || query.EntityName?.Trim().Length > 120)
            throw new ReportingValidationException("Audit filters exceed the supported length.");
        ValidateOptionalPeriod(query.From, query.To, 730);
        var result = await repository.GetAuditLogsAsync(query, ct);
        return new(result.Items, query.Page, query.PageSize, result.Total);
    }

    public async Task<ExportedFileDto> ExportOrdersAsync(OrderExportQuery query, Guid actorId, string? ipAddress, CancellationToken ct)
    {
        ValidateOptionalPeriod(query.From, query.To, 366);
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new ReportingValidationException("Order status is not supported.");

        var rows = await repository.GetOrderExportRowsAsync(query, ct);
        var content = excelExportService.CreateOrderWorkbook(rows);
        repository.AddExportAudit(actorId, rows.Count, ipAddress);
        await repository.SaveChangesAsync(ct);
        var fileName = $"order-requests-{clock.GetUtcNow():yyyyMMdd-HHmmss}.xlsx";
        return new(content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
    }

    private (DateTimeOffset From, DateTimeOffset To) ResolvePeriod(DateTimeOffset? from, DateTimeOffset? to, int maximumDays)
    {
        var resolvedTo = to ?? clock.GetUtcNow();
        var resolvedFrom = from ?? resolvedTo.AddMonths(-12);
        ValidateOptionalPeriod(resolvedFrom, resolvedTo, maximumDays);
        return (resolvedFrom, resolvedTo);
    }

    private static void ValidateOptionalPeriod(DateTimeOffset? from, DateTimeOffset? to, int maximumDays)
    {
        if (from is null || to is null) return;
        if (to < from) throw new ReportingValidationException("To must be on or after From.");
        if (to - from > TimeSpan.FromDays(maximumDays))
            throw new ReportingValidationException($"Date range must not exceed {maximumDays} days.");
    }
}
