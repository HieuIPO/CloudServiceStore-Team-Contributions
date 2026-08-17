using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class NewsDataSyncServiceTests
{
    [Fact]
    public async Task Imports_new_article_as_draft_and_keeps_source_link()
    {
        var repository = CreateRepository();
        var client = new Mock<INewsDataClient>();
        client.Setup(x => x.GetLatestAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new[]
            {
                new NewsDataArticle(
                    "external-article-1",
                    "Cloud Server mới cho doanh nghiệp",
                    "Tóm tắt bài viết về hạ tầng cloud.",
                    "https://example.com/cloud-server",
                    "https://example.com/cloud-server.jpg",
                    "Nguồn công nghệ",
                    DateTimeOffset.UtcNow.AddHours(-2))
            });

        var service = new NewsDataSyncService(repository.Object, client.Object);

        var result = await service.SyncAsync(new(Limit: 1, Publish: false), Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(1, result.Created);
        Assert.Equal(0, result.Updated);
        var article = repository.Invocations
            .Single(invocation => invocation.Method.Name == nameof(INewsRepository.AddArticle))
            .Arguments[0] as NewsArticle;
        Assert.NotNull(article);
        Assert.Equal(NewsArticleStatus.Draft, article!.Status);
        Assert.Contains("https://example.com/cloud-server", article.MarkdownContent);
        Assert.Equal("cong-nghe", article.Category.Slug);
    }

    [Fact]
    public async Task Does_not_save_when_external_news_request_fails()
    {
        var repository = CreateRepository();
        var client = new Mock<INewsDataClient>();
        client.Setup(x => x.GetLatestAsync(It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new NewsExternalServiceException("NewsData request failed."));
        var service = new NewsDataSyncService(repository.Object, client.Object);

        await Assert.ThrowsAsync<NewsExternalServiceException>(() =>
            service.SyncAsync(new(Limit: 1), Guid.NewGuid(), CancellationToken.None));

        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(x => x.AddArticle(It.IsAny<NewsArticle>()), Times.Never);
    }

    private static Mock<INewsRepository> CreateRepository()
    {
        var repository = new Mock<INewsRepository>();
        repository.Setup(x => x.FindCategoryBySlugAsync("cong-nghe", It.IsAny<CancellationToken>()))
            .ReturnsAsync((NewsCategory?)null);
        repository.Setup(x => x.CategorySlugExistsAsync("cong-nghe", null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repository.Setup(x => x.FindArticleBySlugAsync(It.IsAny<string>(), false, It.IsAny<CancellationToken>()))
            .ReturnsAsync((NewsArticle?)null);
        repository.Setup(x => x.ArticleSlugExistsAsync(It.IsAny<string>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }
}
