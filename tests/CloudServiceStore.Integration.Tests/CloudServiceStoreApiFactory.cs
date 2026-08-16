using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace CloudServiceStore.Integration.Tests;

public sealed class CloudServiceStoreApiFactory : WebApplicationFactory<Program>
{
    public const string SeedPassword = "Integration-Test-Password-2026!";
    private readonly string dbName = $"CloudServiceStore-{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:CloudServiceStore", "Server=integration.invalid;Database=CloudServiceStore;");
        builder.UseSetting("Jwt:Issuer", "CloudServiceStore.IntegrationTests");
        builder.UseSetting("Jwt:Audience", "CloudServiceStore.IntegrationTests.Client");
        builder.UseSetting("Jwt:SigningKey", "integration-tests-only-signing-key-2026-keep-private");
        builder.UseSetting("Jwt:AccessTokenMinutes", "15");
        builder.UseSetting("Seed:AdminPassword", SeedPassword);
        builder.UseSetting("RateLimiting:LoginPermitLimit", "20");
        builder.UseSetting("Cors:AllowedOrigins:0", "http://localhost:3000");
        builder.ConfigureAppConfiguration((_, configuration) =>
        {
            configuration.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:CloudServiceStore"] = "Server=integration.invalid;Database=CloudServiceStore;",
                ["Jwt:Issuer"] = "CloudServiceStore.IntegrationTests",
                ["Jwt:Audience"] = "CloudServiceStore.IntegrationTests.Client",
                ["Jwt:SigningKey"] = "integration-tests-only-signing-key-2026-keep-private",
                ["Jwt:AccessTokenMinutes"] = "15",
                ["Seed:AdminPassword"] = SeedPassword,
                ["RateLimiting:LoginPermitLimit"] = "20",
                ["Cors:AllowedOrigins:0"] = "http://localhost:3000"
            });
        });
        builder.ConfigureServices(services =>
        {
            var databaseServices = services
                .Where(descriptor =>
                    descriptor.ServiceType == typeof(CloudServiceStoreDbContext)
                    || descriptor.ServiceType == typeof(DbContextOptions<CloudServiceStoreDbContext>)
                    || descriptor.ServiceType.Name.StartsWith("IDbContextOptionsConfiguration", StringComparison.Ordinal))
                .ToArray();

            foreach (var descriptor in databaseServices) services.Remove(descriptor);

            services.AddDbContext<CloudServiceStoreDbContext>(options =>
                options.UseInMemoryDatabase(dbName));
            services.AddAuthentication(options =>
                {
                    options.DefaultAuthenticateScheme = TestAuthHandler.SchemeName;
                    options.DefaultChallengeScheme = TestAuthHandler.SchemeName;
                    options.DefaultForbidScheme = TestAuthHandler.SchemeName;
                })
                .AddScheme<AuthenticationSchemeOptions, TestAuthHandler>(
                    TestAuthHandler.SchemeName,
                    _ => { });
        });
    }
}
