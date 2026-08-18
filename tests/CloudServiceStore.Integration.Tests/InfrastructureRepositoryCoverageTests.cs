using CloudServiceStore.Application.Affiliates;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Domain.Entities;

using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Authentication;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Integration.Tests;

public sealed class InfrastructureRepositoryCoverageTests
{
    [Fact]
    public async Task AuthRepository_loads_users_roles_refresh_tokens_and_audits()
    {
        await using var db = CreateContext();
        var role = new Role { Name = "Admin", Description = "Administrator" };
        var user = new AppUser { Email = "admin@example.com", FullName = "Admin User" };
        var userRole = new AppUserRole { AppUserId = user.Id, AppUser = user, RoleId = role.Id, Role = role };
        user.UserRoles.Add(userRole);
        role.UserRoles.Add(userRole);
        var refreshToken = new RefreshToken
        {
            AppUserId = user.Id,
            AppUser = user,
            TokenHash = "refresh-hash",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(7)
        };
        user.RefreshTokens.Add(refreshToken);
        db.Roles.Add(role);
        db.AppUsers.Add(user);
        db.Set<AppUserRole>().Add(userRole);
        db.RefreshTokens.Add(refreshToken);
        await db.SaveChangesAsync();

        var repository = new AuthRepository(db);
        var foundByEmail = await repository.FindByEmailAsync(user.Email, CancellationToken.None);
        var foundRole = await repository.FindRoleByNameAsync(role.Name, CancellationToken.None);
        var foundRefresh = await repository.FindRefreshTokenAsync(refreshToken.TokenHash, CancellationToken.None);
        var foundById = await repository.FindUserByIdAsync(user.Id, CancellationToken.None);

        Assert.Equal(user.Id, foundByEmail!.Id);
        Assert.Contains(foundByEmail.UserRoles, link => link.Role.Name == "Admin");
        Assert.Equal(role.Id, foundRole!.Id);
        Assert.Equal(user.Id, foundRefresh!.AppUser.Id);
        Assert.Contains(foundRefresh.AppUser.UserRoles, link => link.Role.Name == "Admin");
        Assert.Equal(user.Id, foundById!.Id);

        repository.AddAuditLog(new AuditLog
        {
            AppUserId = user.Id,
            Action = "Auth.Tested",
            EntityName = nameof(AppUser),
            EntityId = user.Id
        });
        await repository.SaveChangesAsync(CancellationToken.None);

        Assert.Single(await db.AuditLogs.Where(x => x.Action == "Auth.Tested").ToListAsync());
    }

