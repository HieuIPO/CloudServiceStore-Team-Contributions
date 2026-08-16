using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.News;

public sealed class NewsDataSyncService(INewsRepository repository, INewsDataClient client) : INewsDataSyncService
{
    private const int MaximumLimit = 10;
    private static readonly NewsTopic[] Topics =
    [
        new("technology", "cong-nghe", "C\u00F4ng ngh\u1EC7", "Tin t\u1EE9c c\u00F4ng ngh\u1EC7 v\u00E0 h\u1EA1 t\u1EA7ng s\u1ED1.", 3),
        new("business", "kinh-doanh", "Kinh doanh", "Tin t\u1EE9c kinh doanh v\u00E0 th\u1ECB tr\u01B0\u1EDDng.", 4),
        new("science", "khoa-hoc", "Khoa h\u1ECDc", "Tin t\u1EE9c khoa h\u1ECDc v\u00E0 kh\u00E1m ph\u00E1.", 5),
        new("health", "suc-khoe", "S\u1EE9c kh\u1ECFe", "Tin t\u1EE9c s\u1EE9c kh\u1ECFe v\u00E0 \u0111\u1EDDi s\u1ED1ng.", 6),
        new("environment", "moi-truong", "M\u00F4i tr\u01B0\u1EDDng", "Tin t\u1EE9c m\u00F4i tr\u01B0\u1EDDng v\u00E0 ph\u00E1t tri\u1EC3n b\u1EC1n v\u1EEFng.", 7)
    ];

    public async Task<NewsDataSyncResult> SyncAsync(NewsDataSyncRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        if (request.Limit is < 1 or > MaximumLimit)
            throw new NewsValidationException($"Limit must be from 1 to {MaximumLimit}.");

        var externalArticles = await client.GetLatestAsync(request.Limit, cancellationToken);
        var categories = await EnsureCategoriesAsync(actorId, cancellationToken);
        var importedItems = new List<NewsDataImportedItemDto>();
        var seenSlugs = new HashSet<string>(StringComparer.Ordinal);
        var created = 0;
        var updated = 0;
        var skipped = 0;

        foreach (var externalArticle in externalArticles)
        {
            cancellationToken.ThrowIfCancellationRequested();
            if (!TryPrepareArticle(externalArticle, out var prepared))
            {
                skipped++;
                continue;
            }
            if (!seenSlugs.Add(prepared.Slug))
            {
                skipped++;
                continue;
            }

            var topic = ResolveTopic(externalArticle.CategorySlug);
            var category = categories[topic.DatabaseSlug];

            var existing = await repository.FindArticleForSyncAsync(prepared.Slug, cancellationToken);
            if (existing is { IsDeleted: true })
            {
                skipped++;
                continue;
            }

            if (existing is null)
            {
                var entity = new NewsArticle
                {
                    CategoryId = category.Id,
                    Category = category,
                    Title = prepared.Title,
                    Slug = prepared.Slug,
                    Excerpt = prepared.Excerpt,
                    MarkdownContent = prepared.MarkdownContent,
                    ThumbnailUrl = prepared.ThumbnailUrl,
                    Status = request.Publish ? NewsArticleStatus.Published : NewsArticleStatus.Draft,
                    PublishedAt = request.Publish ? GetSafePublishedAt(prepared.PublishedAt) : null,
                    CreatedBy = actorId
                };
                repository.AddArticle(entity);
                repository.AddAudit(actorId, "News.ArticleImported", nameof(NewsArticle), entity.Id);
                importedItems.Add(MapImportedItem(entity, prepared));
                created++;
                continue;
            }

            existing.CategoryId = category.Id;
            existing.Category = category;
            existing.Title = prepared.Title;
            existing.Excerpt = prepared.Excerpt;
            existing.MarkdownContent = prepared.MarkdownContent;
            existing.ThumbnailUrl = prepared.ThumbnailUrl;
            if (request.Publish)
            {
                existing.Status = NewsArticleStatus.Published;
                existing.PublishedAt = GetSafePublishedAt(prepared.PublishedAt);
            }
            existing.UpdatedBy = actorId;
            repository.AddAudit(actorId, "News.ArticleImported", nameof(NewsArticle), existing.Id);
            importedItems.Add(MapImportedItem(existing, prepared));
            updated++;
        }

        await repository.SaveChangesAsync(cancellationToken);
        return new(externalArticles.Count, created, updated, skipped, importedItems);
    }

