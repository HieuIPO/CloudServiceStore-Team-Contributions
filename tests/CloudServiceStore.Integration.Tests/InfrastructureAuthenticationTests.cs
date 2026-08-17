using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Infrastructure.Authentication;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Integration.Tests;

public sealed class InfrastructureAuthenticationTests
{
    [Fact]
    public void PasswordService_hashes_and_verifies_only_the_original_password()
    {
        var service = new PasswordService();
        var user = new AppUser { Email = "user@example.com" };

        user.PasswordHash = service.Hash(user, "Strong-password1!");

        Assert.NotEqual("Strong-password1!", user.PasswordHash);
        Assert.True(service.Verify(user, "Strong-password1!"));
        Assert.False(service.Verify(user, "Wrong-password1!"));
    }

    [Fact]
    public void TokenService_creates_jwt_with_identity_and_role_claims()
    {
        var options = Options.Create(new JwtOptions
        {
            Issuer = "CloudServiceStore.Tests",
            Audience = "CloudServiceStore.Tests.Client",
            SigningKey = "a-long-integration-test-signing-key-2026",
            AccessTokenMinutes = 15
        });
        var user = new AppUser { Id = Guid.NewGuid(), Email = "admin@example.com", FullName = "Cloud Admin" };
        user.UserRoles.Add(new AppUserRole { Role = new Role { Name = "Admin" } });
        var service = new TokenService(options);

        var result = service.CreateAccessToken(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(result.Token);

        Assert.Equal(options.Value.Issuer, token.Issuer);
        Assert.Contains(options.Value.Audience, token.Audiences);
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.NameIdentifier && claim.Value == user.Id.ToString());
        Assert.Contains(token.Claims, claim => claim.Type == ClaimTypes.Role && claim.Value == "Admin");
        Assert.True(result.ExpiresAt > DateTimeOffset.UtcNow);
    }

    [Fact]
    public void Refresh_token_generation_is_random_and_hashing_is_deterministic()
    {
        var service = new TokenService(Options.Create(new JwtOptions { SigningKey = "unused" }));

        var first = service.CreateRefreshToken();
        var second = service.CreateRefreshToken();

        Assert.NotEqual(first, second);
        Assert.Equal(service.HashRefreshToken(first), service.HashRefreshToken(first));
        Assert.NotEqual(service.HashRefreshToken(first), service.HashRefreshToken(second));
    }
}
