using System.Security.Claims;
using CloudServiceStore.Application.Affiliates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class AffiliatesController(IAffiliateService affiliateService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("affiliate-program")]
    public async Task<IActionResult> GetPublicProgram(CancellationToken ct) =>
        (await affiliateService.GetProgramContentAsync(true, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManageAffiliateProgram")]
    [HttpGet("affiliate-program/admin")]
    public async Task<IActionResult> GetAdminProgram(CancellationToken ct) =>
        (await affiliateService.GetProgramContentAsync(false, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManageAffiliateProgram")]
    [HttpPut("affiliate-program")]
    public Task<IActionResult> UpdateProgram(UpdateAffiliateProgramContentRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await affiliateService.UpdateProgramContentAsync(request, GetActorId(), ct)));

    [Authorize(Roles = "Customer")]
    [HttpPost("affiliate-applications")]
    public Task<IActionResult> CreateApplication(CreateAffiliateApplicationRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var result = await affiliateService.CreateApplicationAsync(request, GetCustomerOwner(), GetIpAddress(), ct);
            return Created($"/api/v1/account/affiliates/{result.Id}", result);
        });

    [Authorize(Policy = "ManageAffiliates")]
    [HttpGet("affiliate-applications")]
    public Task<IActionResult> GetApplications([FromQuery] AffiliateApplicationQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await affiliateService.GetApplicationsAsync(query, ct)));

    [Authorize(Policy = "ManageAffiliates")]
    [HttpGet("affiliate-applications/{id:guid}")]
    public async Task<IActionResult> GetApplication(Guid id, CancellationToken ct) =>
        (await affiliateService.GetApplicationAsync(id, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManageAffiliates")]
    [HttpPatch("affiliate-applications/{id:guid}/status")]
    public Task<IActionResult> UpdateStatus(Guid id, UpdateAffiliateStatusRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await affiliateService.UpdateStatusAsync(id, request, GetActorId(), GetIpAddress(), ct)));

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private AffiliateApplicationOwner GetCustomerOwner()
    {
        if (!Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var userId))
            throw new UnauthorizedAccessException();

        var fullName = User.FindFirstValue(ClaimTypes.Name);
        var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirst("email")?.Value;
        if (string.IsNullOrWhiteSpace(fullName) || string.IsNullOrWhiteSpace(email))
            throw new UnauthorizedAccessException();
        return new AffiliateApplicationOwner(userId, fullName, email);
    }

    private string? GetIpAddress() => HttpContext.Connection.RemoteIpAddress?.ToString();

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (AffiliateNotFoundException ex) { return Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: ex.Message); }
        catch (AffiliateConflictException ex) { return Problem(statusCode: StatusCodes.Status409Conflict, title: "Business conflict", detail: ex.Message); }
        catch (AffiliateValidationException ex) { return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: ex.Message); }
    }
}
