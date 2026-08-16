using System.Security.Claims;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.Promotions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1/promotions")]
public sealed class PromotionsController(IPromotionService promotionService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet]
    public Task<PagedResult<PromotionDto>> GetPromotions([FromQuery] PromotionQuery query, CancellationToken ct) =>
        promotionService.GetPromotionsAsync(query, ct);

    [AllowAnonymous]
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPromotion(Guid id, CancellationToken ct) =>
        (await promotionService.GetPromotionAsync(id, ct)) is { } item
            ? Ok(item)
            : Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    [Authorize(Policy = "ManagePromotions")]
    [HttpPost]
    public Task<IActionResult> CreatePromotion(CreatePromotionRequest request, CancellationToken ct) =>
        Execute(async () =>
        {
            var item = await promotionService.CreatePromotionAsync(request, GetActorId(), ct);
            return CreatedAtAction(nameof(GetPromotion), new { id = item.Id }, item);
        });

    [Authorize(Policy = "ManagePromotions")]
    [HttpPut("{id:guid}")]
    public Task<IActionResult> UpdatePromotion(Guid id, UpdatePromotionRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await promotionService.UpdatePromotionAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManagePromotions")]
    [HttpDelete("{id:guid}")]
    public Task<IActionResult> DeletePromotion(Guid id, CancellationToken ct) =>
        Execute(async () =>
        {
            await promotionService.DeletePromotionAsync(id, GetActorId(), ct);
            return NoContent();
        });

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id)
            ? id
            : throw new UnauthorizedAccessException();

    private static async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (PromotionNotFoundException ex) { return ProblemResult(StatusCodes.Status404NotFound, "Resource not found", ex.Message); }
        catch (PromotionConflictException ex) { return ProblemResult(StatusCodes.Status409Conflict, "Business conflict", ex.Message); }
        catch (PromotionValidationException ex) { return ProblemResult(StatusCodes.Status400BadRequest, "Validation failed", ex.Message); }
    }

    private static ObjectResult ProblemResult(int status, string title, string detail) =>
        new(new ProblemDetails { Status = status, Title = title, Detail = detail }) { StatusCode = status };
}
