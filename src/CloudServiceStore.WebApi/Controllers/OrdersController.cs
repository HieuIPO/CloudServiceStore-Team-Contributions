using System.Security.Claims;
using CloudServiceStore.Application.Orders;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1/orders")]
public sealed class OrdersController(IOrderService orderService) : ControllerBase
{
    [Authorize(Roles = "Customer")]
    [HttpPost]
    public Task<IActionResult> Create(CreateOrderRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await orderService.CreateAsync(request, GetIpAddress(), ct, GetCustomerOwner());
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        });

    [Authorize(Policy = "ManageOrders")]
    [HttpGet]
    public Task<IActionResult> Get([FromQuery] OrderRequestQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await orderService.GetAsync(query, ct)));

    [Authorize(Policy = "ManageOrders")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        (await orderService.GetByIdAsync(id, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManageOrders")]
    [HttpPatch("{id:guid}/status")]
    public Task<IActionResult> UpdateStatus(Guid id, UpdateOrderStatusRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await orderService.UpdateStatusAsync(id, request, GetActorId(), GetIpAddress(), ct)));

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private OrderRequestOwner GetCustomerOwner()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            throw new UnauthorizedAccessException();

        var fullName = User.FindFirstValue(ClaimTypes.Name);
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email))
            throw new UnauthorizedAccessException();
        return new OrderRequestOwner(userId, fullName, email);
    }

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (OrderNotFoundException ex) { return Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: ex.Message); }
        catch (OrderConflictException ex) { return Problem(statusCode: StatusCodes.Status409Conflict, title: "Business conflict", detail: ex.Message); }
        catch (OrderValidationException ex) { return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: ex.Message); }
    }
}
