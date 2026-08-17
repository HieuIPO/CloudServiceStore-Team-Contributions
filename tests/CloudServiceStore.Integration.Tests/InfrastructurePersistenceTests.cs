using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Entities.Catalog;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Integration.Tests;

public sealed class InfrastructurePersistenceTests
{
    [Fact]
    public async Task DbContext_applies_audit_timestamps_and_soft_delete_filter()
    {
        await using var db = CreateContext();
        var category = new ServiceCategory { Name = "Cloud", Slug = "cloud" };

        db.ServiceCategories.Add(category);
        await db.SaveChangesAsync();

        Assert.NotEqual(default, category.CreatedAt);

        category.Name = "Updated Cloud";
        await db.SaveChangesAsync();

        Assert.NotNull(category.UpdatedAt);

        category.IsDeleted = true;
        category.DeletedAt = DateTimeOffset.UtcNow;
        await db.SaveChangesAsync();

        Assert.Empty(await db.ServiceCategories.ToListAsync());
        Assert.Single(await db.ServiceCategories.IgnoreQueryFilters().ToListAsync());
    }

    [Fact]
    public async Task NewsRepository_filters_public_articles_and_supports_admin_queries()
    {
        await using var db = CreateContext();
        var activeCategory = new NewsCategory { Id = Guid.NewGuid(), Name = "Cloud", Slug = "cloud", IsActive = true };
        var inactiveCategory = new NewsCategory { Id = Guid.NewGuid(), Name = "Hidden", Slug = "hidden", IsActive = false };
        var published = new NewsArticle
        {
            Id = Guid.NewGuid(),
            CategoryId = activeCategory.Id,
            Category = activeCategory,
            Title = "Cloud guide",
            Slug = "cloud-guide",
            Excerpt = "A cloud article",
            MarkdownContent = "# Published",
            Status = NewsArticleStatus.Published,
            PublishedAt = DateTimeOffset.UtcNow.AddHours(-1),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        var draft = new NewsArticle
        {
            Id = Guid.NewGuid(),
            CategoryId = activeCategory.Id,
            Category = activeCategory,
            Title = "Draft cloud guide",
            Slug = "draft-cloud-guide",
            Excerpt = "Draft article",
            MarkdownContent = "# Draft",
            Status = NewsArticleStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30)
        };
        var hidden = new NewsArticle
        {
            Id = Guid.NewGuid(),
            CategoryId = inactiveCategory.Id,
            Category = inactiveCategory,
            Title = "Hidden cloud guide",
            Slug = "hidden-cloud-guide",
            Excerpt = "Hidden article",
            MarkdownContent = "# Hidden",
            Status = NewsArticleStatus.Published,
            PublishedAt = DateTimeOffset.UtcNow.AddHours(-1),
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        db.NewsCategories.AddRange(activeCategory, inactiveCategory);
        db.NewsArticles.AddRange(published, draft, hidden);
        await db.SaveChangesAsync();
        var repository = new NewsRepository(db);

        var publicCategories = await repository.GetCategoriesAsync(new(1, 20, "cloud"), true, CancellationToken.None);
        var publicArticles = await repository.GetArticlesAsync(new(1, 20, "cloud", activeCategory.Id), true, CancellationToken.None);
        var draftArticles = await repository.GetArticlesAsync(new(1, 20, null, null, NewsArticleStatus.Draft), false, CancellationToken.None);
        var publicDetail = await repository.FindArticleBySlugAsync(published.Slug, true, CancellationToken.None);
        var draftPublicDetail = await repository.FindArticleBySlugAsync(draft.Slug, true, CancellationToken.None);
        var draftAdminDetail = await repository.FindArticleBySlugAsync(draft.Slug, false, CancellationToken.None);

        Assert.Single(publicCategories.Items);
        Assert.Single(publicArticles.Items);
        Assert.Equal(published.Id, publicArticles.Items.Single().Id);
        Assert.Single(draftArticles.Items);
        Assert.NotNull(publicDetail);
        Assert.Null(draftPublicDetail);
        Assert.Equal(draft.Id, draftAdminDetail!.Id);
    }

    [Fact]
    public async Task CatalogRepository_loads_relationships_and_applies_filters()
    {
        await using var db = CreateContext();
        var category = new ServiceCategory { Id = Guid.NewGuid(), Name = "VPS", Slug = "vps", IsActive = true, DisplayOrder = 1 };
        var inactiveCategory = new ServiceCategory { Id = Guid.NewGuid(), Name = "Hidden", Slug = "hidden", IsActive = false, DisplayOrder = 2 };
        var promotion = new Promotion
        {
            Id = Guid.NewGuid(),
            Code = "SAVE10",
            Name = "Save 10",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
            EndsAt = DateTimeOffset.UtcNow.AddDays(1)
        };
        var plan = new ServicePlan
        {
            Id = Guid.NewGuid(),
            CategoryId = category.Id,
            Category = category,
            Name = "VPS Start",
            Slug = "vps-start",
            Summary = "Starter VPS",
            IsFeatured = true,
            IsActive = true
        };
        plan.Features.Add(new ServicePlanFeature
        {
            Id = Guid.NewGuid(),
            ServicePlanId = plan.Id,
            ServicePlan = plan,
            FeatureKey = "RAM",
            DisplayName = "RAM",
            Value = "4",
            Unit = "GB",
            DisplayOrder = 1
        });
        plan.Prices.Add(new PlanPrice
        {
            Id = Guid.NewGuid(),
            ServicePlanId = plan.Id,
            ServicePlan = plan,
            BillingCycle = BillingCycle.Monthly,
            Amount = 199_000,
            Currency = "VND",
            EffectiveFrom = DateTimeOffset.UtcNow.AddDays(-1),
            IsActive = true
        });
        plan.PromotionPlans.Add(new PromotionPlan
        {
            Id = Guid.NewGuid(),
            PromotionId = promotion.Id,
            Promotion = promotion,
            ServicePlanId = plan.Id,
            ServicePlan = plan
        });
        db.ServiceCategories.AddRange(category, inactiveCategory);
        db.ServicePlans.Add(plan);
        db.Promotions.Add(promotion);
        await db.SaveChangesAsync();
        var repository = new CatalogRepository(db);

        var categories = await repository.GetCategoriesAsync(new(1, 20, "vps", true), CancellationToken.None);
        var plans = await repository.GetPlansAsync(new(1, 20, null, category.Id, true, true), CancellationToken.None);
        var detail = await repository.FindPlanAsync(plan.Id, CancellationToken.None);
        var bySlug = await repository.FindPlanBySlugAsync("vps-start", CancellationToken.None);
        var prices = await repository.GetPricesForCycleAsync(plan.Id, BillingCycle.Monthly, CancellationToken.None);

        Assert.Single(categories.Items);
        Assert.Single(plans.Items);
        Assert.Equal(plan.Id, plans.Items.Single().Id);
        Assert.Single(detail!.Features);
        Assert.Single(detail.Prices);
        Assert.Single(detail.PromotionPlans);
        Assert.Equal(plan.Id, bySlug!.Id);
        Assert.Single(prices);
        Assert.True(await repository.CategorySlugExistsAsync("vps", null, CancellationToken.None));
        Assert.True(await repository.PlanSlugExistsAsync("vps-start", null, CancellationToken.None));
        Assert.True(await repository.CategoryHasPlansAsync(category.Id, CancellationToken.None));
    }

    private static CloudServiceStoreDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseInMemoryDatabase($"InfrastructureTests-{Guid.NewGuid():N}")
            .Options;
        return new CloudServiceStoreDbContext(options);
    }
}
