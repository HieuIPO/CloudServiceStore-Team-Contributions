using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.News;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Integration.Tests;

public sealed class ListSortingTests
{
    [Fact]
    public async Task Catalog_repositories_apply_requested_sort_field_and_direction()
    {
        await using var db = CreateContext();
        var category = new ServiceCategory { Name = "Cloud", Slug = "cloud" };
        db.ServiceCategories.AddRange(
            new ServiceCategory { Name = "Zulu", Slug = "zulu", DisplayOrder = 2 },
            new ServiceCategory { Name = "Alpha", Slug = "alpha", DisplayOrder = 1 });
        db.ServiceCategories.Add(category);
        var alphaPlan = new ServicePlan
        {
            CategoryId = category.Id,
            Category = category,
            Name = "Alpha plan",
            Slug = "alpha-plan",
            Summary = "Alpha",
            IsActive = true
        };
        var zuluPlan = new ServicePlan
        {
            CategoryId = category.Id,
            Category = category,
            Name = "Zulu plan",
            Slug = "zulu-plan",
            Summary = "Zulu",
            IsActive = true
        };
        db.ServicePlans.AddRange(alphaPlan, zuluPlan);
        await db.SaveChangesAsync();

        var repository = new CatalogRepository(db);
        var categoriesAscending = await repository.GetCategoriesAsync(
            new ServiceCategoryQuery(SortBy: "name", SortDirection: "asc"),
            CancellationToken.None);
        var plansDescending = await repository.GetPlansAsync(
            new ServicePlanQuery(SortBy: "name", SortDirection: "desc"),
            CancellationToken.None);

        Assert.Equal(new[] { "Alpha", "Cloud", "Zulu" }, categoriesAscending.Items.Select(x => x.Name));
        Assert.Equal(new[] { "Zulu plan", "Alpha plan" }, plansDescending.Items.Select(x => x.Name));
    }

    [Fact]
    public async Task News_repositories_apply_requested_sort_field_and_direction()
    {
        await using var db = CreateContext();
        var category = new NewsCategory { Name = "Cloud", Slug = "cloud", IsActive = true };
        db.NewsCategories.Add(category);
        db.NewsArticles.AddRange(
            new NewsArticle
            {
                CategoryId = category.Id,
                Category = category,
                Title = "Alpha article",
                Slug = "alpha-article",
                Excerpt = "Alpha",
                MarkdownContent = "# Alpha",
                Status = NewsArticleStatus.Draft
            },
            new NewsArticle
            {
                CategoryId = category.Id,
                Category = category,
                Title = "Zulu article",
                Slug = "zulu-article",
                Excerpt = "Zulu",
                MarkdownContent = "# Zulu",
                Status = NewsArticleStatus.Draft
            });
        await db.SaveChangesAsync();

        var repository = new NewsRepository(db);
        var categoriesDescending = await repository.GetCategoriesAsync(
            new NewsCategoryQuery(SortBy: "name", SortDirection: "desc"),
            false,
            CancellationToken.None);
        var articlesAscending = await repository.GetArticlesAsync(
            new NewsArticleQuery(SortBy: "title", SortDirection: "asc"),
            false,
            CancellationToken.None);

        Assert.Equal("Cloud", categoriesDescending.Items.Single().Name);
        Assert.Equal(new[] { "Alpha article", "Zulu article" }, articlesAscending.Items.Select(x => x.Title));
    }

    [Fact]
    public async Task Order_and_promotion_repositories_apply_requested_sort_fields()
    {
        await using var db = CreateContext();
        var orders = new[]
        {
            new OrderRequest
            {
                CustomerName = "Zulu customer",
                Email = "zulu@example.com",
                PhoneNumber = "0900000001",
                PlanNameSnapshot = "Zulu plan",
                BillingCycle = BillingCycle.Monthly,
                QuotedAmount = 200_000,
                Status = OrderRequestStatus.Pending
            },
            new OrderRequest
            {
                CustomerName = "Alpha customer",
                Email = "alpha@example.com",
                PhoneNumber = "0900000002",
                PlanNameSnapshot = "Alpha plan",
                BillingCycle = BillingCycle.Monthly,
                QuotedAmount = 100_000,
                Status = OrderRequestStatus.Pending
            }
        };
        db.OrderRequests.AddRange(orders);
        db.Promotions.AddRange(
            new Promotion
            {
                Code = "ZULU10",
                Name = "Zulu",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 10,
                StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
                EndsAt = DateTimeOffset.UtcNow.AddDays(1),
                IsActive = true
            },
            new Promotion
            {
                Code = "ALPHA10",
                Name = "Alpha",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 10,
                StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
                EndsAt = DateTimeOffset.UtcNow.AddDays(1),
                IsActive = true
            });
        await db.SaveChangesAsync();

        var orderRepository = new OrderRepository(db);
        var promotionRepository = new PromotionRepository(db);
        var ordersAscending = await orderRepository.GetAsync(
            new OrderRequestQuery(SortBy: "customerName", SortDirection: "asc"),
            CancellationToken.None);
        var promotionsAscending = await promotionRepository.GetPromotionsAsync(
            new PromotionQuery(SortBy: "code", SortDirection: "asc"),
            CancellationToken.None);

        Assert.Equal(new[] { "Alpha customer", "Zulu customer" }, ordersAscending.Items.Select(x => x.CustomerName));
        Assert.Equal(new[] { "ALPHA10", "ZULU10" }, promotionsAscending.Items.Select(x => x.Code));
    }

    private static CloudServiceStoreDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseInMemoryDatabase($"ListSorting-{Guid.NewGuid():N}")
            .Options;
        return new CloudServiceStoreDbContext(options);
    }
}
