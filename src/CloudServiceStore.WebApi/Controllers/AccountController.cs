using System.Security.Claims;
using CloudServiceStore.Application.Affiliates;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Authorize(Roles = "Customer")]
[Route("api/v1/account")]
public sealed class AccountController(IOrderService orderService, IAffiliateService affiliateService) : ControllerBase
{
    [HttpGet("orders")]
    [ProducesResponseType<PagedResult<CustomerOrderListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetOrders([FromQuery] CustomerOrderQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try
        {
            return Ok(await orderService.GetCustomerOrdersAsync(userId, query, cancellationToken));
        }
        catch (OrderValidationException exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: exception.Message);
        }
    }

    [HttpGet("orders/{id:guid}")]
    [ProducesResponseType<CustomerOrderDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrder(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await orderService.GetCustomerOrderByIdAsync(userId, id, cancellationToken);
        return result is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found")
            : Ok(result);
    }

    [HttpGet("affiliates")]
    [ProducesResponseType<PagedResult<CustomerAffiliateApplicationListItemDto>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAffiliates([FromQuery] CustomerAffiliateQuery query, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        try
        {
            return Ok(await affiliateService.GetCustomerApplicationsAsync(userId, query, cancellationToken));
        }
        catch (AffiliateValidationException exception)
        {
            return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: exception.Message);
        }
    }

    [HttpGet("affiliates/{id:guid}")]
    [ProducesResponseType<CustomerAffiliateApplicationDetailDto>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAffiliate(Guid id, CancellationToken cancellationToken)
    {
        if (!TryGetUserId(out var userId)) return Unauthorized();
        var result = await affiliateService.GetCustomerApplicationAsync(userId, id, cancellationToken);
        return result is null
            ? Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found")
            : Ok(result);
    }

    private bool TryGetUserId(out Guid userId) => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out userId);
}
