using CloudServiceStore.Application.Orders;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class OrderServiceTests
{
    private static readonly DateTimeOffset Now = new(2026, 7, 29, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public async Task Create_order_snapshots_price_features_and_best_promotion()
    {
        var repository = CreateRepository();
        var plan = CreatePlan();
        var promotion = new Promotion
        {
            Code = "SAVE20",
            Name = "Save 20%",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 20,
            StartsAt = Now.AddDays(-1),
            EndsAt = Now.AddDays(1),
            IsActive = true
        };
        plan.PromotionPlans.Add(new PromotionPlan { ServicePlanId = plan.Id, Promotion = promotion, PromotionId = promotion.Id });
        repository.Setup(x => x.FindPlanForOrderAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        var service = CreateService(repository);

        var result = await service.CreateAsync(ValidRequest(plan.Id), "127.0.0.1", CancellationToken.None);

        Assert.Equal(800_000m, result.QuotedAmount);
        repository.Verify(x => x.Add(It.Is<OrderRequest>(order =>
            order.OriginalAmount == 1_000_000m
            && order.QuotedAmount == 800_000m
            && order.Currency == "VND"
            && order.PlanNameSnapshot == "Cloud Business"
            && order.PromotionCodeSnapshot == "SAVE20"
            && order.SpecificationSnapshot.Contains("RAM")
            && order.StatusHistory.Count == 1)), Times.Once);
        repository.Verify(x => x.AddAudit(null, "Order.Created", nameof(OrderRequest), It.IsAny<Guid>(), null, It.IsAny<string>(), "127.0.0.1"), Times.Once);
    }

    [Fact]
    public async Task Monthly_order_ignores_yearly_only_promotion()
    {
        var repository = CreateRepository();
        var plan = CreatePlan();
        var promotion = new Promotion
        {
            Code = "YEARLY15",
            Name = "Yearly sale",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 15,
            BillingCycle = BillingCycle.Yearly,
            StartsAt = Now.AddDays(-1),
            EndsAt = Now.AddDays(1),
            IsActive = true
        };
        plan.PromotionPlans.Add(new PromotionPlan { ServicePlanId = plan.Id, Promotion = promotion, PromotionId = promotion.Id });
        repository.Setup(x => x.FindPlanForOrderAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        var service = CreateService(repository);

        var result = await service.CreateAsync(ValidRequest(plan.Id), null, CancellationToken.None);

        Assert.Equal(1_000_000m, result.QuotedAmount);
        repository.Verify(x => x.Add(It.Is<OrderRequest>(order => order.PromotionCodeSnapshot == null)), Times.Once);
    }

    [Fact]
    public async Task Create_order_without_active_price_is_rejected()
    {
        var repository = CreateRepository();
        var plan = CreatePlan();
        plan.Prices.Clear();
        repository.Setup(x => x.FindPlanForOrderAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<OrderValidationException>(() =>
            service.CreateAsync(ValidRequest(plan.Id), null, CancellationToken.None));

        repository.Verify(x => x.Add(It.IsAny<OrderRequest>()), Times.Never);
    }

    [Fact]
    public async Task Customer_order_uses_authenticated_identity_and_records_owner_audit()
    {
        var repository = CreateRepository();
        var plan = CreatePlan();
        repository.Setup(x => x.FindPlanForOrderAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        var owner = new OrderRequestOwner(Guid.NewGuid(), "Account Name", "Account@Example.com");
        var service = CreateService(repository);

        await service.CreateAsync(ValidRequest(plan.Id), null, CancellationToken.None, owner);

        repository.Verify(x => x.Add(It.Is<OrderRequest>(order =>
            order.AppUserId == owner.UserId
            && order.CustomerName == owner.FullName
            && order.Email == "account@example.com")), Times.Once);
        repository.Verify(x => x.AddAudit(owner.UserId, "Order.Created", nameof(OrderRequest), It.IsAny<Guid>(), null, It.IsAny<string>(), null), Times.Once);
    }

    [Fact]
    public async Task Customer_order_list_maps_only_public_tracking_fields()
    {
        var repository = CreateRepository();
        var ownerId = Guid.NewGuid();
        var order = CreateOrder(OrderRequestStatus.Contacted);
        order.AppUserId = ownerId;
        order.StatusHistory.Add(new OrderRequestStatusHistory
        {
            Id = Guid.NewGuid(),
            FromStatus = OrderRequestStatus.Pending,
            ToStatus = OrderRequestStatus.Contacted,
            Note = "Internal note",
            ChangedBy = Guid.NewGuid(),
            CreatedAt = Now
        });
        repository.Setup(x => x.GetForCustomerAsync(ownerId, It.IsAny<CustomerOrderQuery>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(([order], 1));
        var service = CreateService(repository);

        var result = await service.GetCustomerOrdersAsync(ownerId, new(), CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(order.Id, result.Items[0].Id);
        Assert.Equal(order.PlanNameSnapshot, result.Items[0].PlanName);
        Assert.Equal(order.QuotedAmount, result.Items[0].QuotedAmount);
        Assert.Equal(1, result.TotalCount);
    }

    [Fact]
    public async Task Customer_order_detail_is_scoped_to_owner()
    {
        var repository = CreateRepository();
        var ownerId = Guid.NewGuid();
        var order = CreateOrder(OrderRequestStatus.Pending);
        repository.Setup(x => x.FindForCustomerAsync(order.Id, ownerId, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        var service = CreateService(repository);

        var result = await service.GetCustomerOrderByIdAsync(ownerId, order.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(order.Id, result.Id);
        repository.Verify(x => x.FindForCustomerAsync(order.Id, ownerId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Recent_duplicate_order_is_rejected()
    {
        var repository = CreateRepository();
        var plan = CreatePlan();
        repository.Setup(x => x.FindPlanForOrderAsync(plan.Id, It.IsAny<CancellationToken>())).ReturnsAsync(plan);
        repository.Setup(x => x.HasRecentDuplicateAsync("customer@example.com", "0901234567", plan.Id, It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<OrderConflictException>(() =>
            service.CreateAsync(ValidRequest(plan.Id), null, CancellationToken.None));
    }

    [Fact]
    public async Task Invalid_status_transition_is_rejected()
    {
        var repository = CreateRepository();
        var order = CreateOrder(OrderRequestStatus.Pending);
        repository.Setup(x => x.FindAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        var service = CreateService(repository);

        await Assert.ThrowsAsync<OrderConflictException>(() =>
            service.UpdateStatusAsync(order.Id, new(OrderRequestStatus.Approved, null), Guid.NewGuid(), null, CancellationToken.None));
    }

    [Fact]
    public async Task Editor_workflow_status_change_adds_history_and_audit()
    {
        var repository = CreateRepository();
        var order = CreateOrder(OrderRequestStatus.Pending);
        var actorId = Guid.NewGuid();
        repository.Setup(x => x.FindAsync(order.Id, It.IsAny<CancellationToken>())).ReturnsAsync(order);
        var service = CreateService(repository);

        var result = await service.UpdateStatusAsync(order.Id, new(OrderRequestStatus.Contacted, "Called customer"), actorId, "127.0.0.1", CancellationToken.None);

        Assert.Equal(OrderRequestStatus.Contacted, result.Status);
        Assert.Single(result.StatusHistory);
        Assert.Equal(actorId, result.StatusHistory[0].ChangedBy);
        repository.Verify(x => x.AddStatusHistory(It.Is<OrderRequestStatusHistory>(item => item.ToStatus == OrderRequestStatus.Contacted)), Times.Once);
        repository.Verify(x => x.AddAudit(actorId, "Order.StatusChanged", nameof(OrderRequest), order.Id, It.IsAny<string>(), It.IsAny<string>(), "127.0.0.1"), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Invalid_pagination_is_rejected()
    {
        var service = CreateService(CreateRepository());

        await Assert.ThrowsAsync<OrderValidationException>(() =>
            service.GetAsync(new(Page: 0, PageSize: 101), CancellationToken.None));
    }

    private static OrderService CreateService(Mock<IOrderRepository> repository) =>
        new(repository.Object,
            new DiscountStrategyFactory(new PercentageDiscountStrategy(), new FixedAmountDiscountStrategy()),
            new FixedTimeProvider(Now));

    private static Mock<IOrderRepository> CreateRepository()
    {
        var repository = new Mock<IOrderRepository>();
        repository.Setup(x => x.HasRecentDuplicateAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<Guid>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync(false);
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static CreateOrderRequest ValidRequest(Guid planId) =>
        new(planId, "Customer Name", "customer@example.com", "0901 234 567", "Example Co", BillingCycle.Monthly, "Please call me.");

    private static ServicePlan CreatePlan()
    {
        var plan = new ServicePlan { Id = Guid.NewGuid(), Name = "Cloud Business", IsActive = true };
        plan.Features.Add(new ServicePlanFeature { FeatureKey = "RAM", DisplayName = "Memory", Value = "8", Unit = "GB" });
        plan.Prices.Add(new PlanPrice
        {
            BillingCycle = BillingCycle.Monthly,
            Amount = 1_000_000,
            Currency = "VND",
            EffectiveFrom = Now.AddDays(-1),
            IsActive = true
        });
        return plan;
    }

    private static OrderRequest CreateOrder(OrderRequestStatus status) =>
        new()
        {
            Id = Guid.NewGuid(),
            ServicePlanId = Guid.NewGuid(),
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0901234567",
            PlanNameSnapshot = "Cloud Business",
            BillingCycle = BillingCycle.Monthly,
            OriginalAmount = 1_000_000,
            QuotedAmount = 1_000_000,
            Currency = "VND",
            Status = status,
            CreatedAt = Now.AddMinutes(-5)
        };

    private sealed class FixedTimeProvider(DateTimeOffset value) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => value;
    }
}
