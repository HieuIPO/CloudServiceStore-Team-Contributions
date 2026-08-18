using System.Security.Claims;
using CloudServiceStore.Application.ContactRequests;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1/contact-requests")]
public sealed class ContactRequestsController(IContactRequestService contactRequestService) : ControllerBase
{
    [AllowAnonymous]
    [HttpPost]
    public Task<IActionResult> Create(CreateContactRequestRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await contactRequestService.CreateAsync(request, GetOptionalActorId(), GetIpAddress(), ct);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        });

    [Authorize(Policy = "ManageContactRequests")]
    [HttpGet]
    public Task<IActionResult> Get([FromQuery] ContactRequestQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await contactRequestService.GetAsync(query, ct)));

    [Authorize(Policy = "ManageContactRequests")]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct) =>
        (await contactRequestService.GetByIdAsync(id, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManageContactRequests")]
    [HttpPatch("{id:guid}/status")]
    public Task<IActionResult> UpdateStatus(Guid id, UpdateContactRequestStatusRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await contactRequestService.UpdateStatusAsync(id, request, GetActorId(), GetIpAddress(), ct)));

    private Guid? GetOptionalActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (ContactRequestNotFoundException ex) { return Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: ex.Message); }
        catch (ContactRequestConflictException ex) { return Problem(statusCode: StatusCodes.Status409Conflict, title: "Business conflict", detail: ex.Message); }
        catch (ContactRequestValidationException ex) { return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: ex.Message); }
    }
}
