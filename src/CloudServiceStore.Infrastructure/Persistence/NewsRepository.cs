using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class NewsRepository(CloudServiceStoreDbContext dbContext) : INewsRepository
{
    public async Task<(IReadOnlyList<NewsCategory> Items, int Total)> GetCategoriesAsync(NewsCategoryQuery query, bool publicOnly, CancellationToken ct)
    {
        IQueryable<NewsCategory> source = dbContext.NewsCategories.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            source = source.Where(x => x.Name.Contains(search) || x.Slug.Contains(search));
        }
        if (publicOnly) source = source.Where(x => x.IsActive);
        else if (query.IsActive is not null) source = source.Where(x => x.IsActive == query.IsActive);
        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "name" => descending
                ? source.OrderByDescending(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Name).ThenBy(x => x.Id),
            "createdat" => descending
                ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            "displayorder" => descending
                ? source.OrderByDescending(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id)
                : source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id),
            _ => source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ThenBy(x => x.Id)
        };
        var items = await ordered.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }

    public Task<NewsCategory?> FindCategoryAsync(Guid id, CancellationToken ct) =>
        dbContext.NewsCategories.FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<NewsCategory?> FindCategoryBySlugAsync(string slug, CancellationToken ct) =>
        dbContext.NewsCategories.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Slug == slug, ct);

    public Task<bool> CategorySlugExistsAsync(string slug, Guid? excludedId, CancellationToken ct) =>
        dbContext.NewsCategories.IgnoreQueryFilters().AnyAsync(x => x.Slug == slug && (!excludedId.HasValue || x.Id != excludedId), ct);

    public Task<bool> CategoryHasArticlesAsync(Guid id, CancellationToken ct) =>
        dbContext.NewsArticles.AnyAsync(x => x.CategoryId == id, ct);

    public async Task<(IReadOnlyList<NewsArticle> Items, int Total)> GetArticlesAsync(NewsArticleQuery query, bool publicOnly, CancellationToken ct)
    {
        IQueryable<NewsArticle> source = dbContext.NewsArticles.AsNoTracking().Include(x => x.Category);
        if (publicOnly)
        {
            var now = DateTimeOffset.UtcNow;
            source = source.Where(x => x.Status == NewsArticleStatus.Published && x.PublishedAt != null && x.PublishedAt <= now && x.Category.IsActive);
        }
        else if (query.Status is not null) source = source.Where(x => x.Status == query.Status);
        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var search = query.Search.Trim();
            source = source.Where(x => x.Title.Contains(search) || x.Excerpt.Contains(search) || x.Slug.Contains(search));
        }
        if (query.CategoryId is not null) source = source.Where(x => x.CategoryId == query.CategoryId);
        var total = await source.CountAsync(ct);
        var descending = ListSortQuery.IsDescending(query.SortDirection);
        var sortBy = query.SortBy?.Trim().ToLowerInvariant();
        var ordered = sortBy switch
        {
            "title" => descending
                ? source.OrderByDescending(x => x.Title).ThenBy(x => x.Id)
                : source.OrderBy(x => x.Title).ThenBy(x => x.Id),
            "isfeatured" => descending
                ? source.OrderByDescending(x => x.IsFeatured).ThenByDescending(x => x.PublishedAt ?? x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.IsFeatured).ThenByDescending(x => x.PublishedAt ?? x.CreatedAt).ThenBy(x => x.Id),
            "publishedat" => descending
                ? source.OrderByDescending(x => x.PublishedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.PublishedAt).ThenBy(x => x.Id),
            "createdat" => descending
                ? source.OrderByDescending(x => x.CreatedAt).ThenBy(x => x.Id)
                : source.OrderBy(x => x.CreatedAt).ThenBy(x => x.Id),
            _ => source.OrderByDescending(x => x.IsFeatured).ThenByDescending(x => x.PublishedAt ?? x.CreatedAt).ThenBy(x => x.Id)
        };
        var items = await ordered.Skip((query.Page - 1) * query.PageSize).Take(query.PageSize).ToListAsync(ct);
        return (items, total);
    }

    public Task<NewsArticle?> FindArticleAsync(Guid id, CancellationToken ct) =>
        dbContext.NewsArticles.Include(x => x.Category).FirstOrDefaultAsync(x => x.Id == id, ct);

    public Task<NewsArticle?> FindArticleBySlugAsync(string slug, bool publicOnly, CancellationToken ct)
    {
        IQueryable<NewsArticle> source = dbContext.NewsArticles.AsNoTracking().Include(x => x.Category).Where(x => x.Slug == slug);
        if (publicOnly)
        {
            var now = DateTimeOffset.UtcNow;
            source = source.Where(x => x.Status == NewsArticleStatus.Published && x.PublishedAt != null && x.PublishedAt <= now && x.Category.IsActive);
        }
        return source.FirstOrDefaultAsync(ct);
    }

    public Task<NewsArticle?> FindArticleForSyncAsync(string slug, CancellationToken ct) =>
        dbContext.NewsArticles.IgnoreQueryFilters().Include(x => x.Category).FirstOrDefaultAsync(x => x.Slug == slug, ct);

    public Task<bool> ArticleSlugExistsAsync(string slug, Guid? excludedId, CancellationToken ct) =>
        dbContext.NewsArticles.IgnoreQueryFilters().AnyAsync(x => x.Slug == slug && (!excludedId.HasValue || x.Id != excludedId), ct);

    public Task ClearFeaturedArticlesAsync(Guid excludedId, Guid actorId, CancellationToken ct) =>
        dbContext.NewsArticles
            .Where(x => x.IsFeatured && x.Id != excludedId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(x => x.IsFeatured, false)
                .SetProperty(x => x.UpdatedBy, actorId)
                .SetProperty(x => x.UpdatedAt, DateTimeOffset.UtcNow), ct);

    public void AddCategory(NewsCategory category) => dbContext.NewsCategories.Add(category);
    public void AddArticle(NewsArticle article) => dbContext.NewsArticles.Add(article);
    public void AddAudit(Guid actorId, string action, string entityName, Guid entityId) =>
        dbContext.AuditLogs.Add(new AuditLog { AppUserId = actorId, Action = action, EntityName = entityName, EntityId = entityId, OccurredAt = DateTimeOffset.UtcNow });
    public Task SaveChangesAsync(CancellationToken ct) => dbContext.SaveChangesAsync(ct);
}
