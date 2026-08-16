using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class CatalogServiceTests
{
    [Fact]
    public async Task Create_category_with_duplicate_slug_is_rejected()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.CategorySlugExistsAsync("vps", null, It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new CatalogService(repository.Object);

        await Assert.ThrowsAsync<CatalogConflictException>(() => service.CreateCategoryAsync(new("VPS", "vps", null, 1, true), Guid.NewGuid(), CancellationToken.None));
        repository.Verify(x => x.AddCategory(It.IsAny<ServiceCategory>()), Times.Never);
    }

    [Fact]
    public async Task Create_price_with_negative_amount_is_rejected_before_persistence()
    {
        var repository = CreateRepository();
        var service = new CatalogService(repository.Object);

        await Assert.ThrowsAsync<CatalogValidationException>(() => service.CreatePriceAsync(Guid.NewGuid(), new(BillingCycle.Monthly, -1, "VND", DateTimeOffset.UtcNow, null), Guid.NewGuid(), CancellationToken.None));
        repository.Verify(x => x.AddPrice(It.IsAny<PlanPrice>()), Times.Never);
    }

    [Fact]
    public async Task Create_new_price_closes_previous_open_price_without_overwriting_its_amount()
    {
        var repository = CreateRepository();
        var plan = new ServicePlan { Category = new ServiceCategory { Name = "VPS" } };
        var current = new PlanPrice { ServicePlanId = plan.Id, BillingCycle = BillingCycle.Monthly, Amount = 100_000, EffectiveFrom = DateTimeOffset.UtcNow.AddMonths(-1) };
        var newStart = DateTimeOffset.UtcNow.AddDays(1);
        repository.Setup(x => x.FindPlanAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        repository.Setup(x => x.GetPricesForCycleAsync(plan.Id, BillingCycle.Monthly, It.IsAny<CancellationToken>())).ReturnsAsync([current]);
        var service = new CatalogService(repository.Object);

        await service.CreatePriceAsync(plan.Id, new(BillingCycle.Monthly, 120_000, "vnd", newStart, null), Guid.NewGuid(), CancellationToken.None);

        Assert.Equal(newStart, current.EffectiveTo);
        Assert.Equal(100_000, current.Amount);
        repository.Verify(x => x.AddPrice(It.Is<PlanPrice>(x => x.Amount == 120_000 && x.Currency == "VND")), Times.Once);
    }

    [Fact]
    public async Task Generate_qr_for_existing_plan_returns_png_path_and_public_url()
    {
        var repository = CreateRepository();
        var qrCodeService = new Mock<IQrCodeService>();
        qrCodeService.Setup(x => x.GeneratePng("https://cloud.example/services/vps-basic")).Returns([1, 2, 3]);
        var plan = new ServicePlan { Slug = "vps-basic", Category = new ServiceCategory { Name = "VPS" } };
        repository.Setup(x => x.FindPlanAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        var service = new CatalogService(repository.Object, qrCodeService: qrCodeService.Object);

        var result = await service.GenerateQrCodeAsync(plan.Id, "https://cloud.example/", Guid.NewGuid(), CancellationToken.None);

        Assert.Equal($"/api/v1/service-plans/{plan.Id}/qr-code/image", result.ImagePath);
        Assert.Equal("https://cloud.example/services/vps-basic", result.TargetUrl);
        Assert.Equal(result.ImagePath, plan.QrCodePath);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    private static Mock<ICatalogRepository> CreateRepository()
    {
        var repository = new Mock<ICatalogRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }
}
