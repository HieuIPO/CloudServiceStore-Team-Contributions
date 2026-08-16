using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace CloudServiceStore.Integration.Tests;

public sealed class ApiAuthorizationTests(CloudServiceStoreApiFactory factory)
    : IClassFixture<CloudServiceStoreApiFactory>
{
    [Fact]
    public async Task Public_health_and_catalog_are_available()
    {
        using var client = factory.CreateClient();

        using var health = await client.GetAsync("/health");
        using var catalog = await client.GetAsync("/api/v1/service-plans?page=1&pageSize=10");

        Assert.Equal(HttpStatusCode.OK, health.StatusCode);
        Assert.Equal(HttpStatusCode.OK, catalog.StatusCode);
    }

    [Fact]
    public async Task Anonymous_user_cannot_open_admin_reporting()
    {
        using var client = factory.CreateClient();

        using var response = await client.GetAsync("/api/v1/dashboard/order-summary");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_user_cannot_submit_orders_or_affiliate_applications()
    {
        using var client = factory.CreateClient();

        using var orderResponse = await client.PostAsJsonAsync("/api/v1/orders", new { });
        using var affiliateResponse = await client.PostAsJsonAsync("/api/v1/affiliate-applications", new { });

        Assert.Equal(HttpStatusCode.Unauthorized, orderResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, affiliateResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_and_Editor_can_access_editor_workspace()
    {
        using var editorClient = CreateAuthenticatedClient("Editor");
        using var adminClient = CreateAuthenticatedClient("Admin");

        using var editorResponse = await editorClient.GetAsync("/api/v1/editor-workspace");
        using var adminResponse = await adminClient.GetAsync("/api/v1/editor-workspace");

        Assert.Equal(HttpStatusCode.OK, editorResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, adminResponse.StatusCode);
    }

    [Theory]
    [InlineData("/api/v1/dashboard/order-summary")]
    [InlineData("/api/v1/audit-logs")]
    [InlineData("/api/v1/exports/order-requests.xlsx")]
    public async Task Editor_cannot_use_admin_only_reporting(string endpoint)
    {
        using var client = CreateAuthenticatedClient("Editor");

        using var response = await client.GetAsync(endpoint);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Editor_cannot_manage_catalog_or_pricing()
    {
        using var client = CreateAuthenticatedClient("Editor");

        using var catalog = await client.PostAsJsonAsync("/api/v1/service-categories", new { });
        using var pricing = await client.PostAsJsonAsync(
            $"/api/v1/service-plans/{Guid.NewGuid()}/prices",
            new { });

        Assert.Equal(HttpStatusCode.Forbidden, catalog.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, pricing.StatusCode);
    }

    [Fact]
    public async Task Admin_can_view_dashboard_audit_and_export_valid_excel()
    {
        using var client = CreateAuthenticatedClient("Admin");

        using var dashboard = await client.GetAsync("/api/v1/dashboard/order-summary");
        using var audit = await client.GetAsync("/api/v1/audit-logs?page=1&pageSize=10");
        using var export = await client.GetAsync("/api/v1/exports/order-requests.xlsx");
        var workbook = await export.Content.ReadAsByteArrayAsync();

        Assert.Equal(HttpStatusCode.OK, dashboard.StatusCode);
        Assert.Equal(HttpStatusCode.OK, audit.StatusCode);
        Assert.Equal(HttpStatusCode.OK, export.StatusCode);
        Assert.Equal(
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            export.Content.Headers.ContentType?.MediaType);
        Assert.True(workbook.Length > 4);
        Assert.Equal((byte)'P', workbook[0]);
        Assert.Equal((byte)'K', workbook[1]);
    }

    [Fact]
    public async Task Invalid_reporting_period_returns_problem_details()
    {
        using var client = CreateAuthenticatedClient("Admin");

        using var response = await client.GetAsync(
            "/api/v1/dashboard/order-summary?from=2026-07-30T00:00:00Z&to=2026-07-01T00:00:00Z");
        using var problem = JsonDocument.Parse(await response.Content.ReadAsStreamAsync());

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("application/problem+json", response.Content.Headers.ContentType?.MediaType);
        Assert.Equal(400, problem.RootElement.GetProperty("status").GetInt32());
        Assert.Equal("Validation failed", problem.RootElement.GetProperty("title").GetString());
    }

    [Fact]
    public async Task Customer_can_read_own_orders_but_cannot_manage_orders()
    {
        var ownerId = Guid.Parse("7ea04c83-2a66-4b7c-a2cf-7ef0469f836e");
        var ownOrderId = await SeedOrderAsync(ownerId);
        var otherOrderId = await SeedOrderAsync(Guid.NewGuid());
        using var client = CreateAuthenticatedClient("Customer");

        using var listResponse = await client.GetAsync("/api/v1/account/orders?page=1&pageSize=20");
        using var listJson = JsonDocument.Parse(await listResponse.Content.ReadAsStreamAsync());
        using var ownResponse = await client.GetAsync($"/api/v1/account/orders/{ownOrderId}");
        using var otherResponse = await client.GetAsync($"/api/v1/account/orders/{otherOrderId}");
        using var adminResponse = await client.GetAsync("/api/v1/orders?page=1&pageSize=20");

        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.Contains(listJson.RootElement.GetProperty("items").EnumerateArray(), item => item.GetProperty("id").GetGuid() == ownOrderId);
        Assert.Equal(HttpStatusCode.OK, ownResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, otherResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, adminResponse.StatusCode);

        using var ownJson = JsonDocument.Parse(await ownResponse.Content.ReadAsStreamAsync());
        var history = ownJson.RootElement.GetProperty("statusHistory").EnumerateArray().Single();
        Assert.False(history.TryGetProperty("note", out _));
        Assert.False(history.TryGetProperty("changedBy", out _));
        Assert.False(ownJson.RootElement.TryGetProperty("note", out _));
    }

    [Fact]
    public async Task Register_endpoint_creates_customer_session_and_rejects_weak_password()
    {
        using var client = factory.CreateClient();
        var email = $"customer-{Guid.NewGuid():N}@example.com";

        using var weakResponse = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Customer Test",
            email,
            password = "weak"
        });
        using var weakJson = JsonDocument.Parse(await weakResponse.Content.ReadAsStreamAsync());

        Assert.Equal(HttpStatusCode.BadRequest, weakResponse.StatusCode);
        Assert.True(weakJson.RootElement.GetProperty("errors").TryGetProperty("password", out _));

        using var response = await client.PostAsJsonAsync("/api/v1/auth/register", new
        {
            fullName = "Customer Test",
            email,
            password = "Strong-password1!"
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal("Customer", body.GetProperty("user").GetProperty("roles").EnumerateArray().Single().GetString());
        Assert.True(body.GetProperty("accessToken").GetString()?.Length > 0);
    }

    [Fact]
    public async Task Authenticated_customer_order_is_owned_by_customer_and_visible_in_account()
    {
        var planId = await SeedPlanAsync();
        using var client = CreateAuthenticatedClient("Customer");

        using var createResponse = await client.PostAsJsonAsync("/api/v1/orders", new
        {
            servicePlanId = planId,
            customerName = "Spoofed Name",
            email = "spoofed@example.com",
            phoneNumber = "0901234567",
            companyName = "Example Co",
            billingCycle = 1,
            note = "Customer note"
        });
        var confirmation = await createResponse.Content.ReadFromJsonAsync<JsonElement>();

        using var accountResponse = await client.GetAsync("/api/v1/account/orders?page=1&pageSize=20");
        using var accountJson = JsonDocument.Parse(await accountResponse.Content.ReadAsStreamAsync());
        var item = accountJson.RootElement.GetProperty("items").EnumerateArray().Single(order => order.GetProperty("id").GetGuid() == confirmation.GetProperty("id").GetGuid());

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, accountResponse.StatusCode);
        Assert.Equal("Customer Plan", item.GetProperty("planName").GetString());

        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        var stored = await dbContext.OrderRequests.SingleAsync(order => order.Id == confirmation.GetProperty("id").GetGuid());
        Assert.Equal(Guid.Parse("7ea04c83-2a66-4b7c-a2cf-7ef0469f836e"), stored.AppUserId);
        Assert.Equal("customer@cloud.local", stored.Email);
        Assert.Equal("Customer Test User", stored.CustomerName);
    }

    [Fact]
    public async Task Customer_affiliate_is_owned_and_editor_status_update_is_visible_without_internal_notes()
    {
        using var customerClient = CreateAuthenticatedClient("Customer");

        using var createResponse = await customerClient.PostAsJsonAsync("/api/v1/affiliate-applications", new
        {
            fullName = "Spoofed Affiliate Name",
            email = "spoofed-affiliate@example.com",
            phoneNumber = "0901234567",
            companyName = "Customer Partner Co",
            websiteUrl = "https://partner.example.com",
            promotionChannels = "Website and community",
            audienceDescription = "Technology audience",
            experienceDescription = "Content experience"
        });
        var confirmation = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var applicationId = confirmation.GetProperty("id").GetGuid();

        using var listResponse = await customerClient.GetAsync("/api/v1/account/affiliates?page=1&pageSize=20");
        using var listJson = JsonDocument.Parse(await listResponse.Content.ReadAsStreamAsync());
        using var detailResponse = await customerClient.GetAsync($"/api/v1/account/affiliates/{applicationId}");
        using var detailJson = JsonDocument.Parse(await detailResponse.Content.ReadAsStreamAsync());

        using var editorClient = CreateAuthenticatedClient("Editor");
        using var updateResponse = await editorClient.PatchAsJsonAsync($"/api/v1/affiliate-applications/{applicationId}/status", new
        {
            status = AffiliateApplicationStatus.UnderReview,
            note = "Đang kiểm tra kênh quảng bá"
        });

        using var updatedResponse = await customerClient.GetAsync($"/api/v1/account/affiliates/{applicationId}");
        using var updatedJson = JsonDocument.Parse(await updatedResponse.Content.ReadAsStreamAsync());

        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        Assert.Contains(listJson.RootElement.GetProperty("items").EnumerateArray(), item => item.GetProperty("id").GetGuid() == applicationId);
        Assert.Equal(HttpStatusCode.OK, listResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, detailResponse.StatusCode);
        Assert.Equal("Customer Test User", detailJson.RootElement.GetProperty("fullName").GetString());
        Assert.Equal("customer@cloud.local", detailJson.RootElement.GetProperty("email").GetString());
        Assert.False(detailJson.RootElement.TryGetProperty("reviewNote", out _));
        Assert.False(detailJson.RootElement.GetProperty("statusHistory").EnumerateArray().Single().TryGetProperty("note", out _));
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updatedResponse.StatusCode);
        Assert.Equal((int)AffiliateApplicationStatus.UnderReview, updatedJson.RootElement.GetProperty("status").GetInt32());
        Assert.Contains(updatedJson.RootElement.GetProperty("statusHistory").EnumerateArray(), history =>
            history.GetProperty("toStatus").GetInt32() == (int)AffiliateApplicationStatus.UnderReview);
        Assert.All(updatedJson.RootElement.GetProperty("statusHistory").EnumerateArray(), history =>
        {
            Assert.False(history.TryGetProperty("note", out _));
            Assert.False(history.TryGetProperty("changedBy", out _));
        });
    }

    private async Task<Guid> SeedOrderAsync(Guid? ownerId)
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        var orderId = Guid.NewGuid();
        dbContext.OrderRequests.Add(new OrderRequest
        {
            Id = orderId,
            AppUserId = ownerId,
            ServicePlanId = Guid.NewGuid(),
            CustomerName = "Customer",
            Email = "customer@example.com",
            PhoneNumber = "0901234567",
            BillingCycle = BillingCycle.Monthly,
            OriginalAmount = 100_000,
            QuotedAmount = 100_000,
            Currency = "VND",
            PlanNameSnapshot = "Customer Plan",
            SpecificationSnapshot = "{}",
            Status = OrderRequestStatus.Contacted,
            CreatedAt = DateTimeOffset.UtcNow
        });
        dbContext.OrderRequestStatusHistories.Add(new OrderRequestStatusHistory
        {
            OrderRequestId = orderId,
            FromStatus = OrderRequestStatus.Pending,
            ToStatus = OrderRequestStatus.Contacted,
            Note = "Internal note",
            ChangedBy = Guid.NewGuid(),
            CreatedAt = DateTimeOffset.UtcNow
        });
        await dbContext.SaveChangesAsync();
        return orderId;
    }

    private async Task<Guid> SeedPlanAsync()
    {
        using var scope = factory.Services.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        var planId = Guid.NewGuid();
        dbContext.ServicePlans.Add(new ServicePlan
        {
            Id = planId,
            CategoryId = Guid.NewGuid(),
            Name = "Customer Plan",
            Slug = $"customer-plan-{planId:N}",
            Summary = "Customer account test plan",
            IsActive = true,
            Prices = { new PlanPrice
            {
                ServicePlanId = planId,
                BillingCycle = BillingCycle.Monthly,
                Amount = 100_000,
                Currency = "VND",
                EffectiveFrom = DateTimeOffset.UtcNow.AddDays(-1),
                IsActive = true
            }}
        });
        await dbContext.SaveChangesAsync();
        return planId;
    }

    private HttpClient CreateAuthenticatedClient(string role)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, role);
        return client;
    }
}
