using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Integration.Tests;

public sealed class VisualQaSeedTests
{
    [Fact]
    public async Task VisualQaSeed_is_idempotent_and_matches_the_required_dataset()
    {
        var databaseName = $"VisualQaSeed-{Guid.NewGuid():N}";
        await using var firstContext = CreateContext(databaseName);

        await firstContext.SeedAsync(CloudServiceStoreApiFactory.SeedPassword, visualQaData: true);
        var firstCounts = await ReadCountsAsync(firstContext);

        await using var secondContext = CreateContext(databaseName);
        await secondContext.SeedAsync(CloudServiceStoreApiFactory.SeedPassword, visualQaData: true);
        var secondCounts = await ReadCountsAsync(secondContext);

        Assert.Equal(firstCounts, secondCounts);
        Assert.Equal(6, secondCounts.ServiceCategories);
        Assert.Equal(12, secondCounts.ServicePlans);
        Assert.Equal(6, secondCounts.Promotions);
        Assert.Equal(60, secondCounts.Orders);
        Assert.Equal(24, secondCounts.AffiliateApplications);
        Assert.Equal(16, secondCounts.NewsArticles);
        Assert.Equal(6, secondCounts.Testimonials);
        Assert.Equal(10, secondCounts.CustomerLogos);
        Assert.Equal(40, secondCounts.AuditLogs);

        var requiredCategories = new[]
        {
            "VPS",
            "Hosting",
            "Domain",
            "Email doanh nghiệp",
            "SSL",
            "Firewall chống DDoS"
        };
        var seededCategories = await secondContext.ServiceCategories
            .OrderBy(x => x.DisplayOrder)
            .Select(x => x.Name)
            .ToArrayAsync();

        Assert.Equal(requiredCategories, seededCategories);
        Assert.True(await secondContext.ServicePlans
            .Where(x => x.Category.Name == "VPS")
            .CountAsync() >= 2);
        Assert.All(
            await secondContext.ServicePlans
                .Select(x => new { x.Id, x.QrCodePath, PriceCount = x.Prices.Count, FeatureCount = x.Features.Count })
                .ToListAsync(),
            plan =>
            {
                Assert.Equal($"/api/v1/service-plans/{plan.Id}/qr-code/image", plan.QrCodePath);
                Assert.True(plan.PriceCount >= 4);
                Assert.True(plan.FeatureCount >= 1);
            });

        Assert.Equal(12, await secondContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Pending));
        Assert.Equal(12, await secondContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Contacted));
        Assert.Equal(12, await secondContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Approved));
        Assert.Equal(12, await secondContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Rejected));
        Assert.Equal(12, await secondContext.OrderRequests.CountAsync(x => x.Status == OrderRequestStatus.Cancelled));

        Assert.Equal(6, await secondContext.AffiliateApplications.CountAsync(x => x.Status == AffiliateApplicationStatus.Pending));
        Assert.Equal(6, await secondContext.AffiliateApplications.CountAsync(x => x.Status == AffiliateApplicationStatus.UnderReview));
        Assert.Equal(6, await secondContext.AffiliateApplications.CountAsync(x => x.Status == AffiliateApplicationStatus.Approved));
        Assert.Equal(6, await secondContext.AffiliateApplications.CountAsync(x => x.Status == AffiliateApplicationStatus.Rejected));
        Assert.Equal(8, await secondContext.NewsArticles.CountAsync(x => x.Status == NewsArticleStatus.Draft));
        Assert.Equal(8, await secondContext.NewsArticles.CountAsync(x => x.Status == NewsArticleStatus.Published));
        Assert.True(await secondContext.OrderRequestStatusHistories.AnyAsync());
        Assert.True(await secondContext.AffiliateApplicationStatusHistories.AnyAsync());
        Assert.True(await secondContext.PlanPrices.GroupBy(x => x.ServicePlanId).AllAsync(group => group.Count() >= 4));
        Assert.Contains(await secondContext.OrderRequests.Select(x => x.CustomerName).ToListAsync(), name => name.Contains("😀", StringComparison.Ordinal));
        Assert.Contains(await secondContext.NewsArticles.Select(x => x.MarkdownContent).ToListAsync(), content => content.Length > 1000);
    }

    [Fact]
    public void VisualQaSeed_is_rejected_outside_development_and_testing()
    {
        Assert.Throws<InvalidOperationException>(() => VisualQaSeedGuard.Validate(true, "Production"));
        VisualQaSeedGuard.Validate(true, "Development");
        VisualQaSeedGuard.Validate(true, "Testing");
        VisualQaSeedGuard.Validate(false, "Production");
    }

    private static CloudServiceStoreDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        return new CloudServiceStoreDbContext(options);
    }

    private static async Task<SeedCounts> ReadCountsAsync(CloudServiceStoreDbContext context)
    {
        return new SeedCounts(
            await context.ServiceCategories.CountAsync(),
            await context.ServicePlans.CountAsync(),
            await context.Promotions.CountAsync(),
            await context.OrderRequests.CountAsync(),
            await context.AffiliateApplications.CountAsync(),
            await context.NewsArticles.CountAsync(),
            await context.Testimonials.CountAsync(),
            await context.CustomerLogos.CountAsync(),
            await context.AuditLogs.CountAsync());
    }

    private sealed record SeedCounts(
        int ServiceCategories,
        int ServicePlans,
        int Promotions,
        int Orders,
        int AffiliateApplications,
        int NewsArticles,
        int Testimonials,
        int CustomerLogos,
        int AuditLogs);
}