    private async Task<IReadOnlyDictionary<string, NewsCategory>> EnsureCategoriesAsync(Guid actorId, CancellationToken cancellationToken)
    {
        var categories = new Dictionary<string, NewsCategory>(StringComparer.Ordinal);
        foreach (var topic in Topics)
        {
            var category = await repository.FindCategoryBySlugAsync(topic.DatabaseSlug, cancellationToken);
            if (category is null)
            {
                if (await repository.CategorySlugExistsAsync(topic.DatabaseSlug, null, cancellationToken))
                    throw new NewsConflictException($"The {topic.DatabaseSlug} news category already exists but could not be loaded.");

                category = new NewsCategory
                {
                    Name = topic.Name,
                    Slug = topic.DatabaseSlug,
                    Description = topic.Description,
                    DisplayOrder = topic.DisplayOrder,
                    IsActive = true,
                    CreatedBy = actorId
                };
                repository.AddCategory(category);
                repository.AddAudit(actorId, "News.CategoryCreated", nameof(NewsCategory), category.Id);
            }
            else
            {
                var wasChanged = category.IsDeleted || !category.IsActive;
                category.IsDeleted = false;
                category.IsActive = true;
                if (wasChanged)
                {
                    category.UpdatedBy = actorId;
                    repository.AddAudit(actorId, "News.CategoryReactivated", nameof(NewsCategory), category.Id);
                }
            }

            categories.Add(topic.DatabaseSlug, category);
        }

        return categories;
    }

    private static NewsTopic ResolveTopic(string? categorySlug) =>
        Topics.FirstOrDefault(topic => string.Equals(topic.ProviderSlug, categorySlug, StringComparison.OrdinalIgnoreCase)) ?? Topics[0];

    private static bool TryPrepareArticle(NewsDataArticle article, out PreparedArticle prepared)
    {
        prepared = default!;
        if (!TryGetAbsoluteHttpUrl(article.Link, out var link)) return false;

        var title = CleanText(article.Title, 220);
        if (string.IsNullOrWhiteSpace(title)) return false;

        var excerpt = CleanText(article.Description, 500);
        if (string.IsNullOrWhiteSpace(excerpt)) excerpt = title;

        var sourceName = CleanText(article.SourceName, 120);
        if (string.IsNullOrWhiteSpace(sourceName)) sourceName = "NewsData.io";
        sourceName = sourceName.Replace("[", "(").Replace("]", ")");

        var thumbnailUrl = TryGetAbsoluteHttpUrl(article.ImageUrl, out var imageUrl) && imageUrl.Length <= 500
            ? imageUrl
            : null;
        var markdownContent = $"{excerpt}\n\nNgu\u1ED3n: [{sourceName}]({link})";
        var identity = string.IsNullOrWhiteSpace(article.ExternalId) ? link : $"{article.ExternalId}|{link}";
        var hash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(identity))).ToLowerInvariant();

        prepared = new PreparedArticle(
            title,
            $"newsdata-{hash[..32]}",
            excerpt,
            markdownContent,
            thumbnailUrl,
            sourceName,
            link,
            article.PublishedAt);
        return true;
    }

    private static NewsDataImportedItemDto MapImportedItem(NewsArticle entity, PreparedArticle prepared) =>
        new(entity.Id, entity.Title, entity.Slug, prepared.SourceName, prepared.Link, entity.Status);

    private static DateTimeOffset GetSafePublishedAt(DateTimeOffset? publishedAt)
    {
        var now = DateTimeOffset.UtcNow;
        return publishedAt is { } value && value <= now ? value : now;
    }

    private static string CleanText(string? value, int maximumLength)
    {
        if (string.IsNullOrWhiteSpace(value)) return string.Empty;
        var withoutTags = Regex.Replace(WebUtility.HtmlDecode(value), "<[^>]*>", " ");
        var normalized = Regex.Replace(withoutTags, @"\s+", " ").Trim();
        if (normalized.Length <= maximumLength) return normalized;
        if (maximumLength <= 1) return normalized[..maximumLength];
        return normalized[..(maximumLength - 1)].TrimEnd() + "\u2026";
    }

    private static bool TryGetAbsoluteHttpUrl(string? value, out string url)
    {
        url = string.Empty;
        if (string.IsNullOrWhiteSpace(value) || !Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)) return false;
        if (!string.Equals(uri.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(uri.Scheme, Uri.UriSchemeHttps, StringComparison.OrdinalIgnoreCase)) return false;
        url = uri.ToString();
        return true;
    }

    private sealed record PreparedArticle(
        string Title,
        string Slug,
        string Excerpt,
        string MarkdownContent,
        string? ThumbnailUrl,
        string SourceName,
        string Link,
        DateTimeOffset? PublishedAt);

    private sealed record NewsTopic(string ProviderSlug, string DatabaseSlug, string Name, string Description, int DisplayOrder);
}
