using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.Landing;
using CloudServiceStore.Application.News;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Entities.Catalog;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class ServiceWorkflowCoverageTests
{
    [Fact]
    public async Task News_crud_workflow_maps_dtos_and_soft_deletes_entities()
    {
        var actorId = Guid.NewGuid();
        var category = new NewsCategory
        {
            Name = "Cloud",
            Slug = "cloud",
            Description = "Cloud news",
            DisplayOrder = 1,
            IsActive = true
        };
        var article = new NewsArticle
        {
            CategoryId = category.Id,
            Category = category,
            Title = "Cloud guide",
            Slug = "cloud-guide",
            Excerpt = "A practical guide",
            MarkdownContent = "# Guide",
            Status = NewsArticleStatus.Draft,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        var repository = new Mock<INewsRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(x => x.GetCategoriesAsync(It.IsAny<NewsCategoryQuery>(), false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([category], 1));
        repository.Setup(x => x.GetArticlesAsync(It.IsAny<NewsArticleQuery>(), false, It.IsAny<CancellationToken>()))
            .ReturnsAsync(([article], 1));
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        repository.Setup(x => x.FindArticleAsync(article.Id, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        repository.Setup(x => x.FindArticleBySlugAsync("cloud-guide", false, It.IsAny<CancellationToken>())).ReturnsAsync(article);
        var service = new NewsService(repository.Object);

        var categories = await service.GetCategoriesAsync(new(), false, CancellationToken.None);
        var createdCategory = await service.CreateCategoryAsync(
            new("Security", "security", "Security news", 2, true), actorId, CancellationToken.None);
        var updatedCategory = await service.UpdateCategoryAsync(
            category.Id, new("Cloud Platform", "cloud-platform", null, 3, true), actorId, CancellationToken.None);
        var articles = await service.GetArticlesAsync(new(), false, CancellationToken.None);
        var byId = await service.GetArticleByIdAsync(article.Id, CancellationToken.None);
        var bySlug = await service.GetArticleBySlugAsync("cloud-guide", false, CancellationToken.None);
        var createdArticle = await service.CreateArticleAsync(
            new(category.Id, "New article", "new-article", "New excerpt", "# New content", "https://example.com/thumb.png"),
            actorId,
            CancellationToken.None);
        var updatedArticle = await service.UpdateArticleAsync(
            article.Id,
            new(category.Id, "Updated guide", "updated-guide", "Updated excerpt", "# Updated", null),
            actorId,
            CancellationToken.None);
        var unpublished = await service.UnpublishArticleAsync(article.Id, actorId, CancellationToken.None);
        await service.DeleteArticleAsync(article.Id, actorId, CancellationToken.None);
        await service.DeleteCategoryAsync(category.Id, actorId, CancellationToken.None);

        Assert.Equal(1, categories.TotalCount);
        Assert.Equal("security", createdCategory.Slug);
        Assert.Equal("Cloud Platform", updatedCategory.Name);
        Assert.Single(articles.Items);
        Assert.Equal(article.Id, byId?.Id);
        Assert.Equal(article.Id, bySlug?.Id);
        Assert.Equal(NewsArticleStatus.Draft, createdArticle.Status);
        Assert.Equal("Updated guide", updatedArticle.Title);
        Assert.Null(unpublished.PublishedAt);
        Assert.True(article.IsDeleted);
        Assert.True(category.IsDeleted);
    }

    [Fact]
    public async Task Catalog_crud_workflow_maps_prices_features_promotions_and_qr()
    {
        var actorId = Guid.NewGuid();
        var now = DateTimeOffset.UtcNow;
        var category = new ServiceCategory { Name = "VPS", Slug = "vps", IsActive = true };
        var plan = new ServicePlan
        {
            CategoryId = category.Id,
            Category = category,
            Name = "VPS Basic",
            Slug = "vps-basic",
            Summary = "Starter VPS",
            IsFeatured = true,
            IsActive = true
        };
        plan.Features.Add(new ServicePlanFeature { FeatureKey = "CPU", DisplayName = "CPU", Value = "2", Unit = "core" });
        plan.Prices.Add(new PlanPrice
        {
            ServicePlanId = plan.Id,
            BillingCycle = BillingCycle.Monthly,
            Amount = 200_000,
            Currency = "VND",
            EffectiveFrom = now.AddDays(-1),
            IsActive = true
        });
        var promotion = new Promotion
        {
            Code = "SAVE10",
            Name = "Save ten",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            StartsAt = now.AddDays(-1),
            EndsAt = now.AddDays(1),
            IsActive = true
        };
        plan.PromotionPlans.Add(new PromotionPlan { ServicePlan = plan, Promotion = promotion });

        var repository = new Mock<ICatalogRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        repository.Setup(x => x.GetCategoriesAsync(It.IsAny<ServiceCategoryQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([category], 1));
        repository.Setup(x => x.GetPlansAsync(It.IsAny<ServicePlanQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([plan], 1));
        repository.Setup(x => x.FindCategoryAsync(category.Id, It.IsAny<CancellationToken>())).ReturnsAsync(category);
        repository.Setup(x => x.FindPlanAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        repository.Setup(x => x.FindPlanBySlugAsync("vps-basic", It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        repository.Setup(x => x.GetPricesForCycleAsync(plan.Id, BillingCycle.Yearly, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<PlanPrice>());
        var closingPrice = plan.Prices.Single();
        repository.Setup(x => x.FindPriceAsync(closingPrice.Id, It.IsAny<CancellationToken>())).ReturnsAsync(closingPrice);
        var qr = new Mock<IQrCodeService>();
        qr.Setup(x => x.GeneratePng(It.IsAny<string>())).Returns([137, 80, 78, 71]);
        var service = new CatalogService(repository.Object, qrCodeService: qr.Object);
        var features = new[] { new ServicePlanFeatureRequest("RAM", "Memory", "4", "GB", 1) };

        var categories = await service.GetCategoriesAsync(new(), CancellationToken.None);
        var createdCategory = await service.CreateCategoryAsync(
            new("Hosting", "hosting", null, 2, true), actorId, CancellationToken.None);
        var updatedCategory = await service.UpdateCategoryAsync(
            category.Id, new("Cloud VPS", "cloud-vps", "Managed", 1, true), actorId, CancellationToken.None);
        var plans = await service.GetPlansAsync(new(), CancellationToken.None);
        var byId = await service.GetPlanAsync(plan.Id, CancellationToken.None);
        var bySlug = await service.GetPlanBySlugAsync("vps-basic", CancellationToken.None);
        var createdPlan = await service.CreatePlanAsync(
            new(category.Id, "VPS Pro", "vps-pro", "Professional VPS", true, true, features),
            actorId,
            CancellationToken.None);
        var updatedPlan = await service.UpdatePlanAsync(
            plan.Id,
            new(category.Id, "VPS Plus", "vps-plus", "Updated VPS", false, true, features),
            actorId,
            CancellationToken.None);
        var price = await service.CreatePriceAsync(
            plan.Id,
            new(BillingCycle.Yearly, 2_000_000, "vnd", now.AddDays(2), now.AddYears(1), true),
            actorId,
            CancellationToken.None);
        var closed = await service.ClosePriceAsync(
            closingPrice.Id, new(now.AddHours(1)), actorId, CancellationToken.None);
        var image = await service.GetQrCodeImageAsync(plan.Id, "https://cloud.example", CancellationToken.None);
        await service.DeletePlanAsync(plan.Id, actorId, CancellationToken.None);
        await service.DeleteCategoryAsync(category.Id, actorId, CancellationToken.None);

        Assert.Equal(1, categories.TotalCount);
        Assert.Equal("hosting", createdCategory.Slug);
        Assert.Equal("Cloud VPS", updatedCategory.Name);
        Assert.Equal(180_000, plans.Items.Single().PromotionalMonthlyPrice);
        Assert.Equal(plan.Id, byId?.Id);
        Assert.Equal(plan.Id, bySlug?.Id);
        Assert.Single(createdPlan.Features);
        Assert.Equal("VPS Plus", updatedPlan.Name);
        Assert.Equal("VND", price.Currency);
        Assert.NotNull(closed.EffectiveTo);
        Assert.Equal("image/png", image.ContentType);
        Assert.True(plan.IsDeleted);
        Assert.True(category.IsDeleted);
    }

    [Fact]
    public async Task Landing_crud_workflow_maps_public_and_admin_content()
    {
        var actorId = Guid.NewGuid();
        var content = CreateLandingContent();
        var testimonial = new Testimonial
        {
            CustomerName = "Minh",
            CustomerRole = "CTO",
            CompanyName = "Acme",
            Quote = "Reliable service",
            AvatarUrl = "https://example.com/avatar.png",
            DisplayOrder = 1,
            IsActive = true
        };
        var logo = new CustomerLogo
        {
            Name = "Acme",
            LogoUrl = "https://example.com/logo.png",
            WebsiteUrl = "https://example.com",
            AltText = "Acme logo",
            DisplayOrder = 1,
            IsActive = true
        };
        var repository = new Mock<ILandingContentRepository>();
        repository.Setup(x => x.GetContentAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync(content);
        repository.Setup(x => x.GetTestimonialsAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync([testimonial]);
        repository.Setup(x => x.GetCustomerLogosAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>())).ReturnsAsync([logo]);
        repository.Setup(x => x.FindTestimonialAsync(testimonial.Id, It.IsAny<CancellationToken>())).ReturnsAsync(testimonial);
        repository.Setup(x => x.FindCustomerLogoAsync(logo.Id, It.IsAny<CancellationToken>())).ReturnsAsync(logo);
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        var service = new LandingContentService(repository.Object);

        var publicContent = await service.GetPublicAsync(CancellationToken.None);
        var adminContent = await service.GetAdminAsync(CancellationToken.None);
        var createdTestimonial = await service.CreateTestimonialAsync(
            new("Lan", null, "Beta", "Fast support", null, 2, true), actorId, CancellationToken.None);
        var updatedTestimonial = await service.UpdateTestimonialAsync(
            testimonial.Id,
            new("Minh Tran", "CEO", "Acme", "Very reliable", "https://example.com/new.png", 3, false),
            actorId,
            CancellationToken.None);
        var createdLogo = await service.CreateCustomerLogoAsync(
            new("Beta", "https://example.com/beta.png", null, "Beta logo", 2, true),
            actorId,
            CancellationToken.None);
        var updatedLogo = await service.UpdateCustomerLogoAsync(
            logo.Id,
            new("Acme Corp", "https://example.com/acme.png", "https://acme.example", "Acme Corp logo", 3, false),
            actorId,
            CancellationToken.None);
        await service.DeleteTestimonialAsync(testimonial.Id, actorId, CancellationToken.None);
        await service.DeleteCustomerLogoAsync(logo.Id, actorId, CancellationToken.None);

        Assert.NotNull(publicContent);
        Assert.Single(publicContent.Testimonials);
        Assert.Single(adminContent.CustomerLogos);
        Assert.Equal("Lan", createdTestimonial.CustomerName);
        Assert.Equal("Minh Tran", updatedTestimonial.CustomerName);
        Assert.Equal("Beta", createdLogo.Name);
        Assert.Equal("Acme Corp", updatedLogo.Name);
        Assert.True(testimonial.IsDeleted);
        Assert.True(logo.IsDeleted);
    }

    private static LandingPageContent CreateLandingContent() => new()
    {
        HeroEyebrow = "Cloud",
        HeroTitle = "Cloud infrastructure",
        HeroDescription = "Reliable infrastructure",
        PrimaryCtaLabel = "Services",
        PrimaryCtaUrl = "/services",
        SecondaryCtaLabel = "Pricing",
        SecondaryCtaUrl = "/pricing",
        AboutTitle = "About us",
        AboutMarkdown = "About content",
        InfrastructureMarkdown = "Infrastructure content",
        UptimeCommitment = "99.9%",
        IsPublished = true
    };
}
