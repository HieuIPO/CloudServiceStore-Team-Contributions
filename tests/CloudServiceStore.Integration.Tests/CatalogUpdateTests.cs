using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Entities.Catalog;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Integration.Tests;

public sealed class CatalogUpdateTests
{
    [Fact]
    public async Task Updating_and_activating_a_plan_replaces_its_features_without_failure()
    {
        var databaseName = $"CatalogUpdate-{Guid.NewGuid():N}";
        Guid categoryId;
        Guid planId;

        await using (var seedContext = CreateContext(databaseName))
        {
            var category = new ServiceCategory
            {
                Name = "Test VPS",
                Slug = $"test-vps-{Guid.NewGuid():N}",
                IsActive = true
            };
            seedContext.ServiceCategories.Add(category);
            await seedContext.SaveChangesAsync();
            categoryId = category.Id;

            var plan = new ServicePlan
            {
                CategoryId = category.Id,
                Category = category,
                Name = "Test Starter",
                Slug = $"test-starter-{Guid.NewGuid():N}",
                Summary = "Initial plan summary",
                IsActive = false
            };
            plan.Features.Add(new ServicePlanFeature
            {
                ServicePlanId = plan.Id,
                ServicePlan = plan,
                FeatureKey = "CPU",
                DisplayName = "CPU",
                Value = "2",
                Unit = "vCPU",
                DisplayOrder = 1
            });
            plan.Features.Add(new ServicePlanFeature
            {
                ServicePlanId = plan.Id,
                ServicePlan = plan,
                FeatureKey = "RAM",
                DisplayName = "RAM",
                Value = "4",
                Unit = "GB",
                DisplayOrder = 2
            });
            seedContext.ServicePlans.Add(plan);
            await seedContext.SaveChangesAsync();
            planId = plan.Id;
        }

        await using (var updateContext = CreateContext(databaseName))
        {
            var service = new CatalogService(new CatalogRepository(updateContext));

            var result = await service.UpdatePlanAsync(
                planId,
                new UpdateServicePlanRequest(
                    categoryId,
                    "Test Starter",
                    "test-starter",
                    "Updated plan summary",
                    false,
                    true,
                    [
                        new ServicePlanFeatureRequest("CPU", "CPU", "4", "vCPU", 1),
                        new ServicePlanFeatureRequest("RAM", "RAM", "8", "GB", 2)
                    ]),
                Guid.NewGuid(),
                CancellationToken.None);

            Assert.True(result.IsActive);
        }

        await using (var verifyContext = CreateContext(databaseName))
        {
            var storedPlan = await verifyContext.ServicePlans
                .Include(x => x.Features)
                .SingleAsync(x => x.Id == planId);

            Assert.True(storedPlan.IsActive);
            Assert.Equal("Updated plan summary", storedPlan.Summary);
            Assert.Equal(new[] { "CPU", "RAM" }, storedPlan.Features.OrderBy(x => x.DisplayOrder).Select(x => x.FeatureKey));
            Assert.Equal("4", storedPlan.Features.Single(x => x.FeatureKey == "CPU").Value);
            Assert.Equal("8", storedPlan.Features.Single(x => x.FeatureKey == "RAM").Value);
        }
    }

    [Fact]
    public async Task Admin_plan_query_can_return_both_active_and_inactive_plans()
    {
        var databaseName = $"CatalogQuery-{Guid.NewGuid():N}";

        await using (var seedContext = CreateContext(databaseName))
        {
            var category = new ServiceCategory
            {
                Name = "Query VPS",
                Slug = $"query-vps-{Guid.NewGuid():N}",
                IsActive = true
            };
            seedContext.ServiceCategories.Add(category);
            seedContext.ServicePlans.AddRange(
                new ServicePlan
                {
                    CategoryId = category.Id,
                    Category = category,
                    Name = "Active plan",
                    Slug = $"active-plan-{Guid.NewGuid():N}",
                    Summary = "Active plan",
                    IsActive = true
                },
                new ServicePlan
                {
                    CategoryId = category.Id,
                    Category = category,
                    Name = "Inactive plan",
                    Slug = $"inactive-plan-{Guid.NewGuid():N}",
                    Summary = "Inactive plan",
                    IsActive = false
                });
            await seedContext.SaveChangesAsync();
        }

        await using (var queryContext = CreateContext(databaseName))
        {
            var service = new CatalogService(new CatalogRepository(queryContext));

            var result = await service.GetPlansAsync(
                new ServicePlanQuery(Page: 1, PageSize: 10, IsActive: true, IncludeInactive: true),
                CancellationToken.None);

            Assert.Equal(2, result.TotalCount);
            Assert.Equal(2, result.Items.Count);
            Assert.Contains(result.Items, item => item.IsActive);
            Assert.Contains(result.Items, item => !item.IsActive);
        }
    }

    [Fact]
    public async Task Creating_a_category_reuses_a_slug_from_a_soft_deleted_category()
    {
        var databaseName = $"CatalogCategorySlug-{Guid.NewGuid():N}";

        await using (var seedContext = CreateContext(databaseName))
        {
            seedContext.ServiceCategories.Add(new ServiceCategory
            {
                Name = "Retired VPS",
                Slug = "retired-vps",
                IsDeleted = true,
                DeletedAt = DateTimeOffset.UtcNow
            });
            await seedContext.SaveChangesAsync();
        }

        await using (var context = CreateContext(databaseName))
        {
            var service = new CatalogService(new CatalogRepository(context));

            var result = await service.CreateCategoryAsync(
                new CreateServiceCategoryRequest("New VPS", "retired-vps", null, 1, true),
                Guid.NewGuid(),
                CancellationToken.None);

            Assert.Equal("retired-vps", result.Slug);
            Assert.Equal("New VPS", result.Name);
        }
    }

    private static CloudServiceStoreDbContext CreateContext(string databaseName)
    {
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseInMemoryDatabase(databaseName)
            .Options;
        return new CloudServiceStoreDbContext(options);
    }
}
