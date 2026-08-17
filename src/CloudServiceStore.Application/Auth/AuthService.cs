using System.Net.Mail;
using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Application.Auth.Contracts;
using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Auth;

public sealed class AuthService(IAuthRepository repository, IPasswordService passwordService, ITokenService tokenService) : IAuthService
{
    private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);

    public async Task<AuthenticationResult> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var validationErrors = ValidateRegistration(request);
        if (validationErrors.Count > 0) throw new RegistrationValidationException(validationErrors);

        var email = request.Email.Trim().ToLowerInvariant();
        if (await repository.FindByEmailAsync(email, cancellationToken) is not null)
            throw new RegistrationConflictException();

        var customerRole = await repository.FindRoleByNameAsync("Customer", cancellationToken)
            ?? throw new InvalidOperationException("The Customer role has not been seeded.");
        var user = new AppUser
        {
            Email = email,
            FullName = request.FullName.Trim()
        };
        user.PasswordHash = passwordService.Hash(user, request.Password);
        user.UserRoles.Add(new AppUserRole
        {
            AppUserId = user.Id,
            AppUser = user,
            RoleId = customerRole.Id,
            Role = customerRole
        });

        repository.AddUser(user);
        var result = CreateTokenResult(user);
        repository.AddAuditLog(CreateAudit(user.Id, "Auth.Registered", "AppUser", user.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<AuthenticationResult> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await repository.FindByEmailAsync(email, cancellationToken);

        if (user is null || !user.IsActive || !passwordService.Verify(user, request.Password))
        {
            repository.AddAuditLog(CreateAudit(null, "Auth.LoginFailed", "AppUser", null, ipAddress));
            await repository.SaveChangesAsync(cancellationToken);
            throw new AuthenticationFailedException();
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        var result = CreateTokenResult(user);
        repository.AddAuditLog(CreateAudit(user.Id, "Auth.LoginSucceeded", "AppUser", user.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task<AuthenticationResult> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken)
    {
        var tokenHash = tokenService.HashRefreshToken(refreshToken);
        var storedToken = await repository.FindRefreshTokenAsync(tokenHash, cancellationToken);

        if (storedToken is null || storedToken.ExpiresAt <= DateTimeOffset.UtcNow || !storedToken.AppUser.IsActive)
        {
            throw new AuthenticationFailedException();
        }

        if (storedToken.RevokedAt is not null)
        {
            repository.RevokeActiveRefreshTokens(storedToken.AppUserId, DateTimeOffset.UtcNow);
            repository.AddAuditLog(CreateAudit(storedToken.AppUserId, "Auth.RefreshTokenReuseDetected", "RefreshToken", storedToken.Id, ipAddress));
            await repository.SaveChangesAsync(cancellationToken);
            throw new RefreshTokenReuseException();
        }

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        var result = CreateTokenResult(storedToken.AppUser);
        storedToken.ReplacedByTokenHash = tokenService.HashRefreshToken(result.RefreshToken);
        repository.AddAuditLog(CreateAudit(storedToken.AppUserId, "Auth.RefreshTokenRotated", "RefreshToken", storedToken.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
        return result;
    }

    public async Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken)
    {
        var storedToken = await repository.FindRefreshTokenAsync(tokenService.HashRefreshToken(refreshToken), cancellationToken);
        if (storedToken is null || storedToken.RevokedAt is not null) return;

        storedToken.RevokedAt = DateTimeOffset.UtcNow;
        repository.AddAuditLog(CreateAudit(storedToken.AppUserId, "Auth.Logout", "RefreshToken", storedToken.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthenticatedUserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await repository.FindUserByIdAsync(userId, cancellationToken);
        return user is null ? null : MapUser(user);
    }

    public async Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var validationErrors = ValidatePasswordChange(request);
        if (validationErrors.Count > 0) throw new PasswordValidationException(validationErrors);

        var user = await repository.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive) throw new AuthenticationFailedException();
        if (!passwordService.Verify(user, request.CurrentPassword)) throw new CurrentPasswordInvalidException();
        if (passwordService.Verify(user, request.NewPassword))
            throw new PasswordValidationException(new Dictionary<string, string[]> { ["newPassword"] = ["New password must differ from the current password."] });

        var changedAt = DateTimeOffset.UtcNow;
        user.PasswordHash = passwordService.Hash(user, request.NewPassword);
        user.UpdatedAt = changedAt;
        repository.RevokeActiveRefreshTokens(user.Id, changedAt);
        repository.AddAuditLog(CreateAudit(user.Id, "Auth.PasswordChanged", "AppUser", user.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<AuthenticatedUserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var validationErrors = ValidateProfile(request);
        if (validationErrors.Count > 0) throw new ProfileValidationException(validationErrors);

        var user = await repository.FindUserByIdAsync(userId, cancellationToken);
        if (user is null || !user.IsActive) throw new AuthenticationFailedException();

        user.FullName = request.FullName.Trim();
        user.AvatarUrl = CleanOptionalAvatar(request.AvatarUrl);
        user.UpdatedAt = DateTimeOffset.UtcNow;
        repository.AddAuditLog(CreateAudit(user.Id, "Auth.ProfileUpdated", "AppUser", user.Id, ipAddress));
        await repository.SaveChangesAsync(cancellationToken);
        return MapUser(user);
    }

    private AuthenticationResult CreateTokenResult(AppUser user)
    {
        var accessToken = tokenService.CreateAccessToken(user);
        var rawRefreshToken = tokenService.CreateRefreshToken();
        var refreshExpiry = DateTimeOffset.UtcNow.Add(RefreshTokenLifetime);
        repository.AddRefreshToken(new RefreshToken
        {
            AppUserId = user.Id,
            TokenHash = tokenService.HashRefreshToken(rawRefreshToken),
            ExpiresAt = refreshExpiry
        });
        return new AuthenticationResult(accessToken.Token, accessToken.ExpiresAt, rawRefreshToken, refreshExpiry, MapUser(user));
    }

    private static AuthenticatedUserDto MapUser(AppUser user) => new(
        user.Id,
        user.Email,
        user.FullName,
        user.UserRoles.Select(x => x.Role.Name).Order().ToArray(),
        user.AvatarUrl,
        user.CreatedAt == default ? null : user.CreatedAt,
        user.LastLoginAt);

    private static Dictionary<string, string[]> ValidateProfile(UpdateProfileRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 160)
            errors["fullName"] = ["Full name is required and must be 160 characters or fewer."];

        var avatarUrl = request.AvatarUrl?.Trim();
        if (!string.IsNullOrEmpty(avatarUrl))
        {
            if (avatarUrl.Length > 500 || !Uri.TryCreate(avatarUrl, UriKind.Absolute, out var parsedAvatarUrl)
                || (parsedAvatarUrl.Scheme != Uri.UriSchemeHttp && parsedAvatarUrl.Scheme != Uri.UriSchemeHttps))
                errors["avatarUrl"] = ["Avatar URL must be a valid HTTP or HTTPS URL of 500 characters or fewer."];
        }

        return errors;
    }

    private static string? CleanOptionalAvatar(string? avatarUrl)
    {
        var cleaned = avatarUrl?.Trim();
        return string.IsNullOrEmpty(cleaned) ? null : cleaned;
    }

    private static Dictionary<string, string[]> ValidatePasswordChange(ChangePasswordRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.CurrentPassword))
            errors["currentPassword"] = ["Current password is required."];

        var passwordErrors = ValidatePassword(request.NewPassword, "New password");

        if (passwordErrors.Count > 0) errors["newPassword"] = passwordErrors.ToArray();
        if (!string.Equals(request.NewPassword, request.ConfirmNewPassword, StringComparison.Ordinal))
            errors["confirmNewPassword"] = ["Password confirmation does not match."];
        return errors;
    }

    private static Dictionary<string, string[]> ValidateRegistration(RegisterRequest request)
    {
        var errors = new Dictionary<string, string[]>();
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 160)
            errors["fullName"] = ["Full name is required and must be 160 characters or fewer."];

        if (string.IsNullOrWhiteSpace(request.Email))
            errors["email"] = ["Email is required."];
        else if (request.Email.Trim().Length > 256 || !IsValidEmail(request.Email))
            errors["email"] = ["A valid email address is required."];

        var passwordErrors = ValidatePassword(request.Password, "Password");
        if (passwordErrors.Count > 0) errors["password"] = passwordErrors.ToArray();
        return errors;
    }

    private static List<string> ValidatePassword(string password, string label)
    {
        var errors = new List<string>();
        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add($"{label} is required.");
            return errors;
        }

        if (password.Length < 12) errors.Add($"{label} must contain at least 12 characters.");
        if (!password.Any(char.IsUpper)) errors.Add($"{label} must contain an uppercase letter.");
        if (!password.Any(char.IsLower)) errors.Add($"{label} must contain a lowercase letter.");
        if (!password.Any(char.IsDigit)) errors.Add($"{label} must contain a number.");
        if (!password.Any(character => !char.IsLetterOrDigit(character))) errors.Add($"{label} must contain a special character.");
        return errors;
    }

    private static bool IsValidEmail(string value)
    {
        try { return new MailAddress(value.Trim()).Address == value.Trim(); }
        catch { return false; }
    }

    private static AuditLog CreateAudit(Guid? userId, string action, string entityName, Guid? entityId, string? ipAddress) => new()
    {
        AppUserId = userId,
        Action = action,
        EntityName = entityName,
        EntityId = entityId,
        IpAddress = ipAddress,
        OccurredAt = DateTimeOffset.UtcNow
    };
}

public class AuthenticationFailedException : Exception
{
    public AuthenticationFailedException() : base("Invalid credentials or expired authentication session.") { }
}

public sealed class RefreshTokenReuseException : AuthenticationFailedException;

public sealed class RegistrationConflictException : Exception
{
    public RegistrationConflictException() : base("An account with this email already exists.") { }
}

public sealed class RegistrationValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception("The registration data is invalid.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class CurrentPasswordInvalidException : Exception
{
    public CurrentPasswordInvalidException() : base("The current password is invalid.") { }
}

public sealed class PasswordValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception("The new password is invalid.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}

public sealed class ProfileValidationException(IReadOnlyDictionary<string, string[]> errors) : Exception("The profile data is invalid.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;
}
