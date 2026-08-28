using System.Net;
using System.Text;
using CloudServiceStore.Infrastructure.ContactRequests;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Integration.Tests;

public sealed class ContactTurnstileValidatorTests
{
    [Fact]
    public async Task ValidateAsync_posts_secret_token_and_remote_ip_to_siteverify()
    {
        var handler = new StubHandler(HttpStatusCode.OK, """
            {"success":true,"hostname":"contact.example.test","action":"contact_submit"}
            """);
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://challenges.cloudflare.com/")
        };
        var validator = new ContactTurnstileValidator(
            client,
            Options.Create(new ContactTurnstileOptions
            {
                Enabled = true,
                SecretKey = "test-secret",
                ExpectedAction = "contact_submit",
                ExpectedHostname = "contact.example.test"
            }));

        var result = await validator.ValidateAsync("test-token", "203.0.113.7", CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.True(result.IsServiceAvailable);
        Assert.Equal(HttpMethod.Post, handler.Request!.Method);
        Assert.Equal("/turnstile/v0/siteverify", handler.Request.RequestUri!.AbsolutePath);
        Assert.Contains("secret=test-secret", handler.Body, StringComparison.Ordinal);
        Assert.Contains("response=test-token", handler.Body, StringComparison.Ordinal);
        Assert.Contains("remoteip=203.0.113.7", handler.Body, StringComparison.Ordinal);
    }

    [Theory]
    [InlineData("wrong_action", "contact.example.test")]
    [InlineData("contact_submit", "wrong.example.test")]
    public async Task ValidateAsync_rejects_action_or_hostname_mismatch(
        string action,
        string hostname)
    {
        var handler = new StubHandler(
            HttpStatusCode.OK,
            $"{{\"success\":true,\"hostname\":\"{hostname}\",\"action\":\"{action}\"}}");
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://challenges.cloudflare.com/")
        };
        var validator = new ContactTurnstileValidator(
            client,
            Options.Create(new ContactTurnstileOptions
            {
                Enabled = true,
                SecretKey = "test-secret",
                ExpectedAction = "contact_submit",
                ExpectedHostname = "contact.example.test"
            }));

        var result = await validator.ValidateAsync("test-token", null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.True(result.IsServiceAvailable);
    }

    [Fact]
    public async Task ValidateAsync_returns_unavailable_when_expected_action_or_hostname_is_missing()
    {
        var handler = new StubHandler(HttpStatusCode.OK, "{}");
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://challenges.cloudflare.com/")
        };
        var validator = new ContactTurnstileValidator(
            client,
            Options.Create(new ContactTurnstileOptions
            {
                Enabled = true,
                SecretKey = "test-secret",
                ExpectedAction = "",
                ExpectedHostname = null
            }));

        var result = await validator.ValidateAsync("test-token", null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.False(result.IsServiceAvailable);
        Assert.Null(handler.Request);
    }

    [Fact]
    public async Task ValidateAsync_returns_unavailable_when_siteverify_json_is_malformed()
    {
        var handler = new StubHandler(HttpStatusCode.OK, "not-json");
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://challenges.cloudflare.com/")
        };
        var validator = new ContactTurnstileValidator(
            client,
            Options.Create(new ContactTurnstileOptions
            {
                Enabled = true,
                SecretKey = "test-secret",
                ExpectedAction = "contact_submit",
                ExpectedHostname = "contact.example.test"
            }));

        var result = await validator.ValidateAsync("test-token", null, CancellationToken.None);

        Assert.False(result.IsValid);
        Assert.False(result.IsServiceAvailable);
    }

    [Fact]
    public async Task ValidateAsync_allows_local_request_when_turnstile_is_disabled()
    {
        var handler = new StubHandler(HttpStatusCode.InternalServerError, "{}");
        using var client = new HttpClient(handler)
        {
            BaseAddress = new Uri("https://challenges.cloudflare.com/")
        };
        var validator = new ContactTurnstileValidator(
            client,
            Options.Create(new ContactTurnstileOptions { Enabled = false }));

        var result = await validator.ValidateAsync(null, null, CancellationToken.None);

        Assert.True(result.IsValid);
        Assert.True(result.IsServiceAvailable);
        Assert.Null(handler.Request);
    }

    private sealed class StubHandler(HttpStatusCode statusCode, string content) : HttpMessageHandler
    {
        public HttpRequestMessage? Request { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Request = request;
            Body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(content, Encoding.UTF8, "application/json")
            };
        }
    }
}
