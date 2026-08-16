using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Tests;

public sealed class EntityDefaultsTests
{
    [Fact]
    public void Auditable_and_soft_deletable_entities_start_with_safe_identity_defaults()
    {
        var category = new ServiceCategory();

        Assert.NotEqual(Guid.Empty, category.Id);
        Assert.Equal(default, category.CreatedAt);
        Assert.Null(category.CreatedBy);
        Assert.Null(category.UpdatedAt);
        Assert.Null(category.UpdatedBy);
        Assert.False(category.IsDeleted);
        Assert.Null(category.DeletedAt);
        Assert.Null(category.DeletedBy);
    }

    [Fact]
    public void Catalog_entities_start_active_with_empty_relationships()
    {
        var category = new ServiceCategory();
        var plan = new ServicePlan();
        var feature = new ServicePlanFeature();
        var price = new PlanPrice();
        var promotion = new Promotion();

        Assert.True(category.IsActive);
        Assert.Empty(category.ServicePlans);
        Assert.Equal(string.Empty, category.Name);
        Assert.Equal(string.Empty, category.Slug);

        Assert.True(plan.IsActive);
        Assert.False(plan.IsFeatured);
        Assert.Empty(plan.Features);
        Assert.Empty(plan.Prices);
        Assert.Empty(plan.PromotionPlans);

        Assert.Equal(string.Empty, feature.FeatureKey);
        Assert.Equal(string.Empty, feature.DisplayName);
        Assert.Equal(string.Empty, feature.Value);
        Assert.Null(feature.Unit);

        Assert.Equal(default, price.BillingCycle);
        Assert.Equal(0m, price.Amount);
        Assert.Equal("VND", price.Currency);
        Assert.True(price.IsActive);

        Assert.True(promotion.IsActive);
        Assert.False(promotion.ShowOnPublicBanner);
        Assert.Null(promotion.BillingCycle);
        Assert.Empty(promotion.PromotionPlans);
    }

    [Fact]
    public void News_entities_start_active_and_articles_start_as_drafts()
    {
        var category = new NewsCategory();
        var article = new NewsArticle();

        Assert.True(category.IsActive);
        Assert.Empty(category.Articles);
        Assert.Equal(string.Empty, category.Name);
        Assert.Equal(string.Empty, category.Slug);

        Assert.Equal(NewsArticleStatus.Draft, article.Status);
        Assert.False(article.IsFeatured);
        Assert.Null(article.PublishedAt);
        Assert.Equal(string.Empty, article.Title);
        Assert.Equal(string.Empty, article.MarkdownContent);
    }

    [Fact]
    public void Account_entities_start_active_and_have_empty_security_collections()
    {
        var user = new AppUser();
        var role = new Role();
        var refreshToken = new RefreshToken();

        Assert.True(user.IsActive);
        Assert.Empty(user.UserRoles);
        Assert.Empty(user.RefreshTokens);
        Assert.Equal(string.Empty, user.Email);
        Assert.Equal(string.Empty, user.PasswordHash);

        Assert.Equal(string.Empty, role.Name);
        Assert.Equal(string.Empty, role.Description);
        Assert.Empty(role.UserRoles);

        Assert.Equal(string.Empty, refreshToken.TokenHash);
        Assert.Null(refreshToken.RevokedAt);
        Assert.Null(refreshToken.ReplacedByTokenHash);
    }

    [Fact]
    public void Order_and_affiliate_entities_start_in_pending_workflows()
    {
        var order = new OrderRequest();
        var affiliate = new AffiliateApplication();
        var orderHistory = new OrderRequestStatusHistory();
        var affiliateHistory = new AffiliateApplicationStatusHistory();

        Assert.Equal(OrderRequestStatus.Pending, order.Status);
        Assert.Equal(default, order.BillingCycle);
        Assert.Equal("VND", order.Currency);
        Assert.Equal("{}", order.SpecificationSnapshot);
        Assert.Empty(order.StatusHistory);

        Assert.Equal(AffiliateApplicationStatus.Pending, affiliate.Status);
        Assert.Empty(affiliate.StatusHistory);
        Assert.Null(affiliate.ReviewNote);
        Assert.Null(affiliate.ReviewedAt);

        Assert.Equal(default, orderHistory.Note);
        Assert.Null(orderHistory.ChangedBy);
        Assert.Equal(default, affiliateHistory.Note);
        Assert.Null(affiliateHistory.ChangedBy);
    }

    [Fact]
    public void Public_content_entities_start_published_or_active()
    {
        var landing = new LandingPageContent();
        var testimonial = new Testimonial();
        var logo = new CustomerLogo();
        var affiliateContent = new AffiliateProgramContent();

        Assert.True(landing.IsPublished);
        Assert.Equal(string.Empty, landing.HeroTitle);
        Assert.Equal(string.Empty, landing.PrimaryCtaUrl);

        Assert.True(testimonial.IsActive);
        Assert.Equal(string.Empty, testimonial.CustomerName);
        Assert.Equal(string.Empty, testimonial.CompanyName);

        Assert.True(logo.IsActive);
        Assert.Equal(string.Empty, logo.Name);
        Assert.Equal(string.Empty, logo.LogoUrl);

        Assert.True(affiliateContent.IsPublished);
        Assert.Equal(string.Empty, affiliateContent.PolicyMarkdown);
    }
}
