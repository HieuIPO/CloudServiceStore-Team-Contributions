using System.Net;
using System.Net.Http.Json;

namespace CloudServiceStore.Integration.Tests;

public sealed class AuthSecurityApiTests : IClassFixture<CloudServiceStoreApiFactory>
{
    private readonly CloudServiceStoreApiFactory factory;

    public AuthSecurityApiTests(CloudServiceStoreApiFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task Refresh_cookie_operation_rejects_untrusted_origin_before_controller()
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add("Origin", "http://malicious-domain.com");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
        Assert.True(response.Headers.Contains("Vary"));
    }

    [Fact]
    public async Task Refresh_cookie_operation_with_allowed_origin_reaches_authentication_check()
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/refresh");
        request.Headers.Add("Origin", "http://localhost:3000");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Logout_cookie_operation_rejects_untrusted_origin()
    {
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "/api/v1/auth/logout");
        request.Headers.Add("Origin", "https://not-configured.example.com");

        using var response = await client.SendAsync(request);

        Assert.Equal(HttpStatusCode.Forbidden, response.StatusCode);
    }

    [Fact]
    public async Task Login_returns_unauthorized_for_invalid_credentials_and_validation_error_for_missing_credentials()
    {
        using var client = factory.CreateClient();

        using var invalidResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "missing-user@example.com",
            password = "Wrong-password1!"
        });
        using var emptyResponse = await client.PostAsJsonAsync("/api/v1/auth/login", new
        {
            email = "",
            password = ""
        });

        Assert.Equal(HttpStatusCode.Unauthorized, invalidResponse.StatusCode);
        Assert.Equal(HttpStatusCode.BadRequest, emptyResponse.StatusCode);
    }

    [Fact]
    public async Task Login_rate_limiter_returns_429_after_the_configured_window_limit()
    {
        using var isolatedFactory = new CloudServiceStoreApiFactory();
        using var client = isolatedFactory.CreateClient();
        HttpStatusCode? lastStatus = null;
        var retryAfterSeen = false;

        for (var attempt = 0; attempt < 21; attempt++)
        {
            using var response = await client.PostAsJsonAsync("/api/v1/auth/login", new
            {
                email = "rate-limit-missing-user@example.com",
                password = "Wrong-password1!"
            });
            lastStatus = response.StatusCode;
            if (response.StatusCode == HttpStatusCode.TooManyRequests)
            {
                retryAfterSeen = response.Headers.RetryAfter is not null;
                break;
            }
        }

        Assert.Equal(HttpStatusCode.TooManyRequests, lastStatus);
        Assert.True(retryAfterSeen);
    }
}
