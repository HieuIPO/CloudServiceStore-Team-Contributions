using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.News;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Application.Promotions;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class ListSortValidationTests
{
    [Fact]
    public async Task Catalog_rejects_unknown_sort_field_before_repository_query()
    {
        var repository = new Mock<ICatalogRepository>();
        var service = new CatalogService(repository.Object);

        await Assert.ThrowsAsync<CatalogValidationException>(() =>
            service.GetCategoriesAsync(new ServiceCategoryQuery(SortBy: "sql"), CancellationToken.None));

        repository.Verify(x => x.GetCategoriesAsync(It.IsAny<ServiceCategoryQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task News_rejects_invalid_sort_direction_before_repository_query()
    {
        var repository = new Mock<INewsRepository>();
        var service = new NewsService(repository.Object);

        await Assert.ThrowsAsync<NewsValidationException>(() =>
            service.GetArticlesAsync(new NewsArticleQuery(SortBy: "title", SortDirection: "sideways"), false, CancellationToken.None));

        repository.Verify(x => x.GetArticlesAsync(It.IsAny<NewsArticleQuery>(), It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Orders_reject_a_sort_direction_without_a_sort_field()
    {
        var repository = new Mock<IOrderRepository>();
        var service = new OrderService(repository.Object, Mock.Of<IDiscountStrategyFactory>());

        await Assert.ThrowsAsync<OrderValidationException>(() =>
            service.GetAsync(new OrderRequestQuery(SortDirection: "desc"), CancellationToken.None));

        repository.Verify(x => x.GetAsync(It.IsAny<OrderRequestQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Promotions_reject_unknown_sort_field_before_repository_query()
    {
        var repository = new Mock<IPromotionRepository>();
        var service = new PromotionService(repository.Object);

        await Assert.ThrowsAsync<PromotionValidationException>(() =>
            service.GetPromotionsAsync(new PromotionQuery(SortBy: "discountValue"), CancellationToken.None));

        repository.Verify(x => x.GetPromotionsAsync(It.IsAny<PromotionQuery>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
