using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class NewsServiceTests
{
    [Fact]
    public async Task Public_cannot_read_draft_article()
    {
        var repository = CreateRepository();
        var draft = CreateArticle(NewsArticleStatus.Draft, null);
        repository.Setup(x => x.FindArticleBySlugAsync("draft-post", true, It.IsAny<CancellationToken>())).ReturnsAsync(draft);
        var service = new NewsService(repository.Object);

        var result = await service.GetArticleBySlugAsync("draft-post", true, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Duplicate_article_slug_is_rejected()
    {
        var repository = CreateRepository();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud", IsActive = true };
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        repository.Setup(x => x.ArticleSlugExistsAsync("cloud-guide", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsConflictException>(() => service.CreateArticleAsync(
            new(category.Id, "Cloud guide", "cloud-guide", "A practical guide", "# Content", null),
            Guid.NewGuid(),
            CancellationToken.None));

        repository.Verify(x => x.AddArticle(It.IsAny<NewsArticle>()), Times.Never);
    }

    [Fact]
    public async Task Publish_valid_article_sets_status_and_date()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        var result = await service.PublishArticleAsync(article.Id, new(), Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(NewsArticleStatus.Published, result.Status);
        Assert.NotNull(result.PublishedAt);
        repository.Verify(x => x.AddAudit(It.IsAny<Guid>(), "News.ArticlePublished", nameof(NewsArticle), article.Id), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Cannot_publish_article_without_markdown_content()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        article.MarkdownContent = " ";
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() =>
            service.PublishArticleAsync(article.Id, new(), Guid.NewGuid(), CancellationToken.None));

        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Invalid_pagination_is_rejected_before_query()
    {
        var repository = CreateRepository();
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() =>
            service.GetArticlesAsync(new(Page: 0), true, CancellationToken.None));

        repository.Verify(x => x.GetArticlesAsync(It.IsAny<NewsArticleQuery>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Selecting_published_article_as_featured_clears_previous_selection()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Published, DateTimeOffset.UtcNow.AddMinutes(-5));
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        repository.Setup(x => x.ClearFeaturedArticlesAsync(article.Id, It.IsAny<Guid>(), It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var actorId = Guid.NewGuid();
        var service = new NewsService(repository.Object);

        var result = await service.SetFeaturedArticleAsync(article.Id, new(true), actorId, CancellationToken.None);

        Assert.True(article.IsFeatured);
        Assert.True(result.IsFeatured);
        repository.Verify(x => x.ClearFeaturedArticlesAsync(article.Id, actorId, It.IsAny<CancellationToken>()), Times.Once);
        repository.Verify(x => x.AddAudit(actorId, "News.ArticleFeatured", nameof(NewsArticle), article.Id), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Draft_article_cannot_be_selected_as_featured()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() =>
            service.SetFeaturedArticleAsync(article.Id, new(true), Guid.NewGuid(), CancellationToken.None));

        Assert.False(article.IsFeatured);
        repository.Verify(x => x.ClearFeaturedArticlesAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Search_and_category_filter_are_forwarded_to_repository()
    {
        var repository = CreateRepository();
        var categoryId = Guid.NewGuid();
        var query = new NewsArticleQuery(2, 5, "kubernetes", categoryId, NewsArticleStatus.Draft);
        repository.Setup(x => x.GetArticlesAsync(query, false, It.IsAny<CancellationToken>()))
            .ReturnsAsync((Array.Empty<NewsArticle>(), 0));
        var service = new NewsService(repository.Object);

        var result = await service.GetArticlesAsync(query, false, CancellationToken.None);

        Assert.Equal(2, result.Page);
        Assert.Equal(5, result.PageSize);
        repository.Verify(x => x.GetArticlesAsync(query, false, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static NewsArticle CreateArticle(NewsArticleStatus status, DateTimeOffset? publishedAt) =>
        new()
        {
            Category = new NewsCategory { Name = "Cloud", Slug = "cloud" },
            Title = "Draft post",
            Slug = "draft-post",
            Excerpt = "Draft excerpt",
            MarkdownContent = "# Draft content",
            Status = status,
            PublishedAt = publishedAt,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };

    private static Mock<INewsRepository> CreateRepository()
    {
        var repository = new Mock<INewsRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }
}
