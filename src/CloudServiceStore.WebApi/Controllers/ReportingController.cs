using System.Security.Claims;
using CloudServiceStore.Application.Reporting;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class ReportingController(IReportingService reportingService) : ControllerBase
{
    [Authorize(Policy = "ViewDashboard")]
    [HttpGet("dashboard/order-summary")]
    public Task<IActionResult> GetOrderSummary([FromQuery] ReportingPeriodQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await reportingService.GetOrderSummaryAsync(query, ct)));

    [Authorize(Policy = "ViewDashboard")]
    [HttpGet("dashboard/popular-plans")]
    public Task<IActionResult> GetPopularPlans([FromQuery] ReportingPeriodQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await reportingService.GetPopularPlansAsync(query, ct)));

    [Authorize(Policy = "ViewDashboard")]
    [HttpGet("dashboard/service-interest")]
    public Task<IActionResult> GetServiceInterest([FromQuery] ReportingPeriodQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await reportingService.GetServiceInterestAsync(query, ct)));

    [Authorize(Policy = "ViewAuditLogs")]
    [HttpGet("audit-logs")]
    public Task<IActionResult> GetAuditLogs([FromQuery] AuditLogQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await reportingService.GetAuditLogsAsync(query, ct)));

    [Authorize(Policy = "ExportOrders")]
    [HttpGet("exports/order-requests.xlsx")]
    public Task<IActionResult> ExportOrders([FromQuery] OrderExportQuery query, CancellationToken ct) =>
        Execute(async () =>
        {
            var file = await reportingService.ExportOrdersAsync(query, GetActorId(), HttpContext.Connection.RemoteIpAddress?.ToString(), ct);
            return File(file.Content, file.ContentType, file.FileName);
        });

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private static async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (ReportingValidationException ex)
        {
            return new ObjectResult(new ProblemDetails { Status = 400, Title = "Validation failed", Detail = ex.Message })
                { StatusCode = StatusCodes.Status400BadRequest };
        }
    }
}
