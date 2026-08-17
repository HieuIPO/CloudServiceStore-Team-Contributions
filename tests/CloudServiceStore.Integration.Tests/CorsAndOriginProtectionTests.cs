using System.Net;
using Xunit;

namespace CloudServiceStore.Integration.Tests;

public sealed class CorsAndOriginProtectionTests : IClassFixture<CloudServiceStoreApiFactory>
{
    private readonly CloudServiceStoreApiFactory factory;

    public CorsAndOriginProtectionTests(CloudServiceStoreApiFactory factory)
    {
        this.factory = factory;
    }

    [Fact]
    public async Task Allowed_Origin_Returns_Cors_Headers()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/auth/me");
        request.Headers.Add("Origin", "http://localhost:3000");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        Assert.True(response.Headers.Contains("Access-Control-Allow-Origin"));
        Assert.Equal("http://localhost:3000", response.Headers.GetValues("Access-Control-Allow-Origin").FirstOrDefault());
    }

    [Fact]
    public async Task Disallowed_Origin_Does_Not_Return_Cors_Headers()
    {
        var client = factory.CreateClient();
        var request = new HttpRequestMessage(HttpMethod.Options, "/api/v1/auth/me");
        request.Headers.Add("Origin", "http://malicious-domain.com");
        request.Headers.Add("Access-Control-Request-Method", "GET");

        var response = await client.SendAsync(request);

        Assert.False(response.Headers.Contains("Access-Control-Allow-Origin"));
    }
}