    [Fact]
    public async Task OrderRepository_filters_orders_loads_plan_details_and_scopes_customer_results()
    {
        await using var db = CreateContext();
        var category = new ServiceCategory { Name = "Cloud", Slug = "cloud" };
        var plan = CreatePlan(category, "Starter VPS", "starter-vps");
        plan.Features.Add(new ServicePlanFeature
        {
            ServicePlanId = plan.Id,
            FeatureKey = "ram",
            DisplayName = "RAM",
            Value = "4",
            Unit = "GB",
            DisplayOrder = 1
        });
        plan.Prices.Add(new PlanPrice
        {
            ServicePlanId = plan.Id,
            BillingCycle = BillingCycle.Monthly,
            Amount = 250_000,
            Currency = "VND",
            EffectiveFrom = DateTimeOffset.UtcNow.AddDays(-1)
        });
        var ownerId = Guid.NewGuid();
        var order = new OrderRequest
        {
            AppUserId = ownerId,
            ServicePlanId = plan.Id,
            ServicePlan = plan,
            CustomerName = "Alice Cloud",
            Email = "alice@example.com",
            PhoneNumber = "0900000001",
            CompanyName = "Cloud Co",
            BillingCycle = BillingCycle.Monthly,
            OriginalAmount = 250_000,
            QuotedAmount = 225_000,
            PlanNameSnapshot = plan.Name,
            Status = OrderRequestStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        order.StatusHistory.Add(new OrderRequestStatusHistory
        {
            OrderRequestId = order.Id,
            FromStatus = OrderRequestStatus.Pending,
            ToStatus = OrderRequestStatus.Contacted,
            Note = "Called customer",
            CreatedAt = order.CreatedAt.AddMinutes(10)
        });
        var oldOrder = new OrderRequest
        {
            ServicePlanId = plan.Id,
            ServicePlan = plan,
            CustomerName = "Bob Cloud",
            Email = "bob@example.com",
            PhoneNumber = "0900000002",
            BillingCycle = BillingCycle.Yearly,
            OriginalAmount = 2_500_000,
            QuotedAmount = 2_000_000,
            PlanNameSnapshot = plan.Name,
            Status = OrderRequestStatus.Approved,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
        };
        db.ServiceCategories.Add(category);
        db.ServicePlans.Add(plan);
        db.OrderRequests.AddRange(order, oldOrder);
        await db.SaveChangesAsync();

        var repository = new OrderRepository(db);
        var loadedPlan = await repository.FindPlanForOrderAsync(plan.Id, CancellationToken.None);
        var duplicate = await repository.HasRecentDuplicateAsync(
            order.Email,
            order.PhoneNumber,
            plan.Id,
            DateTimeOffset.UtcNow.AddDays(-1),
            CancellationToken.None);
        var filtered = await repository.GetAsync(
            new OrderRequestQuery(1, 10, "Alice", plan.Id, OrderRequestStatus.Pending),
            CancellationToken.None);
        var customerOrders = await repository.GetForCustomerAsync(
            ownerId,
            new CustomerOrderQuery(1, 10, OrderRequestStatus.Pending),
            CancellationToken.None);
        var detail = await repository.FindAsync(order.Id, CancellationToken.None);
        var ownedDetail = await repository.FindForCustomerAsync(order.Id, ownerId, CancellationToken.None);
        var foreignDetail = await repository.FindForCustomerAsync(order.Id, Guid.NewGuid(), CancellationToken.None);

        Assert.NotNull(loadedPlan);
        Assert.Single(loadedPlan!.Features);
        Assert.Single(loadedPlan.Prices);
        Assert.True(duplicate);
        Assert.Equal(1, filtered.Total);
        Assert.Equal(order.Id, filtered.Items.Single().Id);
        Assert.Equal(1, customerOrders.Total);
        Assert.Equal(order.Id, customerOrders.Items.Single().Id);
        Assert.Single(detail!.StatusHistory);
        Assert.Equal(order.Id, ownedDetail!.Id);
        Assert.Null(foreignDetail);

        repository.AddAudit(null, "Order.Tested", nameof(OrderRequest), order.Id, null, null, "127.0.0.1");
        await repository.SaveChangesAsync(CancellationToken.None);
        Assert.Single(await db.AuditLogs.Where(x => x.Action == "Order.Tested").ToListAsync());
    }

    [Fact]
    public async Task PromotionRepository_filters_banners_and_syncs_plan_links()
    {
        await using var db = CreateContext();
        var category = new ServiceCategory { Name = "Cloud", Slug = "cloud" };
        var firstPlan = CreatePlan(category, "First Plan", "first-plan");
        var secondPlan = CreatePlan(category, "Second Plan", "second-plan");
        var promotion = new Promotion
        {
            Code = "SAVE10",
            Name = "Save ten",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
            EndsAt = DateTimeOffset.UtcNow.AddDays(1),
            IsActive = true,
            ShowOnPublicBanner = true
        };
        var inactivePromotion = new Promotion
        {
            Code = "OLD10",
            Name = "Old promotion",
            DiscountType = DiscountType.FixedAmount,
            DiscountValue = 10_000,
            StartsAt = DateTimeOffset.UtcNow.AddDays(-3),
            EndsAt = DateTimeOffset.UtcNow.AddDays(-2),
            IsActive = false,
            ShowOnPublicBanner = true
        };
        var existingLink = new PromotionPlan
        {
            PromotionId = promotion.Id,
            Promotion = promotion,
            ServicePlanId = firstPlan.Id,
            ServicePlan = firstPlan
        };
        db.ServiceCategories.Add(category);
        db.ServicePlans.AddRange(firstPlan, secondPlan);
        db.Promotions.AddRange(promotion, inactivePromotion);
        db.PromotionPlans.Add(existingLink);
        await db.SaveChangesAsync();

        var repository = new PromotionRepository(db);
        var active = await repository.GetPromotionsAsync(new(1, 10, true), CancellationToken.None);
        var linked = await repository.GetPromotionsAsync(new(1, 10, null, firstPlan.Id), CancellationToken.None);
        var found = await repository.FindPromotionAsync(promotion.Id, CancellationToken.None);
        var banners = await repository.GetPublicBannerPromotionsAsync(inactivePromotion.Id, CancellationToken.None);
        var existingCode = await repository.CodeExistsAsync("SAVE10", null, CancellationToken.None);
        var availableCode = await repository.CodeExistsAsync("SAVE10", promotion.Id, CancellationToken.None);
        var existingPlans = await repository.GetExistingPlanIdsAsync(new[] { firstPlan.Id, secondPlan.Id, Guid.NewGuid() }, CancellationToken.None);

        Assert.Equal(1, active.Total);
        Assert.Equal(promotion.Id, active.Items.Single().Id);
        Assert.Single(linked.Items);
        Assert.Equal(promotion.Id, found!.Id);
        Assert.Single(found.PromotionPlans);
        Assert.Single(banners);
        Assert.Equal(promotion.Id, banners.Single().Id);
        Assert.True(existingCode);
        Assert.False(availableCode);
        Assert.Equal(2, existingPlans.Count);

        var actorId = Guid.NewGuid();
        repository.SyncPromotionPlans(found, new[] { secondPlan.Id, secondPlan.Id }, actorId);
        await repository.SaveChangesAsync(CancellationToken.None);
        var synced = await repository.FindPromotionAsync(promotion.Id, CancellationToken.None);
        var persistedLinks = await db.PromotionPlans
            .Where(x => x.PromotionId == promotion.Id)
            .ToListAsync();
        var syncedLink = synced!.PromotionPlans.DistinctBy(x => x.Id).Single();

        Assert.Single(persistedLinks);
        Assert.Equal(secondPlan.Id, persistedLinks.Single().ServicePlanId);
        Assert.Equal(secondPlan.Id, syncedLink.ServicePlanId);
        Assert.Equal(actorId, syncedLink.CreatedBy);
    }

    [Fact]
    public async Task AffiliateRepository_filters_applications_and_scopes_customer_results()
    {
        await using var db = CreateContext();
        var ownerId = Guid.NewGuid();
        var program = new AffiliateProgramContent
        {
            Title = "Partner program",
            Summary = "Partner summary",
            CommissionSummary = "10 percent",
            PolicyMarkdown = "# Policy",
            IsPublished = true
        };
        var application = new AffiliateApplication
        {
            AppUserId = ownerId,
            FullName = "Alice Partner",
            Email = "alice-affiliate@example.com",
            PhoneNumber = "0900000003",
            CompanyName = "Partner Co",
            PromotionChannels = "Website",
            AudienceDescription = "Cloud users",
            Status = AffiliateApplicationStatus.Pending,
            CreatedAt = DateTimeOffset.UtcNow.AddHours(-2)
        };
        application.StatusHistory.Add(new AffiliateApplicationStatusHistory
        {
            AffiliateApplicationId = application.Id,
            FromStatus = AffiliateApplicationStatus.Pending,
            ToStatus = AffiliateApplicationStatus.UnderReview,
            CreatedAt = application.CreatedAt.AddMinutes(5)
        });
        var other = new AffiliateApplication
        {
            FullName = "Bob Partner",
            Email = "bob-affiliate@example.com",
            PhoneNumber = "0900000004",
            PromotionChannels = "Community",
            AudienceDescription = "Developers",
            Status = AffiliateApplicationStatus.Approved,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-5)
        };
        db.AffiliateProgramContents.Add(program);
        db.AffiliateApplications.AddRange(application, other);
        await db.SaveChangesAsync();

        var repository = new AffiliateRepository(db);
        var foundProgram = await repository.FindProgramContentAsync(CancellationToken.None);
        var recent = await repository.HasRecentApplicationAsync(application.Email, DateTimeOffset.UtcNow.AddDays(-1), CancellationToken.None);
        var filtered = await repository.GetApplicationsAsync(
            new AffiliateApplicationQuery(1, 10, "Alice", AffiliateApplicationStatus.Pending),
            CancellationToken.None);
        var customerApplications = await repository.GetApplicationsForCustomerAsync(
            ownerId,
            new CustomerAffiliateQuery(1, 10, AffiliateApplicationStatus.Pending),
            CancellationToken.None);
        var detail = await repository.FindApplicationAsync(application.Id, CancellationToken.None);
        var ownedDetail = await repository.FindApplicationForCustomerAsync(application.Id, ownerId, CancellationToken.None);
        var foreignDetail = await repository.FindApplicationForCustomerAsync(application.Id, Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(program.Id, foundProgram!.Id);
        Assert.True(recent);
        Assert.Equal(1, filtered.Total);
        Assert.Equal(application.Id, filtered.Items.Single().Id);
        Assert.Equal(1, customerApplications.Total);
        Assert.Equal(application.Id, customerApplications.Items.Single().Id);
        Assert.Single(detail!.StatusHistory);
        Assert.Equal(application.Id, ownedDetail!.Id);
        Assert.Null(foreignDetail);
    }

    [Fact]
    public async Task LandingContentRepository_applies_public_filters_ordering_and_soft_delete_lookup()
    {
        await using var db = CreateContext();
        var unpublished = new LandingPageContent
        {
            HeroTitle = "Draft landing",
            IsPublished = false,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-2)
        };
        var published = new LandingPageContent
        {
            HeroTitle = "Published landing",
            IsPublished = true,
            CreatedAt = DateTimeOffset.UtcNow.AddDays(-1)
        };
        var firstTestimonial = new Testimonial { CustomerName = "Zed", CompanyName = "Zed Co", Quote = "Great", DisplayOrder = 2, IsActive = true };
        var secondTestimonial = new Testimonial { CustomerName = "Alpha", CompanyName = "Alpha Co", Quote = "Fast", DisplayOrder = 1, IsActive = false };
        var activeLogo = new CustomerLogo { Name = "Active logo", LogoUrl = "/active.svg", AltText = "Active", DisplayOrder = 1, IsActive = true };
        var deletedLogo = new CustomerLogo { Name = "Deleted logo", LogoUrl = "/deleted.svg", AltText = "Deleted", IsActive = false, IsDeleted = true };
        db.LandingPageContents.AddRange(unpublished, published);
        db.Testimonials.AddRange(firstTestimonial, secondTestimonial);
        db.CustomerLogos.AddRange(activeLogo, deletedLogo);
        await db.SaveChangesAsync();

        var repository = new LandingContentRepository(db);
        var publicContent = await repository.GetContentAsync(true, CancellationToken.None);
        var adminContent = await repository.GetContentAsync(false, CancellationToken.None);
        var publicTestimonials = await repository.GetTestimonialsAsync(true, CancellationToken.None);
        var allTestimonials = await repository.GetTestimonialsAsync(false, CancellationToken.None);
        var publicLogos = await repository.GetCustomerLogosAsync(true, CancellationToken.None);
        var allLogos = await repository.GetCustomerLogosAsync(false, CancellationToken.None);

        Assert.Equal(published.Id, publicContent!.Id);
        Assert.Equal(unpublished.Id, adminContent!.Id);
        Assert.Single(publicTestimonials);
        Assert.Equal(firstTestimonial.Id, publicTestimonials.Single().Id);
        Assert.Equal(2, allTestimonials.Count);
        Assert.Single(publicLogos);
        Assert.Equal(activeLogo.Id, publicLogos.Single().Id);
        Assert.Single(allLogos);
        Assert.Equal(activeLogo.Id, allLogos.Single().Id);
        Assert.NotNull(await repository.FindTestimonialAsync(firstTestimonial.Id, CancellationToken.None));
        Assert.NotNull(await repository.FindCustomerLogoAsync(activeLogo.Id, CancellationToken.None));
        Assert.True(await repository.CustomerLogoNameExistsAsync("Deleted logo", null, CancellationToken.None));
        Assert.False(await repository.CustomerLogoNameExistsAsync("Active logo", activeLogo.Id, CancellationToken.None));
    }

