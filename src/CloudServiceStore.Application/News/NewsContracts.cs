using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.News;

public sealed record NewsCategoryQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    bool? IsActive = true,
    string? SortBy = null,
    string? SortDirection = null);
public sealed record CreateNewsCategoryRequest(string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);
public sealed record UpdateNewsCategoryRequest(string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);
public sealed record NewsCategoryDto(Guid Id, string Name, string Slug, string? Description, int DisplayOrder, bool IsActive);

public sealed record NewsArticleQuery(
    int Page = 1,
    int PageSize = 12,
    string? Search = null,
    Guid? CategoryId = null,
    NewsArticleStatus? Status = null,
    string? SortBy = null,
    string? SortDirection = null);
public sealed record CreateNewsArticleRequest(Guid CategoryId, string Title, string Slug, string Excerpt, string MarkdownContent, string? ThumbnailUrl);
public sealed record UpdateNewsArticleRequest(Guid CategoryId, string Title, string Slug, string Excerpt, string MarkdownContent, string? ThumbnailUrl);
public sealed record PublishNewsArticleRequest(DateTimeOffset? PublishedAt = null);
public sealed record SetFeaturedNewsArticleRequest(bool IsFeatured);
public sealed record NewsArticleListItemDto(Guid Id, Guid CategoryId, string CategoryName, string Title, string Slug, string Excerpt, string? ThumbnailUrl, NewsArticleStatus Status, DateTimeOffset? PublishedAt, DateTimeOffset CreatedAt, bool IsFeatured = false);
public sealed record NewsArticleDetailDto(Guid Id, Guid CategoryId, string CategoryName, string Title, string Slug, string Excerpt, string MarkdownContent, string? ThumbnailUrl, NewsArticleStatus Status, DateTimeOffset? PublishedAt, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt, bool IsFeatured = false);
public sealed record NewsDataSyncRequest(int Limit = 10, bool Publish = false);
public sealed record NewsDataImportedItemDto(Guid Id, string Title, string Slug, string SourceName, string Link, NewsArticleStatus Status);
public sealed record NewsDataSyncResult(int Fetched, int Created, int Updated, int Skipped, IReadOnlyList<NewsDataImportedItemDto> Items);

public interface INewsService
{
    Task<PagedResult<NewsCategoryDto>> GetCategoriesAsync(NewsCategoryQuery query, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsCategoryDto> CreateCategoryAsync(CreateNewsCategoryRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<NewsCategoryDto> UpdateCategoryAsync(Guid id, UpdateNewsCategoryRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeleteCategoryAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
    Task<PagedResult<NewsArticleListItemDto>> GetArticlesAsync(NewsArticleQuery query, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto?> GetArticleBySlugAsync(string slug, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto?> GetArticleByIdAsync(Guid id, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto> CreateArticleAsync(CreateNewsArticleRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto> UpdateArticleAsync(Guid id, UpdateNewsArticleRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto> PublishArticleAsync(Guid id, PublishNewsArticleRequest request, Guid actorId, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto> UnpublishArticleAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
    Task<NewsArticleDetailDto> SetFeaturedArticleAsync(Guid id, SetFeaturedNewsArticleRequest request, Guid actorId, CancellationToken cancellationToken);
    Task DeleteArticleAsync(Guid id, Guid actorId, CancellationToken cancellationToken);
}
