using CloudServiceStore.Application.Auth;
using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Application.Auth.Contracts;
using CloudServiceStore.Domain.Entities;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class AuthSecurityBranchTests
{
    [Fact]
    public async Task Login_rejects_inactive_user_and_records_failure_audit()
    {
        var repository = CreateRepository();
        var user = CreateUser();
        user.IsActive = false;
        repository.Setup(x => x.FindByEmailAsync(user.Email, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        await Assert.ThrowsAsync<AuthenticationFailedException>(() => service.LoginAsync(
            new LoginRequest(user.Email, "Strong-password1!"), "127.0.0.1", CancellationToken.None));

        passwordService.Verify(x => x.Verify(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(audit => audit.Action == "Auth.LoginFailed")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Refresh_rejects_expired_token_without_mutating_sessions()
    {
        var repository = CreateRepository();
        var tokenService = CreateTokenService();
        tokenService.Setup(x => x.HashRefreshToken("expired")).Returns("hash-expired");
        repository.Setup(x => x.FindRefreshTokenAsync("hash-expired", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RefreshToken
            {
                TokenHash = "hash-expired",
                ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(-1),
                AppUser = CreateUser()
            });
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), tokenService.Object);

        await Assert.ThrowsAsync<AuthenticationFailedException>(() => service.RefreshAsync(
            "expired", null, CancellationToken.None));

        repository.Verify(x => x.RevokeActiveRefreshTokens(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Refresh_rotates_valid_token_and_links_replacement_hash()
    {
        var repository = CreateRepository();
        var user = CreateUser();
        var storedToken = new RefreshToken
        {
            AppUserId = user.Id,
            AppUser = user,
            TokenHash = "hash-old",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(1)
        };
        var tokenService = CreateTokenService();
        tokenService.Setup(x => x.HashRefreshToken("old-refresh")).Returns("hash-old");
        tokenService.Setup(x => x.HashRefreshToken("new-refresh")).Returns("hash-new");
        repository.Setup(x => x.FindRefreshTokenAsync("hash-old", It.IsAny<CancellationToken>())).ReturnsAsync(storedToken);
        tokenService.Setup(x => x.CreateRefreshToken()).Returns("new-refresh");
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), tokenService.Object);

        var result = await service.RefreshAsync("old-refresh", "127.0.0.1", CancellationToken.None);

        Assert.Equal("new-refresh", result.RefreshToken);
        Assert.NotNull(storedToken.RevokedAt);
        Assert.Equal("hash-new", storedToken.ReplacedByTokenHash);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(audit => audit.Action == "Auth.RefreshTokenRotated")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Logout_revokes_active_refresh_token_and_is_idempotent_for_missing_token()
    {
        var repository = CreateRepository();
        var active = new RefreshToken { AppUserId = Guid.NewGuid(), ExpiresAt = DateTimeOffset.UtcNow.AddDays(1) };
        var tokenService = CreateTokenService();
        tokenService.Setup(x => x.HashRefreshToken("active")).Returns("hash-active");
        tokenService.Setup(x => x.HashRefreshToken("missing")).Returns("hash-missing");
        repository.Setup(x => x.FindRefreshTokenAsync("hash-active", It.IsAny<CancellationToken>())).ReturnsAsync(active);
        repository.Setup(x => x.FindRefreshTokenAsync("hash-missing", It.IsAny<CancellationToken>())).ReturnsAsync((RefreshToken?)null);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), tokenService.Object);

        await service.LogoutAsync("active", "127.0.0.1", CancellationToken.None);
        await service.LogoutAsync("missing", "127.0.0.1", CancellationToken.None);

        Assert.NotNull(active.RevokedAt);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(audit => audit.Action == "Auth.Logout")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Current_user_mapping_returns_sorted_roles_and_optional_profile_fields()
    {
        var repository = CreateRepository();
        var user = CreateUser();
        user.CreatedAt = DateTimeOffset.UtcNow.AddDays(-2);
        user.AvatarUrl = "https://cdn.example.com/avatar.png";
        user.UserRoles.Add(new AppUserRole { Role = new Role { Name = "Editor" } });
        user.UserRoles.Add(new AppUserRole { Role = new Role { Name = "Admin" } });
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var result = await service.GetCurrentUserAsync(user.Id, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(new[] { "Admin", "Editor" }, result!.Roles);
        Assert.Equal(user.AvatarUrl, result.AvatarUrl);
        Assert.Equal(user.CreatedAt, result.CreatedAt);
    }

    [Fact]
    public async Task Current_user_mapping_returns_null_when_user_is_missing()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.FindUserByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((AppUser?)null);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var result = await service.GetCurrentUserAsync(Guid.NewGuid(), CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Change_password_rejects_new_password_that_matches_current_password()
    {
        var repository = CreateRepository();
        var user = CreateUser();
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Verify(user, "Current-password1!")).Returns(true);
        passwordService.Setup(x => x.Verify(user, "New-password2!")).Returns(true);
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        var exception = await Assert.ThrowsAsync<PasswordValidationException>(() => service.ChangePasswordAsync(
            user.Id,
            new ChangePasswordRequest("Current-password1!", "New-password2!", "New-password2!"),
            null,
            CancellationToken.None));

        Assert.Contains("newPassword", exception.Errors.Keys);
        repository.Verify(x => x.RevokeActiveRefreshTokens(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Change_password_rejects_inactive_user_before_password_verification()
    {
        var repository = CreateRepository();
        var user = CreateUser();
        user.IsActive = false;
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        await Assert.ThrowsAsync<AuthenticationFailedException>(() => service.ChangePasswordAsync(
            user.Id,
            new ChangePasswordRequest("Current-password1!", "New-password2!", "New-password2!"),
            null,
            CancellationToken.None));

        passwordService.Verify(x => x.Verify(It.IsAny<AppUser>(), It.IsAny<string>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    private static Mock<IAuthRepository> CreateRepository()
    {
        var repository = new Mock<IAuthRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static Mock<ITokenService> CreateTokenService()
    {
        var service = new Mock<ITokenService>();
        service.Setup(x => x.CreateAccessToken(It.IsAny<AppUser>()))
            .Returns(new AccessTokenResult("access-token", DateTimeOffset.UtcNow.AddMinutes(15)));
        service.Setup(x => x.CreateRefreshToken()).Returns("refresh-token");
        service.Setup(x => x.HashRefreshToken(It.IsAny<string>())).Returns<string>(value => $"hash-{value}");
        return service;
    }

    private static AppUser CreateUser() => new()
    {
        Id = Guid.NewGuid(),
        Email = "user@example.com",
        FullName = "Test User",
        IsActive = true
    };
}