    [Fact]
    public async Task ReportingRepository_aggregates_dashboard_audits_and_export_rows()
    {
        await using var db = CreateContext();
        var from = new DateTimeOffset(2026, 8, 1, 0, 0, 0, TimeSpan.Zero);
        var to = new DateTimeOffset(2026, 8, 31, 23, 59, 59, TimeSpan.Zero);
        var category = new ServiceCategory { Name = "Cloud hosting", Slug = "cloud-hosting" };
        var plan = CreatePlan(category, "Starter", "starter");
        var user = new AppUser { Email = "admin@example.com", FullName = "Admin" };
        var inPeriodPending = CreateOrder(plan, user.Id, "Alice", "alice@example.com", OrderRequestStatus.Pending, from.AddDays(2), 100_000, 100_000);
        var inPeriodApproved = CreateOrder(plan, user.Id, "Bob", "bob@example.com", OrderRequestStatus.Approved, from.AddDays(3), 200_000, 180_000);
        var outsideOrder = CreateOrder(plan, null, "Old", "old@example.com", OrderRequestStatus.Approved, from.AddDays(-10), 300_000, 250_000);
        var affiliatePending = new AffiliateApplication { FullName = "Pending affiliate", Email = "pending-affiliate@example.com", PhoneNumber = "0900000005", PromotionChannels = "Blog", AudienceDescription = "Cloud", Status = AffiliateApplicationStatus.Pending };
        var affiliateApproved = new AffiliateApplication { FullName = "Approved affiliate", Email = "approved-affiliate@example.com", PhoneNumber = "0900000006", PromotionChannels = "Video", AudienceDescription = "Developers", Status = AffiliateApplicationStatus.Approved };
        var newsCategory = new NewsCategory { Name = "Technology", Slug = "technology" };
        var publishedNews = new NewsArticle
        {
            CategoryId = newsCategory.Id,
            Category = newsCategory,
            Title = "Published news",
            Slug = "published-news",
            Excerpt = "News",
            MarkdownContent = "# News",
            Status = NewsArticleStatus.Published
        };
        var draftNews = new NewsArticle
        {
            CategoryId = newsCategory.Id,
            Category = newsCategory,
            Title = "Draft news",
            Slug = "draft-news",
            Excerpt = "Draft",
            MarkdownContent = "# Draft",
            Status = NewsArticleStatus.Draft
        };
        var audit = new AuditLog
        {
            AppUserId = user.Id,
            Action = "Order.Approved",
            EntityName = nameof(OrderRequest),
            EntityId = inPeriodApproved.Id,
            OldValuesJson = "{}",
            NewValuesJson = "{\"status\":2}",
            IpAddress = "127.0.0.1",
            OccurredAt = from.AddDays(4)
        };
        db.ServiceCategories.Add(category);
        db.ServicePlans.Add(plan);
        db.AppUsers.Add(user);
        db.OrderRequests.AddRange(inPeriodPending, inPeriodApproved, outsideOrder);
        db.AffiliateApplications.AddRange(affiliatePending, affiliateApproved);
        db.NewsCategories.Add(newsCategory);
        db.NewsArticles.AddRange(publishedNews, draftNews);
        db.AuditLogs.Add(audit);
        await db.SaveChangesAsync();

        inPeriodPending.CreatedAt = from.AddDays(2);
        inPeriodApproved.CreatedAt = from.AddDays(3);
        outsideOrder.CreatedAt = from.AddDays(-10);
        await db.SaveChangesAsync();

        var repository = new ReportingRepository(db);
        var summary = await repository.GetOrderSummaryAsync(from, to, CancellationToken.None);
        var popularPlans = await repository.GetPopularPlansAsync(from, to, CancellationToken.None);
        var serviceInterest = await repository.GetServiceInterestAsync(from, to, CancellationToken.None);
        var auditLogs = await repository.GetAuditLogsAsync(
            new AuditLogQuery(1, 10, "admin@example.com", "Order.Approved", nameof(OrderRequest), from, to),
            CancellationToken.None);
        var exportRows = await repository.GetOrderExportRowsAsync(
            new OrderExportQuery(from, to, OrderRequestStatus.Approved),
            CancellationToken.None);

        Assert.Equal(3, summary.TotalOrders);
        Assert.Equal(2, summary.PeriodOrders);
        Assert.Equal(1, summary.PendingOrders);
        Assert.Equal(2, summary.ApprovedOrders);
        Assert.Equal(430_000, summary.ApprovedQuotedAmount);
        Assert.Equal(2, summary.TotalAffiliateApplications);
        Assert.Equal(1, summary.PendingAffiliateApplications);
        Assert.Equal(1, summary.PublishedNewsArticles);
        Assert.Contains(summary.Statuses, status => status.Name == nameof(OrderRequestStatus.Pending) && status.Count == 1);
        Assert.Single(summary.MonthlyOrders);
        Assert.Equal(2, summary.MonthlyOrders.Single().Count);
        Assert.Single(popularPlans);
        Assert.Equal(2, popularPlans.Single().OrderCount);
        Assert.Single(serviceInterest);
        Assert.Equal("Cloud hosting", serviceInterest.Single().ServiceName);
        Assert.Single(auditLogs.Items);
        Assert.Equal("admin@example.com", auditLogs.Items.Single().ActorEmail);
        Assert.Single(exportRows);
        Assert.Equal(inPeriodApproved.Id, exportRows.Single().Id);

        repository.AddExportAudit(user.Id, exportRows.Count, "127.0.0.1");
        await repository.SaveChangesAsync(CancellationToken.None);
        var exportAudit = await db.AuditLogs.SingleAsync(x => x.Action == "Orders.Exported");
        Assert.Contains("RowCount", exportAudit.NewValuesJson);
    }

    private static ServicePlan CreatePlan(ServiceCategory category, string name, string slug) => new()
    {
        CategoryId = category.Id,
        Category = category,
        Name = name,
        Slug = slug,
        Summary = $"{name} summary",
        IsActive = true
    };

    private static OrderRequest CreateOrder(
        ServicePlan plan,
        Guid? ownerId,
        string customerName,
        string email,
        OrderRequestStatus status,
        DateTimeOffset createdAt,
        decimal originalAmount,
        decimal quotedAmount) => new()
        {
            AppUserId = ownerId,
            ServicePlanId = plan.Id,
            ServicePlan = plan,
            CustomerName = customerName,
            Email = email,
            PhoneNumber = "0900000000",
            BillingCycle = BillingCycle.Monthly,
            OriginalAmount = originalAmount,
            QuotedAmount = quotedAmount,
            PlanNameSnapshot = plan.Name,
            Status = status,
            CreatedAt = createdAt
        };

    private static CloudServiceStoreDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseInMemoryDatabase($"RepositoryCoverage-{Guid.NewGuid():N}")
            .Options;
        return new CloudServiceStoreDbContext(options);
    }
}
