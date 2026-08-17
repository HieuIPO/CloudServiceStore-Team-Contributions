using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Entities;

public sealed class NewsCategory : SoftDeletableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public ICollection<NewsArticle> Articles { get; } = new List<NewsArticle>();
}

public sealed class NewsArticle : SoftDeletableEntity
{
    public Guid CategoryId { get; set; }
    public NewsCategory Category { get; set; } = null!;
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Excerpt { get; set; } = string.Empty;
    public string MarkdownContent { get; set; } = string.Empty;
    public string? ThumbnailUrl { get; set; }
    public NewsArticleStatus Status { get; set; } = NewsArticleStatus.Draft;
    public DateTimeOffset? PublishedAt { get; set; }
    public bool IsFeatured { get; set; }
}
