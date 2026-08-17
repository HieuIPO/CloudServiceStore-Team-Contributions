using CloudServiceStore.Application.Affiliates;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class AffiliateServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 30, 3, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Public_does_not_read_unpublished_program_content()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.FindProgramContentAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AffiliateProgramContent { IsPublished = false, Title = "Affiliate" });
        var service = CreateService(repository);

        var result = await service.GetProgramContentAsync(true, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Valid_application_is_normalized_and_audited()
    {
        var repository = CreateRepository();
        var service = CreateService(repository);

        var owner = CustomerOwner();
        var result = await service.CreateApplicationAsync(ValidRequest(), owner, "127.0.0.1", CancellationToken.None);

        Assert.Equal(AffiliateApplicationStatus.Pending, result.Status);
        repository.Verify(x => x.AddApplication(It.Is<AffiliateApplication>(application =>
            application.AppUserId == owner.UserId
            && application.FullName == owner.FullName
            && application.Email == owner.Email
            && application.PhoneNumber == "0901234567"
            && application.StatusHistory.Count == 1)), Times.Once);
        repository.Verify(x => x.AddAudit(owner.UserId, "Affiliate.ApplicationCreated", nameof(AffiliateApplication),
            It.IsAny<Guid>(), null, It.IsAny<string>(), "127.0.0.1"), Times.Once);
    }

    [Fact]
    public async Task Recent_duplicate_application_is_rejected()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.HasRecentApplicationAsync("partner@example.com", It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<AffiliateConflictException>(() =>
            service.CreateApplicationAsync(ValidRequest(), CustomerOwner(), null, CancellationToken.None));
    }

    [Fact]
    public async Task Unsafe_website_url_is_rejected()
    {
        var service = CreateService(CreateRepository());
        var request = ValidRequest() with { WebsiteUrl = "javascript:alert(1)" };

        await Assert.ThrowsAsync<AffiliateValidationException>(() =>
            service.CreateApplicationAsync(request, CustomerOwner(), null, CancellationToken.None));
    }

    [Fact]
    public async Task Reject_requires_review_note()
    {
        var repository = CreateRepository();
        var application = CreateApplication(AffiliateApplicationStatus.Pending);
        repository.Setup(x => x.FindApplicationAsync(application.Id, It.IsAny<CancellationToken>())).ReturnsAsync(application);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<AffiliateValidationException>(() =>
            service.UpdateStatusAsync(application.Id, new(AffiliateApplicationStatus.Rejected, null),
                Guid.NewGuid(), null, CancellationToken.None));
    }

    [Fact]
    public async Task Approved_application_cannot_be_reopened()
    {
        var repository = CreateRepository();
        var application = CreateApplication(AffiliateApplicationStatus.Approved);
        repository.Setup(x => x.FindApplicationAsync(application.Id, It.IsAny<CancellationToken>())).ReturnsAsync(application);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<AffiliateConflictException>(() =>
            service.UpdateStatusAsync(application.Id, new(AffiliateApplicationStatus.UnderReview, "Review again"),
                Guid.NewGuid(), null, CancellationToken.None));
    }

    [Fact]
    public async Task Editor_review_adds_history_and_audit()
    {
        var repository = CreateRepository();
        var application = CreateApplication(AffiliateApplicationStatus.Pending);
        var actorId = Guid.NewGuid();
        repository.Setup(x => x.FindApplicationAsync(application.Id, It.IsAny<CancellationToken>())).ReturnsAsync(application);
        var service = CreateService(repository);

        var result = await service.UpdateStatusAsync(application.Id,
            new(AffiliateApplicationStatus.UnderReview, "Checking channels"), actorId, "127.0.0.1", CancellationToken.None);

        Assert.Equal(AffiliateApplicationStatus.UnderReview, result.Status);
        Assert.Single(result.StatusHistory);
        repository.Verify(x => x.AddStatusHistory(It.Is<AffiliateApplicationStatusHistory>(history =>
            history.ToStatus == AffiliateApplicationStatus.UnderReview && history.ChangedBy == actorId)), Times.Once);
        repository.Verify(x => x.AddAudit(actorId, "Affiliate.StatusChanged", nameof(AffiliateApplication),
            application.Id, It.IsAny<string>(), It.IsAny<string>(), "127.0.0.1"), Times.Once);
    }

    [Fact]
    public async Task Admin_can_update_program_policy()
    {
        var repository = CreateRepository();
        var content = new AffiliateProgramContent
        {
            Title = "Old",
            Summary = "Old summary",
            CommissionSummary = "Old commission",
            PolicyMarkdown = "Old policy",
            IsPublished = true
        };
        repository.Setup(x => x.FindProgramContentAsync(It.IsAny<CancellationToken>())).ReturnsAsync(content);
        var service = CreateService(repository);

        var result = await service.UpdateProgramContentAsync(
            new("New program", "New summary", "New commission", "## New policy", true),
            Guid.NewGuid(), CancellationToken.None);

        Assert.Equal("New program", result.Title);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static AffiliateService CreateService(Mock<IAffiliateRepository> repository) =>
        new(repository.Object, new FixedTimeProvider(Now));

    private static Mock<IAffiliateRepository> CreateRepository()
    {
        var repository = new Mock<IAffiliateRepository>();
        repository.Setup(x => x.HasRecentApplicationAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static CreateAffiliateApplicationRequest ValidRequest() =>
        new("Partner Name", "PARTNER@example.com", "0901 234 567", "Partner Co",
            "https://partner.example.com", "Website, social media", "SME technology audience", "Cloud content experience");

    private static AffiliateApplicationOwner CustomerOwner() =>
        new(Guid.NewGuid(), "Partner Name", "partner@example.com");

    private static AffiliateApplication CreateApplication(AffiliateApplicationStatus status) =>
        new()
        {
            Id = Guid.NewGuid(),
            FullName = "Partner",
            Email = "partner@example.com",
            PhoneNumber = "0901234567",
            PromotionChannels = "Website",
            AudienceDescription = "Technology customers",
            Status = status,
            CreatedAt = Now.AddDays(-1)
        };

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }
}
