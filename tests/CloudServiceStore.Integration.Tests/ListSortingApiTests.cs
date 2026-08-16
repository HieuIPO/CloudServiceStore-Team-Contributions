using System.Net;
using System.Text.Json;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;

namespace CloudServiceStore.Integration.Tests;

public sealed class ListSortingApiTests(CloudServiceStoreApiFactory factory)
    : IClassFixture<CloudServiceStoreApiFactory>
{
    [Fact]
    public async Task Catalog_endpoint_binds_sort_query_parameters()
    {
        await SeedCatalogCategoriesAsync();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(
            "/api/v1/service-categories?page=1&pageSize=10&search=sort-api-category&sortBy=name&sortDirection=asc");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        var names = json.RootElement.GetProperty("items").EnumerateArray()
            .Select(item => item.GetProperty("name").GetString())
            .ToArray();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(new[] { "Sort API Category Alpha", "Sort API Category Zulu" }, names);
    }

    [Fact]
    public async Task News_endpoint_binds_sort_query_parameters()
    {
        await SeedNewsArticlesAsync();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(
            "/api/v1/news-articles?page=1&pageSize=10&search=sort-api-news&sortBy=title&sortDirection=asc");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        var titles = json.RootElement.GetProperty("items").EnumerateArray()
            .Select(item => item.GetProperty("title").GetString())
            .ToArray();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(new[] { "Sort API News Alpha", "Sort API News Zulu" }, titles);
    }

    [Fact]
    public async Task Orders_endpoint_binds_sort_query_parameters()
    {
        await SeedOrdersAsync();
        using var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, "Editor");

        using var response = await client.GetAsync(
            "/api/v1/orders?page=1&pageSize=10&search=sort-api-order&sortBy=customerName&sortDirection=asc");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        var names = json.RootElement.GetProperty("items").EnumerateArray()
            .Select(item => item.GetProperty("customerName").GetString())
            .ToArray();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(new[] { "Sort API Order Alpha", "Sort API Order Zulu" }, names);
    }

    [Fact]
    public async Task Promotions_endpoint_binds_sort_query_parameters()
    {
        await SeedPromotionsAsync();
        using var client = factory.CreateClient();

        using var response = await client.GetAsync(
            "/api/v1/promotions?page=1&pageSize=100&isActive=true&sortBy=code&sortDirection=asc");
        using var json = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());
        var codes = json.RootElement.GetProperty("items").EnumerateArray()
            .Select(item => item.GetProperty("code").GetString())
            .ToArray();

        var alphaIndex = Array.IndexOf(codes, "SORT_API_ALPHA");
        var zuluIndex = Array.IndexOf(codes, "SORT_API_ZULU");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(alphaIndex >= 0);
        Assert.True(zuluIndex >= 0);
        Assert.True(alphaIndex < zuluIndex);
    }

    private async Task SeedCatalogCategoriesAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        db.ServiceCategories.AddRange(
            new ServiceCategory { Name = "Sort API Category Zulu", Slug = $"sort-api-category-zulu-{Guid.NewGuid():N}", IsActive = true },
            new ServiceCategory { Name = "Sort API Category Alpha", Slug = $"sort-api-category-alpha-{Guid.NewGuid():N}", IsActive = true });
        await db.SaveChangesAsync();
    }

    private async Task SeedNewsArticlesAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        var category = new NewsCategory
        {
            Name = "Sort API News Category",
            Slug = $"sort-api-news-category-{Guid.NewGuid():N}",
            IsActive = true
        };
        db.NewsCategories.Add(category);
        db.NewsArticles.AddRange(
            CreatePublishedArticle(category, "Sort API News Zulu", $"sort-api-news-zulu-{Guid.NewGuid():N}"),
            CreatePublishedArticle(category, "Sort API News Alpha", $"sort-api-news-alpha-{Guid.NewGuid():N}"));
        await db.SaveChangesAsync();
    }

    private async Task SeedOrdersAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        db.OrderRequests.AddRange(
            CreateOrder("Sort API Order Zulu", "sort-api-order-zulu@example.com"),
            CreateOrder("Sort API Order Alpha", "sort-api-order-alpha@example.com"));
        await db.SaveChangesAsync();
    }

    private async Task SeedPromotionsAsync()
    {
        using var scope = factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        db.Promotions.AddRange(
            CreatePromotion("SORT_API_ZULU", "Sort API Zulu"),
            CreatePromotion("SORT_API_ALPHA", "Sort API Alpha"));
        await db.SaveChangesAsync();
    }

    private static NewsArticle CreatePublishedArticle(NewsCategory category, string title, string slug) => new()
    {
        CategoryId = category.Id,
        Category = category,
        Title = title,
        Slug = slug,
        Excerpt = title,
        MarkdownContent = $"# {title}",
        Status = NewsArticleStatus.Published,
        PublishedAt = DateTimeOffset.UtcNow.AddMinutes(-5)
    };

    private static OrderRequest CreateOrder(string customerName, string email) => new()
    {
        CustomerName = customerName,
        Email = email,
        PhoneNumber = "0900000000",
        PlanNameSnapshot = "Sort API Plan",
        BillingCycle = BillingCycle.Monthly,
        OriginalAmount = 100_000,
        QuotedAmount = 100_000,
        Status = OrderRequestStatus.Pending
    };

    private static Promotion CreatePromotion(string code, string name) => new()
    {
        Code = code,
        Name = name,
        DiscountType = DiscountType.Percentage,
        DiscountValue = 10,
        StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
        EndsAt = DateTimeOffset.UtcNow.AddDays(1),
        IsActive = true
    };
}
