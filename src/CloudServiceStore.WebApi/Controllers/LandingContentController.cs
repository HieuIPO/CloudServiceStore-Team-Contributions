using System.Security.Claims;
using CloudServiceStore.Application.Landing;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class LandingContentController(ILandingContentService landingContentService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("landing-content")]
    public async Task<IActionResult> GetPublic(CancellationToken cancellationToken) =>
        (await landingContentService.GetPublicAsync(cancellationToken)) is { } content
            ? Ok(content)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Landing content is not published");

    [Authorize(Policy = "ManageLandingContent")]
    [HttpGet("landing-content/admin")]
    public Task<IActionResult> GetAdmin(CancellationToken cancellationToken) =>
        Execute(async () => Ok(await landingContentService.GetAdminAsync(cancellationToken)));

    [Authorize(Policy = "ManageLandingContent")]
    [HttpPut("landing-content")]
    public Task<IActionResult> UpdateContent(UpdateLandingPageContentRequest request, CancellationToken cancellationToken) =>
        Execute(async () => Ok(await landingContentService.UpdateContentAsync(request, GetActorId(), cancellationToken)));

    [Authorize(Policy = "ManageLandingContent")]
    [HttpPost("testimonials")]
    public Task<IActionResult> CreateTestimonial(CreateTestimonialRequest request, CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            var item = await landingContentService.CreateTestimonialAsync(request, GetActorId(), cancellationToken);
            return Created($"/api/v1/testimonials/{item.Id}", item);
        });

    [Authorize(Policy = "ManageLandingContent")]
    [HttpPut("testimonials/{id:guid}")]
    public Task<IActionResult> UpdateTestimonial(Guid id, UpdateTestimonialRequest request, CancellationToken cancellationToken) =>
        Execute(async () => Ok(await landingContentService.UpdateTestimonialAsync(id, request, GetActorId(), cancellationToken)));

    [Authorize(Policy = "ManageLandingContent")]
    [HttpDelete("testimonials/{id:guid}")]
    public Task<IActionResult> DeleteTestimonial(Guid id, CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await landingContentService.DeleteTestimonialAsync(id, GetActorId(), cancellationToken);
            return NoContent();
        });

    [Authorize(Policy = "ManageLandingContent")]
    [HttpPost("customer-logos")]
    public Task<IActionResult> CreateCustomerLogo(CreateCustomerLogoRequest request, CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            var item = await landingContentService.CreateCustomerLogoAsync(request, GetActorId(), cancellationToken);
            return Created($"/api/v1/customer-logos/{item.Id}", item);
        });

    [Authorize(Policy = "ManageLandingContent")]
    [HttpPut("customer-logos/{id:guid}")]
    public Task<IActionResult> UpdateCustomerLogo(Guid id, UpdateCustomerLogoRequest request, CancellationToken cancellationToken) =>
        Execute(async () => Ok(await landingContentService.UpdateCustomerLogoAsync(id, request, GetActorId(), cancellationToken)));

    [Authorize(Policy = "ManageLandingContent")]
    [HttpDelete("customer-logos/{id:guid}")]
    public Task<IActionResult> DeleteCustomerLogo(Guid id, CancellationToken cancellationToken) =>
        Execute(async () =>
        {
            await landingContentService.DeleteCustomerLogoAsync(id, GetActorId(), cancellationToken);
            return NoContent();
        });

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private static async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (LandingContentNotFoundException exception)
        {
            return ProblemResult(StatusCodes.Status404NotFound, "Resource not found", exception.Message);
        }
        catch (LandingContentConflictException exception)
        {
            return ProblemResult(StatusCodes.Status409Conflict, "Business conflict", exception.Message);
        }
        catch (LandingContentValidationException exception)
        {
            return ProblemResult(StatusCodes.Status400BadRequest, "Validation failed", exception.Message);
        }
    }

    private static ObjectResult ProblemResult(int status, string title, string detail) =>
        new(new ProblemDetails { Status = status, Title = title, Detail = detail }) { StatusCode = status };
}
