using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.News;

public interface INewsRepository
{
    Task<(IReadOnlyList<NewsCategory> Items, int Total)> GetCategoriesAsync(NewsCategoryQuery query, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsCategory?> FindCategoryAsync(Guid id, CancellationToken cancellationToken);
    Task<NewsCategory?> FindCategoryBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedId, CancellationToken cancellationToken);
    Task<bool> CategoryHasArticlesAsync(Guid id, CancellationToken cancellationToken);
    Task<(IReadOnlyList<NewsArticle> Items, int Total)> GetArticlesAsync(NewsArticleQuery query, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsArticle?> FindArticleAsync(Guid id, CancellationToken cancellationToken);
    Task<NewsArticle?> FindArticleBySlugAsync(string slug, bool publicOnly, CancellationToken cancellationToken);
    Task<NewsArticle?> FindArticleForSyncAsync(string slug, CancellationToken cancellationToken);
    Task<bool> ArticleSlugExistsAsync(string slug, Guid? excludedId, CancellationToken cancellationToken);
    Task ClearFeaturedArticlesAsync(Guid excludedId, Guid actorId, CancellationToken cancellationToken);
    void AddCategory(NewsCategory category);
    void AddArticle(NewsArticle article);
    void AddAudit(Guid actorId, string action, string entityName, Guid entityId);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class NewsNotFoundException(string message) : Exception(message);
public sealed class NewsConflictException(string message) : Exception(message);
public sealed class NewsValidationException(string message) : Exception(message);
public sealed class NewsExternalServiceException(string message, Exception? innerException = null) : Exception(message, innerException);

public sealed record NewsDataArticle(
    string ExternalId,
    string Title,
    string? Description,
    string Link,
    string? ImageUrl,
    string? SourceName,
    DateTimeOffset? PublishedAt,
    string? CategorySlug = null);

public interface INewsDataClient
{
    Task<IReadOnlyList<NewsDataArticle>> GetLatestAsync(int limit, CancellationToken cancellationToken);
}

public interface INewsDataSyncService
{
    Task<NewsDataSyncResult> SyncAsync(NewsDataSyncRequest request, Guid actorId, CancellationToken cancellationToken);
}
