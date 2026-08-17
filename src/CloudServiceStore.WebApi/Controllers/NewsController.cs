using System.Security.Claims;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.News;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1")]
public sealed class NewsController(INewsService newsService, INewsDataSyncService newsDataSyncService) : ControllerBase
{
    [AllowAnonymous]
    [HttpGet("news-categories")]
    public Task<IActionResult> GetPublicCategories([FromQuery] NewsCategoryQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.GetCategoriesAsync(query, true, ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpGet("news-categories/admin")]
    public Task<IActionResult> GetAdminCategories([FromQuery] NewsCategoryQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.GetCategoriesAsync(query, false, ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPost("news-categories")]
    public Task<IActionResult> CreateCategory(CreateNewsCategoryRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.CreateCategoryAsync(request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPut("news-categories/{id:guid}")]
    public Task<IActionResult> UpdateCategory(Guid id, UpdateNewsCategoryRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.UpdateCategoryAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpDelete("news-categories/{id:guid}")]
    public Task<IActionResult> DeleteCategory(Guid id, CancellationToken ct) =>
        Execute(async () => { await newsService.DeleteCategoryAsync(id, GetActorId(), ct); return NoContent(); });

    [AllowAnonymous]
    [HttpGet("news-articles")]
    public Task<IActionResult> GetPublicArticles([FromQuery] NewsArticleQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.GetArticlesAsync(query, true, ct)));

    [AllowAnonymous]
    [HttpGet("news-articles/{slug}")]
    public async Task<IActionResult> GetPublicArticle(string slug, CancellationToken ct) =>
        (await newsService.GetArticleBySlugAsync(slug, true, ct)) is { } item ? Ok(item) : NotFoundProblem();

    [Authorize(Policy = "ManageNews")]
    [HttpGet("news-articles/admin")]
    public Task<IActionResult> GetAdminArticles([FromQuery] NewsArticleQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.GetArticlesAsync(query, false, ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpGet("news-articles/admin/{id:guid}")]
    public async Task<IActionResult> GetAdminArticle(Guid id, CancellationToken ct) =>
        (await newsService.GetArticleByIdAsync(id, ct)) is { } item ? Ok(item) : NotFoundProblem();

    [Authorize(Policy = "ManageNews")]
    [HttpPost("news-articles")]
    public Task<IActionResult> CreateArticle(CreateNewsArticleRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.CreateArticleAsync(request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPut("news-articles/{id:guid}")]
    public Task<IActionResult> UpdateArticle(Guid id, UpdateNewsArticleRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.UpdateArticleAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPatch("news-articles/{id:guid}/publish")]
    public Task<IActionResult> PublishArticle(Guid id, PublishNewsArticleRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.PublishArticleAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPatch("news-articles/{id:guid}/unpublish")]
    public Task<IActionResult> UnpublishArticle(Guid id, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.UnpublishArticleAsync(id, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpPatch("news-articles/{id:guid}/featured")]
    public Task<IActionResult> SetFeaturedArticle(Guid id, SetFeaturedNewsArticleRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsService.SetFeaturedArticleAsync(id, request, GetActorId(), ct)));

    [Authorize(Policy = "ManageNews")]
    [HttpDelete("news-articles/{id:guid}")]
    public Task<IActionResult> DeleteArticle(Guid id, CancellationToken ct) =>
        Execute(async () => { await newsService.DeleteArticleAsync(id, GetActorId(), ct); return NoContent(); });

    [Authorize(Policy = "ManageNews")]
    [HttpPost("news-articles/sync-newsdata")]
    public Task<IActionResult> SyncNewsData(NewsDataSyncRequest request, CancellationToken ct) =>
        Execute(async () => Ok(await newsDataSyncService.SyncAsync(request, GetActorId(), ct)));

    private Guid GetActorId() =>
        Guid.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : throw new UnauthorizedAccessException();

    private ActionResult NotFoundProblem() => Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found");

    private async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (NewsNotFoundException ex) { return Problem(statusCode: StatusCodes.Status404NotFound, title: "Resource not found", detail: ex.Message); }
        catch (NewsConflictException ex) { return Problem(statusCode: StatusCodes.Status409Conflict, title: "Business conflict", detail: ex.Message); }
        catch (NewsValidationException ex) { return Problem(statusCode: StatusCodes.Status400BadRequest, title: "Validation failed", detail: ex.Message); }
        catch (NewsExternalServiceException) { return Problem(statusCode: StatusCodes.Status502BadGateway, title: "News source unavailable", detail: "The external news source could not be reached. Existing news data was kept."); }
    }
}
