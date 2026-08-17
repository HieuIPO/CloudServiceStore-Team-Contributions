using System.Security.Claims;
using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class CatalogController(ICatalogService catalogService, IConfiguration configuration) : ControllerBase
{
    private string PublicBaseUrl => configuration["Frontend:PublicBaseUrl"] ?? "http://localhost:3000";

    [AllowAnonymous]
    [HttpGet("service-categories")]
    public Task<PagedResult<ServiceCategoryDto>> GetCategories([FromQuery] ServiceCategoryQuery query, CancellationToken ct) => catalogService.GetCategoriesAsync(query, ct);

    [AllowAnonymous]
    [HttpGet("service-categories/{id:guid}")]
    public async Task<IActionResult> GetCategory(Guid id, CancellationToken ct) => (await catalogService.GetCategoryAsync(id, ct)) is { } item ? Ok(item) : NotFoundProblem();

    [Authorize(Policy = "ManageCatalog")]
    [HttpPost("service-categories")]
    public Task<IActionResult> CreateCategory(CreateServiceCategoryRequest request, CancellationToken ct) => Execute(async () => { var item = await catalogService.CreateCategoryAsync(request, GetActorId(), ct); return CreatedAtAction(nameof(GetCategory), new { id = item.Id }, item); });

    [Authorize(Policy = "ManageCatalog")]
    [HttpPut("service-categories/{id:guid}")]
    public Task<IActionResult> UpdateCategory(Guid id, UpdateServiceCategoryRequest request, CancellationToken ct) => Execute(async () => Ok(await catalogService.UpdateCategoryAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageCatalog")]
    [HttpDelete("service-categories/{id:guid}")]
    public Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct) => Execute(async () => { await catalogService.DeleteCategoryAsync(id, GetActorId(), ct); return NoContent(); });

    [AllowAnonymous]
    [HttpGet("service-plans")]
    public Task<PagedResult<ServicePlanListItemDto>> GetPlans([FromQuery] ServicePlanQuery query, CancellationToken ct) => catalogService.GetPlansAsync(query, ct);

    [AllowAnonymous]
    [HttpGet("service-plans/{id:guid}")]
    public async Task<IActionResult> GetPlan(Guid id, CancellationToken ct) => (await catalogService.GetPlanAsync(id, ct)) is { } item ? Ok(item) : NotFoundProblem();

    [AllowAnonymous]
    [HttpGet("service-plans/by-slug/{slug}")]
    public async Task<IActionResult> GetPlanBySlug(string slug, CancellationToken ct) => (await catalogService.GetPlanBySlugAsync(slug, ct)) is { } item ? Ok(item) : NotFoundProblem();

    [Authorize(Policy = "ManageCatalog")]
    [HttpPost("service-plans")]
    public Task<IActionResult> CreatePlan(CreateServicePlanRequest request, CancellationToken ct) => Execute(async () => { var item = await catalogService.CreatePlanAsync(request, GetActorId(), ct); return CreatedAtAction(nameof(GetPlan), new { id = item.Id }, item); });

    [Authorize(Policy = "ManageCatalog")]
    [HttpPut("service-plans/{id:guid}")]
    public Task<IActionResult> UpdatePlan(Guid id, UpdateServicePlanRequest request, CancellationToken ct) => Execute(async () => Ok(await catalogService.UpdatePlanAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageCatalog")]
    [HttpDelete("service-plans/{id:guid}")]
    public Task<IActionResult> DeletePlan(Guid id, CancellationToken ct) => Execute(async () => { await catalogService.DeletePlanAsync(id, GetActorId(), ct); return NoContent(); });

    [Authorize(Policy = "ManagePricing")]
    [HttpPost("service-plans/{planId:guid}/prices")]
    public Task<IActionResult> CreatePrice(Guid planId, CreatePlanPriceRequest request, CancellationToken ct) => Execute(async () => Ok(await catalogService.CreatePriceAsync(planId, request, GetActorId(), ct)));

    [Authorize(Policy = "ManagePricing")]
    [HttpPatch("plan-prices/{priceId:guid}/effective-to")]
    public Task<IActionResult> ClosePrice(Guid priceId, ClosePlanPriceRequest request, CancellationToken ct) => Execute(async () => Ok(await catalogService.ClosePriceAsync(priceId, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageQrCodes")]
    [HttpPost("service-plans/{planId:guid}/qr-code")]
    public Task<IActionResult> GenerateQrCode(Guid planId, CancellationToken ct) =>
        Execute(async () => Ok(await catalogService.GenerateQrCodeAsync(planId, PublicBaseUrl, GetActorId(), ct)));

    [AllowAnonymous]
    [HttpGet("service-plans/{planId:guid}/qr-code/image")]
    public Task<IActionResult> GetQrCodeImage(Guid planId, CancellationToken ct) =>
        Execute(async () =>
        {
            var image = await catalogService.GetQrCodeImageAsync(planId, PublicBaseUrl, ct);
            return File(image.Content, image.ContentType);
        });

    private Guid GetActorId() => Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();
    private ActionResult NotFoundProblem() => Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");
    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (CatalogNotFoundException ex) { return Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: ex.Message); }
        catch (CatalogConflictException ex) { return Problem(statusCode: StatusCodes.Status409Conflict, title: "Business conflict", detail: ex.Message); }
        catch (CatalogValidationException ex) { return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: ex.Message); }
    }
}
