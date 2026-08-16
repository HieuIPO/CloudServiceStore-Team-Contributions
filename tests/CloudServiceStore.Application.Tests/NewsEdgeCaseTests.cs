using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class NewsEdgeCaseTests
{
    [Fact]
    public async Task Get_categories_maps_items_and_paging_metadata()
    {
        var repository = CreateRepository();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud", Description = "Cloud news", DisplayOrder = 2 };
        repository.Setup(x => x.GetCategoriesAsync(It.IsAny<NewsCategoryQuery>(), true, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([category], 3));
        var service = new NewsService(repository.Object);

        var result = await service.GetCategoriesAsync(new(2, 1), true, CancellationToken.None);

        Assert.Equal(2, result.Page);
        Assert.Equal(1, result.PageSize);
        Assert.Equal(3, result.TotalCount);
        Assert.Equal("cloud", result.Items.Single().Slug);
        Assert.Equal("Cloud news", result.Items.Single().Description);
    }

    [Fact]
    public async Task Create_category_trims_values_and_normalizes_slug()
    {
        var repository = CreateRepository();
        var service = new NewsService(repository.Object);
        var actorId = Guid.NewGuid();

        var result = await service.CreateCategoryAsync(
            new("  Cloud  ", " cloud-guide ", "  Practical news  ", 3, true),
            actorId,
            CancellationToken.None);

        Assert.Equal("Cloud", result.Name);
        Assert.Equal("cloud-guide", result.Slug);
        Assert.Equal("Practical news", result.Description);
        repository.Verify(x => x.AddCategory(It.Is<NewsCategory>(item =>
            item.Name == "Cloud" && item.Slug == "cloud-guide" && item.Description == "Practical news")), Times.Once);
        repository.Verify(x => x.AddAudit(actorId, "News.CategoryCreated", nameof(NewsCategory), It.IsAny<Guid>()), Times.Once);
    }

    [Fact]
    public async Task Delete_category_with_articles_is_rejected()
    {
        var repository = CreateRepository();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud" };
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        repository.Setup(x => x.CategoryHasArticlesAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsConflictException>(() => service.DeleteCategoryAsync(
            category.Id, Guid.NewGuid(), CancellationToken.None));

        Assert.False(category.IsDeleted);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Delete_empty_category_soft_deletes_and_records_actor()
    {
        var repository = CreateRepository();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud" };
        var actorId = Guid.NewGuid();
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        repository.Setup(x => x.CategoryHasArticlesAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        var service = new NewsService(repository.Object);

        await service.DeleteCategoryAsync(category.Id, actorId, CancellationToken.None);

        Assert.True(category.IsDeleted);
        Assert.Equal(actorId, category.DeletedBy);
        Assert.NotNull(category.DeletedAt);
        repository.Verify(x => x.AddAudit(actorId, "News.CategoryDeleted", nameof(NewsCategory), category.Id), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Blank_slug_returns_null_without_querying_repository()
    {
        var repository = CreateRepository();
        var service = new NewsService(repository.Object);

        var result = await service.GetArticleBySlugAsync("  ", true, CancellationToken.None);

        Assert.Null(result);
        repository.Verify(x => x.FindArticleBySlugAsync(It.IsAny<string>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Public_cannot_read_future_published_article()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Published, DateTimeOffset.UtcNow.AddMinutes(10));
        repository.Setup(x => x.FindArticleBySlugAsync(article.Slug, true, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        var result = await service.GetArticleBySlugAsync(article.Slug, true, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Create_article_requires_active_category()
    {
        var repository = CreateRepository();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud", IsActive = false };
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() => service.CreateArticleAsync(
            new(category.Id, "Cloud guide", "cloud-guide", "Excerpt", "# Content", null),
            Guid.NewGuid(),
            CancellationToken.None));

        repository.Verify(x => x.AddArticle(It.IsAny<NewsArticle>()), Times.Never);
    }

    [Fact]
    public async Task Published_article_cannot_be_updated_with_empty_markdown()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Published, DateTimeOffset.UtcNow.AddMinutes(-5));
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() => service.UpdateArticleAsync(
            article.Id,
            new(article.CategoryId, "Updated", article.Slug, "Excerpt", " ", null),
            Guid.NewGuid(),
            CancellationToken.None));

        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Publish_rejects_inactive_category()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        article.Category.IsActive = false;
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() => service.PublishArticleAsync(
            article.Id, new(), Guid.NewGuid(), CancellationToken.None));

        Assert.Equal(NewsArticleStatus.Draft, article.Status);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Publish_rejects_date_before_article_creation()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        article.CreatedAt = DateTimeOffset.UtcNow;
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() => service.PublishArticleAsync(
            article.Id,
            new(article.CreatedAt.AddMinutes(-1)),
            Guid.NewGuid(),
            CancellationToken.None));

        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Unpublish_clears_public_date_and_featured_flag()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Published, DateTimeOffset.UtcNow.AddMinutes(-5));
        article.IsFeatured = true;
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        var result = await service.UnpublishArticleAsync(article.Id, Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(NewsArticleStatus.Draft, result.Status);
        Assert.Null(article.PublishedAt);
        Assert.False(article.IsFeatured);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Unfeature_draft_article_does_not_require_public_state()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Draft, null);
        article.IsFeatured = true;
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var actorId = Guid.NewGuid();
        var service = new NewsService(repository.Object);

        var result = await service.SetFeaturedArticleAsync(article.Id, new(false), actorId, CancellationToken.None);

        Assert.False(result.IsFeatured);
        repository.Verify(x => x.ClearFeaturedArticlesAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(x => x.AddAudit(actorId, "News.ArticleUnfeatured", nameof(NewsArticle), article.Id), Times.Once);
    }

    [Fact]
    public async Task Delete_article_soft_deletes_and_unfeatures_it()
    {
        var repository = CreateRepository();
        var article = CreateArticle(NewsArticleStatus.Published, DateTimeOffset.UtcNow.AddMinutes(-5));
        article.IsFeatured = true;
        var actorId = Guid.NewGuid();
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        await service.DeleteArticleAsync(article.Id, actorId, CancellationToken.None);

        Assert.True(article.IsDeleted);
        Assert.Equal(actorId, article.DeletedBy);
        Assert.False(article.IsFeatured);
        repository.Verify(x => x.AddAudit(actorId, "News.ArticleDeleted", nameof(NewsArticle), article.Id), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Mock<INewsRepository> CreateRepository()
    {
        var repository = new Mock<INewsRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static NewsArticle CreateArticle(NewsArticleStatus status, DateTimeOffset? publishedAt) =>
        new()
        {
            CategoryId = Guid.NewGuid(),
            Category = new NewsCategory { Name = "Cloud", Slug = "cloud", IsActive = true },
            Title = "Cloud guide",
            Slug = "cloud-guide",
            Excerpt = "Cloud excerpt",
            MarkdownContent = "# Cloud content",
            Status = status,
            PublishedAt = publishedAt,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
}
