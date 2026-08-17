using CloudServiceStore.Application.Auth;
using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Application.Auth.Contracts;
using CloudServiceStore.Domain.Entities;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class AuthServiceTests
{
    [Fact]
    public async Task Login_with_valid_credentials_issues_access_and_refresh_tokens()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        repository.Setup(x => x.FindByEmailAsync("admin@cloud.local", It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Verify(user, "correct-password")).Returns(true);
        var tokenService = CreateTokenService();
        var service = new AuthService(repository.Object, passwordService.Object, tokenService.Object);

        var result = await service.LoginAsync(new LoginRequest("ADMIN@cloud.local", "correct-password"), "127.0.0.1", CancellationToken.None);

        Assert.Equal("access-token", result.AccessToken);
        Assert.Equal("refresh-token", result.RefreshToken);
        Assert.Contains("Admin", result.User.Roles);
        repository.Verify(x => x.AddRefreshToken(It.Is<RefreshToken>(token => token.AppUserId == user.Id && token.TokenHash == "hash-refresh-token")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Login_with_invalid_credentials_writes_audit_and_is_rejected()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.FindByEmailAsync("admin@cloud.local", It.IsAny<CancellationToken>())).ReturnsAsync(CreateAdmin());
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Verify(It.IsAny<AppUser>(), It.IsAny<string>())).Returns(false);
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        await Assert.ThrowsAsync<AuthenticationFailedException>(() => service.LoginAsync(new LoginRequest("admin@cloud.local", "wrong"), "127.0.0.1", CancellationToken.None));

        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.LoginFailed")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Refresh_with_reused_token_revokes_active_sessions_and_is_rejected()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        repository.Setup(x => x.FindRefreshTokenAsync("hash-reused", It.IsAny<CancellationToken>())).ReturnsAsync(new RefreshToken
        {
            AppUserId = user.Id,
            AppUser = user,
            TokenHash = "hash-reused",
            ExpiresAt = DateTimeOffset.UtcNow.AddDays(1),
            RevokedAt = DateTimeOffset.UtcNow.AddMinutes(-1)
        });
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        await Assert.ThrowsAsync<RefreshTokenReuseException>(() => service.RefreshAsync("reused", "127.0.0.1", CancellationToken.None));

        repository.Verify(x => x.RevokeActiveRefreshTokens(user.Id, It.IsAny<DateTimeOffset>()), Times.Once);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.RefreshTokenReuseDetected")), Times.Once);
    }

    [Fact]
    public async Task Change_password_with_valid_credentials_hashes_password_and_revokes_sessions()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Verify(user, "Current-password1!")).Returns(true);
        passwordService.Setup(x => x.Verify(user, "New-password2!")).Returns(false);
        passwordService.Setup(x => x.Hash(user, "New-password2!")).Returns("new-password-hash");
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        await service.ChangePasswordAsync(
            user.Id,
            new ChangePasswordRequest("Current-password1!", "New-password2!", "New-password2!"),
            "127.0.0.1",
            CancellationToken.None);

        Assert.Equal("new-password-hash", user.PasswordHash);
        Assert.NotNull(user.UpdatedAt);
        repository.Verify(x => x.RevokeActiveRefreshTokens(user.Id, It.IsAny<DateTimeOffset>()), Times.Once);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.PasswordChanged" && log.AppUserId == user.Id)), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Change_password_rejects_weak_or_mismatched_new_password()
    {
        var repository = CreateRepository();
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var exception = await Assert.ThrowsAsync<PasswordValidationException>(() => service.ChangePasswordAsync(
            Guid.NewGuid(),
            new ChangePasswordRequest("current", "weak", "different"),
            null,
            CancellationToken.None));

        Assert.Contains("newPassword", exception.Errors.Keys);
        Assert.Contains("confirmNewPassword", exception.Errors.Keys);
        repository.Verify(x => x.FindUserByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Change_password_rejects_invalid_current_password_without_mutating_user()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        user.PasswordHash = "original-hash";
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Verify(user, "Wrong-password1!")).Returns(false);
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        await Assert.ThrowsAsync<CurrentPasswordInvalidException>(() => service.ChangePasswordAsync(
            user.Id,
            new ChangePasswordRequest("Wrong-password1!", "New-password2!", "New-password2!"),
            null,
            CancellationToken.None));

        Assert.Equal("original-hash", user.PasswordHash);
        repository.Verify(x => x.RevokeActiveRefreshTokens(It.IsAny<Guid>(), It.IsAny<DateTimeOffset>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Update_profile_persists_name_and_avatar_and_returns_profile_data()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        user.CreatedAt = new DateTimeOffset(2026, 8, 13, 0, 0, 0, TimeSpan.Zero);
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var result = await service.UpdateProfileAsync(
            user.Id,
            new UpdateProfileRequest("  Nguyễn Minh Tuấn  ", "https://cdn.example.com/avatar.png"),
            "127.0.0.1",
            CancellationToken.None);

        Assert.Equal("Nguyễn Minh Tuấn", user.FullName);
        Assert.Equal("https://cdn.example.com/avatar.png", user.AvatarUrl);
        Assert.Equal(user.FullName, result.FullName);
        Assert.Equal(user.AvatarUrl, result.AvatarUrl);
        Assert.Equal(user.CreatedAt, result.CreatedAt);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.ProfileUpdated" && log.AppUserId == user.Id)), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Update_profile_rejects_non_http_avatar_without_mutating_user()
    {
        var repository = CreateRepository();
        var user = CreateAdmin();
        user.FullName = "Original Name";
        user.AvatarUrl = "https://cdn.example.com/original.png";
        repository.Setup(x => x.FindUserByIdAsync(user.Id, It.IsAny<CancellationToken>())).ReturnsAsync(user);
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var exception = await Assert.ThrowsAsync<ProfileValidationException>(() => service.UpdateProfileAsync(
            user.Id,
            new UpdateProfileRequest("Changed Name", "javascript:alert(1)"),
            null,
            CancellationToken.None));

        Assert.Contains("avatarUrl", exception.Errors.Keys);
        Assert.Equal("Original Name", user.FullName);
        Assert.Equal("https://cdn.example.com/original.png", user.AvatarUrl);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Register_creates_customer_user_and_issues_tokens()
    {
        var repository = CreateRepository();
        var role = new Role { Id = Guid.NewGuid(), Name = "Customer" };
        repository.Setup(x => x.FindByEmailAsync("customer@example.com", It.IsAny<CancellationToken>())).ReturnsAsync((AppUser?)null);
        repository.Setup(x => x.FindRoleByNameAsync("Customer", It.IsAny<CancellationToken>())).ReturnsAsync(role);
        var passwordService = new Mock<IPasswordService>();
        passwordService.Setup(x => x.Hash(It.IsAny<AppUser>(), "Strong-password1!")).Returns("hashed-password");
        var service = new AuthService(repository.Object, passwordService.Object, CreateTokenService().Object);

        var result = await service.RegisterAsync(
            new RegisterRequest("Customer Name", "CUSTOMER@example.com", "Strong-password1!"),
            "127.0.0.1",
            CancellationToken.None);

        Assert.Equal("customer@example.com", result.User.Email);
        Assert.Contains("Customer", result.User.Roles);
        repository.Verify(x => x.AddUser(It.Is<AppUser>(user =>
            user.Email == "customer@example.com"
            && user.FullName == "Customer Name"
            && user.PasswordHash == "hashed-password"
            && user.UserRoles.Any(item => item.RoleId == role.Id))), Times.Once);
        repository.Verify(x => x.AddAuditLog(It.Is<AuditLog>(log => log.Action == "Auth.Registered")), Times.Once);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Register_rejects_duplicate_email_without_creating_user()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.FindByEmailAsync("customer@example.com", It.IsAny<CancellationToken>())).ReturnsAsync(new AppUser());
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        await Assert.ThrowsAsync<RegistrationConflictException>(() => service.RegisterAsync(
            new RegisterRequest("Customer Name", "customer@example.com", "Strong-password1!"),
            null,
            CancellationToken.None));

        repository.Verify(x => x.AddUser(It.IsAny<AppUser>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Register_rejects_weak_password_with_field_errors()
    {
        var repository = CreateRepository();
        var service = new AuthService(repository.Object, Mock.Of<IPasswordService>(), CreateTokenService().Object);

        var exception = await Assert.ThrowsAsync<RegistrationValidationException>(() => service.RegisterAsync(
            new RegisterRequest("Customer Name", "customer@example.com", "weak"),
            null,
            CancellationToken.None));

        Assert.Contains("password", exception.Errors.Keys);
        repository.Verify(x => x.FindByEmailAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    private static Mock<IAuthRepository> CreateRepository()
    {
        var repository = new Mock<IAuthRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }

    private static Mock<ITokenService> CreateTokenService()
    {
        var tokenService = new Mock<ITokenService>();
        tokenService.Setup(x => x.CreateAccessToken(It.IsAny<AppUser>())).Returns(new AccessTokenResult("access-token", DateTimeOffset.UtcNow.AddMinutes(15)));
        tokenService.Setup(x => x.CreateRefreshToken()).Returns("refresh-token");
        tokenService.Setup(x => x.HashRefreshToken(It.IsAny<string>())).Returns<string>(value => $"hash-{value}");
        return tokenService;
    }

    private static AppUser CreateAdmin()
    {
        var user = new AppUser { Email = "admin@cloud.local", FullName = "Cloud Admin" };
        user.UserRoles.Add(new AppUserRole { AppUser = user, Role = new Role { Name = "Admin" } });
        return user;
    }
}
