using CloudServiceStore.Application.Landing;
using CloudServiceStore.Domain.Entities;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class LandingContentServiceTests
{
    [Fact]
    public async Task Public_content_is_not_returned_when_repository_has_no_published_content()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.GetContentAsync(true, It.IsAny<CancellationToken>()))
            .ReturnsAsync((LandingPageContent?)null);
        var service = new LandingContentService(repository.Object);

        var result = await service.GetPublicAsync(CancellationToken.None);

        Assert.Null(result);
        repository.Verify(x => x.GetTestimonialsAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Updating_content_trims_values_and_writes_audit()
    {
        var repository = CreateRepository();
        var content = CreateContent();
        repository.Setup(x => x.GetContentAsync(false, It.IsAny<CancellationToken>())).ReturnsAsync(content);
        var actorId = Guid.NewGuid();
        var service = new LandingContentService(repository.Object);

        var result = await service.UpdateContentAsync(ValidContentRequest() with { HeroTitle = "  Cloud mới  " }, actorId, CancellationToken.None);

        Assert.Equal("Cloud mới", result.HeroTitle);
        repository.Verify(x => x.AddAudit(actorId, "Landing.ContentUpdated", nameof(LandingPageContent), content.Id), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Updating_content_rejects_unsafe_cta_url()
    {
        var service = new LandingContentService(CreateRepository().Object);

        await Assert.ThrowsAsync<LandingContentValidationException>(() =>
            service.UpdateContentAsync(
                ValidContentRequest() with { PrimaryCtaUrl = "javascript:alert(1)" },
                Guid.NewGuid(),
                CancellationToken.None));
    }

    [Fact]
    public async Task Duplicate_customer_logo_name_is_rejected()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.CustomerLogoNameExistsAsync("Acme", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new LandingContentService(repository.Object);

        await Assert.ThrowsAsync<LandingContentConflictException>(() =>
            service.CreateCustomerLogoAsync(
                new CreateCustomerLogoRequest("Acme", "https://example.com/logo.png", "https://example.com", "Acme", 0, true),
                Guid.NewGuid(),
                CancellationToken.None));

        repository.Verify(x => x.AddCustomerLogo(It.IsAny<CustomerLogo>()), Times.Never);
    }

    [Fact]
    public async Task Creating_testimonial_at_existing_order_shifts_following_testimonials()
    {
        var first = new Testimonial { CustomerName = "First", CompanyName = "Acme", Quote = "One", DisplayOrder = 1 };
        var second = new Testimonial { CustomerName = "Second", CompanyName = "Beta", Quote = "Two", DisplayOrder = 2 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetTestimonialsAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second]);
        var service = new LandingContentService(repository.Object);

        var created = await service.CreateTestimonialAsync(
            new("Inserted", null, "Cloud", "Inserted quote", null, 1, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(1, created.DisplayOrder);
        Assert.Equal(2, first.DisplayOrder);
        Assert.Equal(3, second.DisplayOrder);
    }

    [Fact]
    public async Task Creating_testimonial_repairs_existing_duplicate_orders_before_inserting()
    {
        var first = new Testimonial { CustomerName = "A", CompanyName = "Acme", Quote = "One", DisplayOrder = 1 };
        var second = new Testimonial { CustomerName = "B", CompanyName = "Beta", Quote = "Two", DisplayOrder = 1 };
        var third = new Testimonial { CustomerName = "C", CompanyName = "Cloud", Quote = "Three", DisplayOrder = 2 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetTestimonialsAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second, third]);
        var service = new LandingContentService(repository.Object);

        var created = await service.CreateTestimonialAsync(
            new("Inserted", null, "New", "Inserted quote", null, 1, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(1, created.DisplayOrder);
        Assert.Equal(2, first.DisplayOrder);
        Assert.Equal(3, second.DisplayOrder);
        Assert.Equal(4, third.DisplayOrder);
    }

    [Fact]
    public async Task Updating_testimonial_moves_other_items_to_keep_orders_unique()
    {
        var first = new Testimonial { CustomerName = "First", CompanyName = "Acme", Quote = "One", DisplayOrder = 1 };
        var second = new Testimonial { CustomerName = "Second", CompanyName = "Beta", Quote = "Two", DisplayOrder = 2 };
        var third = new Testimonial { CustomerName = "Third", CompanyName = "Cloud", Quote = "Three", DisplayOrder = 3 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetTestimonialsAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second, third]);
        repository.Setup(x => x.FindTestimonialAsync(first.Id, It.IsAny<CancellationToken>())).ReturnsAsync(first);
        var service = new LandingContentService(repository.Object);

        var updated = await service.UpdateTestimonialAsync(
            first.Id,
            new("First updated", null, "Acme", "Updated quote", null, 3, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(3, updated.DisplayOrder);
        Assert.Equal(1, second.DisplayOrder);
        Assert.Equal(2, third.DisplayOrder);
    }

    [Fact]
    public async Task Creating_customer_logo_at_existing_order_shifts_following_logos()
    {
        var first = new CustomerLogo { Name = "First", AltText = "First", LogoUrl = "https://example.com/first.png", DisplayOrder = 1 };
        var second = new CustomerLogo { Name = "Second", AltText = "Second", LogoUrl = "https://example.com/second.png", DisplayOrder = 2 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetCustomerLogosAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second]);
        var service = new LandingContentService(repository.Object);

        var created = await service.CreateCustomerLogoAsync(
            new("Inserted", "https://example.com/inserted.png", null, "Inserted", 1, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(1, created.DisplayOrder);
        Assert.Equal(2, first.DisplayOrder);
        Assert.Equal(3, second.DisplayOrder);
    }

    [Fact]
    public async Task Creating_customer_logo_repairs_existing_duplicate_orders_before_inserting()
    {
        var first = new CustomerLogo { Name = "A", AltText = "A", LogoUrl = "https://example.com/a.png", DisplayOrder = 1 };
        var second = new CustomerLogo { Name = "B", AltText = "B", LogoUrl = "https://example.com/b.png", DisplayOrder = 1 };
        var third = new CustomerLogo { Name = "C", AltText = "C", LogoUrl = "https://example.com/c.png", DisplayOrder = 2 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetCustomerLogosAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second, third]);
        var service = new LandingContentService(repository.Object);

        var created = await service.CreateCustomerLogoAsync(
            new("Inserted", "https://example.com/inserted.png", null, "Inserted", 1, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(1, created.DisplayOrder);
        Assert.Equal(2, first.DisplayOrder);
        Assert.Equal(3, second.DisplayOrder);
        Assert.Equal(4, third.DisplayOrder);
    }

    [Fact]
    public async Task Updating_customer_logo_moves_other_logos_to_keep_orders_unique()
    {
        var first = new CustomerLogo { Name = "First", AltText = "First", LogoUrl = "https://example.com/first.png", DisplayOrder = 1 };
        var second = new CustomerLogo { Name = "Second", AltText = "Second", LogoUrl = "https://example.com/second.png", DisplayOrder = 2 };
        var third = new CustomerLogo { Name = "Third", AltText = "Third", LogoUrl = "https://example.com/third.png", DisplayOrder = 3 };
        var repository = CreateRepository();
        repository.Setup(x => x.GetCustomerLogosAsync(false, It.IsAny<CancellationToken>()))
            .ReturnsAsync([first, second, third]);
        repository.Setup(x => x.FindCustomerLogoAsync(first.Id, It.IsAny<CancellationToken>())).ReturnsAsync(first);
        var service = new LandingContentService(repository.Object);

        var updated = await service.UpdateCustomerLogoAsync(
            first.Id,
            new("First updated", "https://example.com/updated.png", null, "First updated", 3, true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(3, updated.DisplayOrder);
        Assert.Equal(1, second.DisplayOrder);
        Assert.Equal(2, third.DisplayOrder);
    }

    [Fact]
    public async Task Deleting_testimonial_uses_soft_delete_and_audit()
    {
        var repository = CreateRepository();
        var testimonial = new Testimonial { CustomerName = "Minh", CompanyName = "Acme", Quote = "Ổn định." };
        repository.Setup(x => x.FindTestimonialAsync(testimonial.Id, It.IsAny<CancellationToken>())).ReturnsAsync(testimonial);
        var actorId = Guid.NewGuid();
        var service = new LandingContentService(repository.Object);

        await service.DeleteTestimonialAsync(testimonial.Id, actorId, CancellationToken.None);

        Assert.True(testimonial.IsDeleted);
        Assert.Equal(actorId, testimonial.DeletedBy);
        repository.Verify(x => x.AddAudit(actorId, "Landing.TestimonialDeleted", nameof(Testimonial), testimonial.Id), Times.Once);
    }

    private static Mock<ILandingContentRepository> CreateRepository()
    {
        var repository = new Mock<ILandingContentRepository>();
        repository.Setup(x => x.GetTestimonialsAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<Testimonial>());
        repository.Setup(x => x.GetCustomerLogosAsync(It.IsAny<bool>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<CustomerLogo>());
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static LandingPageContent CreateContent() => new()
    {
        HeroEyebrow = "Cloud",
        HeroTitle = "Hạ tầng Cloud",
        HeroDescription = "Mô tả hạ tầng.",
        PrimaryCtaLabel = "Dịch vụ",
        PrimaryCtaUrl = "/services",
        SecondaryCtaLabel = "Bảng giá",
        SecondaryCtaUrl = "/pricing",
        AboutTitle = "Về chúng tôi",
        AboutMarkdown = "Nội dung giới thiệu.",
        InfrastructureMarkdown = "Nội dung hạ tầng.",
        UptimeCommitment = "99,9%",
        IsPublished = true
    };

    private static UpdateLandingPageContentRequest ValidContentRequest() => new(
        "Cloud",
        "Hạ tầng Cloud",
        "Mô tả hạ tầng.",
        "Dịch vụ",
        "/services",
        "Bảng giá",
        "/pricing",
        "Về chúng tôi",
        "Nội dung giới thiệu.",
        "Nội dung hạ tầng.",
        "99,9%",
        true);
}
