using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class ReportingServiceTests
{
    [Fact]
    public async Task GetOrderSummary_ReversedPeriod_ThrowsValidation()
    {
        var service = CreateService(out _, out _);

        await Assert.ThrowsAsync<ReportingValidationException>(() =>
            service.GetOrderSummaryAsync(new(DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddDays(-1)), default));
    }

    [Fact]
    public async Task GetAuditLogs_InvalidPage_ThrowsValidation()
    {
        var service = CreateService(out _, out _);

        await Assert.ThrowsAsync<ReportingValidationException>(() =>
            service.GetAuditLogsAsync(new(Page: 0), default));
    }

    [Fact]
    public async Task ExportOrders_RangeOverOneYear_ThrowsValidation()
    {
        var service = CreateService(out _, out _);

        await Assert.ThrowsAsync<ReportingValidationException>(() =>
            service.ExportOrdersAsync(new(DateTimeOffset.UtcNow.AddDays(-367), DateTimeOffset.UtcNow), Guid.NewGuid(), null, default));
    }

    [Fact]
    public async Task ExportOrders_ValidRows_CreatesWorkbookAndAudit()
    {
        var service = CreateService(out var repository, out var exporter);
        var actorId = Guid.NewGuid();
        var rows = new[]
        {
            new OrderExportRow(Guid.NewGuid(), DateTimeOffset.UtcNow, "Customer", "a@example.com", "0901234567",
                null, "VPS Starter", BillingCycle.Monthly, 100000, 90000, "VND", "SAVE10",
                OrderRequestStatus.Approved, null)
        };
        repository.Setup(x => x.GetOrderExportRowsAsync(It.IsAny<OrderExportQuery>(), default)).ReturnsAsync(rows);
        exporter.Setup(x => x.CreateOrderWorkbook(rows)).Returns([0x50, 0x4b, 0x03, 0x04]);

        var result = await service.ExportOrdersAsync(new(), actorId, "127.0.0.1", default);

        Assert.EndsWith(".xlsx", result.FileName);
        Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", result.ContentType);
        Assert.Equal(4, result.Content.Length);
        repository.Verify(x => x.AddExportAudit(actorId, 1, "127.0.0.1"), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(default), Times.Once);
    }

    [Fact]
    public async Task GetPopularPlans_ValidPeriod_ReturnsRepositoryResult()
    {
        var service = CreateService(out var repository, out _);
        var expected = new[] { new PopularPlanDto("VPS Starter", 3, 270000) };
        repository.Setup(x => x.GetPopularPlansAsync(It.IsAny<DateTimeOffset>(), It.IsAny<DateTimeOffset>(), default))
            .ReturnsAsync(expected);

        var result = await service.GetPopularPlansAsync(new(), default);

        Assert.Same(expected, result);
    }

    private static ReportingService CreateService(
        out Mock<IReportingRepository> repository,
        out Mock<IExcelExportService> exporter)
    {
        repository = new Mock<IReportingRepository>();
        exporter = new Mock<IExcelExportService>();
        return new ReportingService(repository.Object, exporter.Object);
    }
}
