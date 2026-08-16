using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class PromotionServiceTests
{
    [Fact]
    public async Task Create_promotion_with_end_before_start_is_rejected()
    {
        var repository = CreateRepository();
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        await Assert.ThrowsAsync<PromotionValidationException>(() => service.CreatePromotionAsync(
            new("SALE10", "Sale", DiscountType.Percentage, 10, now, now.AddMinutes(-1), true, [Guid.NewGuid()]),
            Guid.NewGuid(),
            CancellationToken.None));

        repository.Verify(x => x.Add(It.IsAny<Promotion>()), Times.Never);
    }

    [Fact]
    public async Task Create_percentage_promotion_over_one_hundred_is_rejected()
    {
        var repository = CreateRepository();
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        await Assert.ThrowsAsync<PromotionValidationException>(() => service.CreatePromotionAsync(
            new("SALE110", "Sale", DiscountType.Percentage, 110, now, now.AddDays(1), true, [Guid.NewGuid()]),
            Guid.NewGuid(),
            CancellationToken.None));
    }

    [Fact]
    public async Task Create_promotion_with_duplicate_code_is_rejected()
    {
        var repository = CreateRepository();
        var planId = Guid.NewGuid();
        repository.Setup(x => x.CodeExistsAsync("SALE10", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        await Assert.ThrowsAsync<PromotionConflictException>(() => service.CreatePromotionAsync(
            new("sale10", "Sale", DiscountType.Percentage, 10, now, now.AddDays(1), true, [planId]),
            Guid.NewGuid(),
            CancellationToken.None));
    }

    [Fact]
    public async Task Create_promotion_for_missing_plan_is_rejected()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.CodeExistsAsync("SALE10", null, It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repository.Setup(x => x.GetExistingPlanIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        await Assert.ThrowsAsync<PromotionValidationException>(() => service.CreatePromotionAsync(
            new("SALE10", "Sale", DiscountType.Percentage, 10, now, now.AddDays(1), true, [Guid.NewGuid()]),
            Guid.NewGuid(),
            CancellationToken.None));
    }

    [Fact]
    public async Task Create_valid_promotion_normalizes_code_and_assigns_distinct_plans()
    {
        var repository = CreateRepository();
        var planId = Guid.NewGuid();
        repository.Setup(x => x.GetExistingPlanIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([planId]);
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        var result = await service.CreatePromotionAsync(
            new(" summer ", "Summer", DiscountType.FixedAmount, 50_000, now, now.AddDays(1), true, [planId, planId]),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal("SUMMER", result.Code);
        Assert.Single(result.ServicePlanIds);
        repository.Verify(x => x.Add(It.Is<Promotion>(p => p.Code == "SUMMER" && p.PromotionPlans.Count == 1)), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_yearly_promotion_persists_its_billing_cycle_scope()
    {
        var repository = CreateRepository();
        var planId = Guid.NewGuid();
        repository.Setup(x => x.GetExistingPlanIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([planId]);
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        var result = await service.CreatePromotionAsync(
            new("YEARLY15", "Yearly sale", DiscountType.Percentage, 15, now, now.AddDays(1), true, [planId], false, BillingCycle.Yearly),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.Equal(BillingCycle.Yearly, result.BillingCycle);
        repository.Verify(x => x.Add(It.Is<Promotion>(p => p.BillingCycle == BillingCycle.Yearly)), Times.Once);
    }

    [Fact]
    public async Task Update_promotion_status_keeps_existing_plan_links_in_sync()
    {
        var repository = CreateRepository();
        var promotion = new Promotion
        {
            Code = "CLOUD20",
            Name = "Cloud sale",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 20,
            StartsAt = DateTimeOffset.UtcNow.AddDays(-1),
            EndsAt = DateTimeOffset.UtcNow.AddDays(1),
            IsActive = true
        };
        var planId = Guid.NewGuid();
        promotion.PromotionPlans.Add(new PromotionPlan { PromotionId = promotion.Id, ServicePlanId = planId });
        repository.Setup(x => x.FindPromotionAsync(promotion.Id, It.IsAny<CancellationToken>())).ReturnsAsync(promotion);
        repository.Setup(x => x.GetExistingPlanIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([planId]);
        var service = new PromotionService(repository.Object);
        var actorId = Guid.NewGuid();

        var result = await service.UpdatePromotionAsync(
            promotion.Id,
            new("CLOUD20", "Cloud sale", DiscountType.Percentage, 20, promotion.StartsAt, promotion.EndsAt, false, [planId]),
            actorId,
            CancellationToken.None);

        Assert.False(result.IsActive);
        repository.Verify(x => x.SyncPromotionPlans(
            promotion,
            It.Is<IReadOnlyCollection<Guid>>(ids => ids.SequenceEqual(new[] { planId })),
            actorId), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_banner_promotion_clears_the_previous_public_banner()
    {
        var repository = CreateRepository();
        var planId = Guid.NewGuid();
        var previousBanner = new Promotion { ShowOnPublicBanner = true };
        repository.Setup(x => x.GetPublicBannerPromotionsAsync(null, It.IsAny<CancellationToken>()))
            .ReturnsAsync([previousBanner]);
        repository.Setup(x => x.GetExistingPlanIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([planId]);
        var service = new PromotionService(repository.Object);
        var now = DateTimeOffset.UtcNow;

        var result = await service.CreatePromotionAsync(
            new("NEWBANNER", "New banner", DiscountType.Percentage, 20, now, now.AddDays(1), true, [planId], true),
            Guid.NewGuid(),
            CancellationToken.None);

        Assert.True(result.ShowOnPublicBanner);
        Assert.False(previousBanner.ShowOnPublicBanner);
    }

    private static Mock<IPromotionRepository> CreateRepository()
    {
        var repository = new Mock<IPromotionRepository>();
        repository.Setup(x => x.CodeExistsAsync(It.IsAny<string>(), It.IsAny<Guid?>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }
}
