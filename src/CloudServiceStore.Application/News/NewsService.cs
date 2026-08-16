using System.Text.RegularExpressions;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.News;

public sealed class NewsService(INewsRepository repository) : INewsService
{
    private static readonly IReadOnlySet<string> CategorySortFields =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "name", "displayOrder", "createdAt" };
    private static readonly IReadOnlySet<string> ArticleSortFields =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "title", "isFeatured", "publishedAt", "createdAt" };

    public async Task<PagedResult<NewsCategoryDto>> GetCategoriesAsync(NewsCategoryQuery query, bool publicOnly, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection, CategorySortFields,
            message => new NewsValidationException(message));
        var result = await repository.GetCategoriesAsync(query, publicOnly, ct);
        return new(result.Items.Select(Map).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<NewsCategoryDto> CreateCategoryAsync(CreateNewsCategoryRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateCategory(request.Name, request.Slug);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, null, ct)) throw new NewsConflictException("News category slug already exists.");
        var entity = new NewsCategory { Name = request.Name.Trim(), Slug = slug, Description = CleanOptional(request.Description), DisplayOrder = request.DisplayOrder, IsActive = request.IsActive, CreatedBy = actorId };
        repository.AddCategory(entity);
        repository.AddAudit(actorId, "News.CategoryCreated", nameof(NewsCategory), entity.Id);
        await repository.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task<NewsCategoryDto> UpdateCategoryAsync(Guid id, UpdateNewsCategoryRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateCategory(request.Name, request.Slug);
        var entity = await repository.FindCategoryAsync(id, ct) ?? throw new NewsNotFoundException("News category was not found.");
        var slug = NormalizeSlug(request.Slug);
        if (await repository.CategorySlugExistsAsync(slug, id, ct)) throw new NewsConflictException("News category slug already exists.");
        entity.Name = request.Name.Trim();
        entity.Slug = slug;
        entity.Description = CleanOptional(request.Description);
        entity.DisplayOrder = request.DisplayOrder;
        entity.IsActive = request.IsActive;
        entity.UpdatedBy = actorId;
        repository.AddAudit(actorId, "News.CategoryUpdated", nameof(NewsCategory), id);
        await repository.SaveChangesAsync(ct);
        return Map(entity);
    }

    public async Task DeleteCategoryAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var entity = await repository.FindCategoryAsync(id, ct) ?? throw new NewsNotFoundException("News category was not found.");
        if (await repository.CategoryHasArticlesAsync(id, ct)) throw new NewsConflictException("A news category with articles cannot be deleted.");
        SoftDelete(entity, actorId);
        repository.AddAudit(actorId, "News.CategoryDeleted", nameof(NewsCategory), id);
        await repository.SaveChangesAsync(ct);
    }

    public async Task<PagedResult<NewsArticleListItemDto>> GetArticlesAsync(NewsArticleQuery query, bool publicOnly, CancellationToken ct)
    {
        ValidatePage(query.Page, query.PageSize);
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection, ArticleSortFields,
            message => new NewsValidationException(message));
        var result = await repository.GetArticlesAsync(query, publicOnly, ct);
        return new(result.Items.Select(MapList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<NewsArticleDetailDto?> GetArticleBySlugAsync(string slug, bool publicOnly, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(slug)) return null;
        var article = await repository.FindArticleBySlugAsync(NormalizeSlug(slug), publicOnly, ct);
        if (article is null) return null;
        if (publicOnly && (article.Status != NewsArticleStatus.Published || article.PublishedAt is null || article.PublishedAt > DateTimeOffset.UtcNow)) return null;
        return MapDetail(article);
    }

    public async Task<NewsArticleDetailDto?> GetArticleByIdAsync(Guid id, CancellationToken ct) =>
        (await repository.FindArticleAsync(id, ct)) is { } article ? MapDetail(article) : null;

    public async Task<NewsArticleDetailDto> CreateArticleAsync(CreateNewsArticleRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateArticle(request.CategoryId, request.Title, request.Slug, request.Excerpt, request.MarkdownContent, request.ThumbnailUrl);
        var category = await EnsureActiveCategoryAsync(request.CategoryId, ct);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.ArticleSlugExistsAsync(slug, null, ct)) throw new NewsConflictException("News article slug already exists.");
        var entity = new NewsArticle
        {
            CategoryId = request.CategoryId,
            Category = category,
            Title = request.Title.Trim(),
            Slug = slug,
            Excerpt = request.Excerpt.Trim(),
            MarkdownContent = request.MarkdownContent.Trim(),
            ThumbnailUrl = CleanOptional(request.ThumbnailUrl),
            Status = NewsArticleStatus.Draft,
            CreatedBy = actorId
        };
        repository.AddArticle(entity);
        repository.AddAudit(actorId, "News.ArticleCreated", nameof(NewsArticle), entity.Id);
        await repository.SaveChangesAsync(ct);
        return MapDetail(entity);
    }

    public async Task<NewsArticleDetailDto> UpdateArticleAsync(Guid id, UpdateNewsArticleRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateArticle(request.CategoryId, request.Title, request.Slug, request.Excerpt, request.MarkdownContent, request.ThumbnailUrl);
        var entity = await repository.FindArticleAsync(id, ct) ?? throw new NewsNotFoundException("News article was not found.");
        if (entity.Status == NewsArticleStatus.Published && string.IsNullOrWhiteSpace(request.MarkdownContent)) throw new NewsValidationException("A published news article cannot have empty Markdown content.");
        var category = await EnsureActiveCategoryAsync(request.CategoryId, ct);
        var slug = NormalizeSlug(request.Slug);
        if (await repository.ArticleSlugExistsAsync(slug, id, ct)) throw new NewsConflictException("News article slug already exists.");
        entity.CategoryId = request.CategoryId;
        entity.Category = category;
        entity.Title = request.Title.Trim();
        entity.Slug = slug;
        entity.Excerpt = request.Excerpt.Trim();
        entity.MarkdownContent = request.MarkdownContent.Trim();
        entity.ThumbnailUrl = CleanOptional(request.ThumbnailUrl);
        entity.UpdatedBy = actorId;
        repository.AddAudit(actorId, "News.ArticleUpdated", nameof(NewsArticle), id);
        await repository.SaveChangesAsync(ct);
        return MapDetail(entity);
    }

    public async Task<NewsArticleDetailDto> PublishArticleAsync(Guid id, PublishNewsArticleRequest request, Guid actorId, CancellationToken ct)
    {
        var entity = await repository.FindArticleAsync(id, ct) ?? throw new NewsNotFoundException("News article was not found.");
        if (string.IsNullOrWhiteSpace(entity.MarkdownContent)) throw new NewsValidationException("A news article must have Markdown content before publishing.");
        if (!entity.Category.IsActive) throw new NewsValidationException("The news category must be active before publishing.");
        var publishedAt = request.PublishedAt ?? DateTimeOffset.UtcNow;
        if (entity.CreatedAt != default && publishedAt < entity.CreatedAt) throw new NewsValidationException("PublishedAt cannot be before the article creation time.");
        entity.Status = NewsArticleStatus.Published;
        entity.PublishedAt = publishedAt;
        entity.UpdatedBy = actorId;
        repository.AddAudit(actorId, "News.ArticlePublished", nameof(NewsArticle), id);
        await repository.SaveChangesAsync(ct);
        return MapDetail(entity);
    }

    public async Task<NewsArticleDetailDto> UnpublishArticleAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var entity = await repository.FindArticleAsync(id, ct) ?? throw new NewsNotFoundException("News article was not found.");
        entity.Status = NewsArticleStatus.Draft;
        entity.PublishedAt = null;
        entity.IsFeatured = false;
        entity.UpdatedBy = actorId;
        repository.AddAudit(actorId, "News.ArticleUnpublished", nameof(NewsArticle), id);
        await repository.SaveChangesAsync(ct);
        return MapDetail(entity);
    }

    public async Task<NewsArticleDetailDto> SetFeaturedArticleAsync(Guid id, SetFeaturedNewsArticleRequest request, Guid actorId, CancellationToken ct)
    {
        var entity = await repository.FindArticleAsync(id, ct) ?? throw new NewsNotFoundException("News article was not found.");
        if (request.IsFeatured)
        {
            var now = DateTimeOffset.UtcNow;
            if (entity.Status != NewsArticleStatus.Published || entity.PublishedAt is null || entity.PublishedAt > now || !entity.Category.IsActive)
            {
                throw new NewsValidationException("Only a currently published article in an active category can be featured.");
            }

            await repository.ClearFeaturedArticlesAsync(entity.Id, actorId, ct);
        }

        entity.IsFeatured = request.IsFeatured;
        entity.UpdatedBy = actorId;
        repository.AddAudit(actorId, request.IsFeatured ? "News.ArticleFeatured" : "News.ArticleUnfeatured", nameof(NewsArticle), id);
        await repository.SaveChangesAsync(ct);
        return MapDetail(entity);
    }

    public async Task DeleteArticleAsync(Guid id, Guid actorId, CancellationToken ct)
    {
        var entity = await repository.FindArticleAsync(id, ct) ?? throw new NewsNotFoundException("News article was not found.");
        SoftDelete(entity, actorId);
        entity.IsFeatured = false;
        repository.AddAudit(actorId, "News.ArticleDeleted", nameof(NewsArticle), id);
        await repository.SaveChangesAsync(ct);
    }

    private async Task<NewsCategory> EnsureActiveCategoryAsync(Guid categoryId, CancellationToken ct)
    {
        return await repository.FindCategoryAsync(categoryId, ct) is { IsActive: true } category
            ? category
            : throw new NewsValidationException("An active news category is required.");
    }

    private static void ValidateCategory(string name, string slug)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Trim().Length > 120) throw new NewsValidationException("Category name is required and must be 120 characters or fewer.");
        ValidateSlug(slug);
    }

    private static void ValidateArticle(Guid categoryId, string title, string slug, string excerpt, string markdownContent, string? thumbnailUrl)
    {
        if (categoryId == Guid.Empty) throw new NewsValidationException("Category is required.");
        if (string.IsNullOrWhiteSpace(title) || title.Trim().Length > 220) throw new NewsValidationException("Title is required and must be 220 characters or fewer.");
        ValidateSlug(slug);
        if (string.IsNullOrWhiteSpace(excerpt) || excerpt.Trim().Length > 500) throw new NewsValidationException("Excerpt is required and must be 500 characters or fewer.");
        if (markdownContent.Length > 50_000) throw new NewsValidationException("Markdown content must be 50000 characters or fewer.");
        if (!string.IsNullOrWhiteSpace(thumbnailUrl) && (thumbnailUrl.Trim().Length > 500 || !Uri.TryCreate(thumbnailUrl.Trim(), UriKind.RelativeOrAbsolute, out _))) throw new NewsValidationException("Thumbnail URL must be a valid URL with 500 characters or fewer.");
    }

    private static void ValidateSlug(string slug)
    {
        if (string.IsNullOrWhiteSpace(slug) || slug.Trim().Length > 240 || !Regex.IsMatch(slug.Trim(), "^[a-z0-9]+(?:-[a-z0-9]+)*$")) throw new NewsValidationException("Slug must contain lowercase letters, numbers, and hyphens only.");
    }

    private static void ValidatePage(int page, int pageSize)
    {
        if (page < 1 || pageSize is < 1 or > 100) throw new NewsValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
    }

    private static void SoftDelete(SoftDeletableEntity entity, Guid actorId)
    {
        entity.IsDeleted = true;
        entity.DeletedAt = DateTimeOffset.UtcNow;
        entity.DeletedBy = actorId;
    }

    private static string NormalizeSlug(string slug) => slug.Trim().ToLowerInvariant();
    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    private static NewsCategoryDto Map(NewsCategory x) => new(x.Id, x.Name, x.Slug, x.Description, x.DisplayOrder, x.IsActive);
    private static NewsArticleListItemDto MapList(NewsArticle x) => new(x.Id, x.CategoryId, x.Category.Name, x.Title, x.Slug, x.Excerpt, x.ThumbnailUrl, x.Status, x.PublishedAt, x.CreatedAt, x.IsFeatured);
    private static NewsArticleDetailDto MapDetail(NewsArticle x) => new(x.Id, x.CategoryId, x.Category.Name, x.Title, x.Slug, x.Excerpt, x.MarkdownContent, x.ThumbnailUrl, x.Status, x.PublishedAt, x.CreatedAt, x.UpdatedAt, x.IsFeatured);
}
