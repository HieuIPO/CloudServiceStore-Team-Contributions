using System.Net;
using System.Net.Http.Json;
using CloudServiceStore.Application.EditorWorkspace;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace CloudServiceStore.Integration.Tests;

public sealed class EditorWorkspaceApiTests : IClassFixture<CloudServiceStoreApiFactory>
{
    private readonly CloudServiceStoreApiFactory factory;

    public EditorWorkspaceApiTests(CloudServiceStoreApiFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task GetWorkspace_Returns_Unauthorized_When_Anonymous()
    {
        var client = factory.CreateClient();
        var response = await client.GetAsync("/api/v1/editor-workspace");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task GetWorkspace_Returns_Paged_Results_With_Large_Dataset()
    {
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();

            // Seed 25 OrderRequests and 10 AffiliateApplications
            for (int i = 1; i <= 25; i++)
            {
                db.OrderRequests.Add(new OrderRequest
                {
                    Id = Guid.NewGuid(),
                    CustomerName = $"Large Test Customer {i}",
                    Email = $"large_test_{i}@example.com",
                    PhoneNumber = "0900000000",
                    PlanNameSnapshot = $"VPS Plan {i}",
                    BillingCycle = BillingCycle.Monthly,
                    QuotedAmount = 100000,
                    Currency = "VND",
                    Status = i % 2 == 0 ? OrderRequestStatus.Contacted : OrderRequestStatus.Pending,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-i),
                    UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-i)
                });
            }

            for (int i = 1; i <= 10; i++)
            {
                db.AffiliateApplications.Add(new AffiliateApplication
                {
                    Id = Guid.NewGuid(),
                    FullName = $"Large Test Affiliate {i}",
                    Email = $"affiliate_large_{i}@example.com",
                    PhoneNumber = "0911111111",
                    PromotionChannels = "Website",
                    Status = i % 2 == 0 ? AffiliateApplicationStatus.UnderReview : AffiliateApplicationStatus.Pending,
                    CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-i - 30),
                    UpdatedAt = DateTimeOffset.UtcNow.AddMinutes(-i - 30)
                });
            }

            await db.SaveChangesAsync();
        }

        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, "Editor");

        // Page 1 with pageSize 20
        var response = await client.GetAsync("/api/v1/editor-workspace?page=1&pageSize=20&status=inProgress");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var data = await response.Content.ReadFromJsonAsync<EditorWorkspaceDto>();
        Assert.NotNull(data);
        Assert.True(data.Queue.TotalCount >= 17); // 12 contacted orders + 5 underReview affiliates
        Assert.Equal(20, data.Queue.PageSize);
        Assert.Equal(1, data.Queue.Page);
        Assert.True(data.Queue.Items.Count <= 20);
        Assert.All(data.Queue.Items, item => Assert.Equal("inProgress", item.StatusGroup));
    }
}
