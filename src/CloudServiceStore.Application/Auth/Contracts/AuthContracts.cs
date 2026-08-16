namespace CloudServiceStore.Application.Auth.Contracts;

public sealed record LoginRequest(string Email, string Password);

public sealed record RegisterRequest(string FullName, string Email, string Password);

public sealed record ChangePasswordRequest(string CurrentPassword, string NewPassword, string ConfirmNewPassword);

public sealed record UpdateProfileRequest(string FullName, string? AvatarUrl);

public sealed record AuthResponse(string AccessToken, DateTimeOffset AccessTokenExpiresAt, AuthenticatedUserDto User);

public sealed record AuthenticatedUserDto(
    Guid Id,
    string Email,
    string FullName,
    IReadOnlyCollection<string> Roles,
    string? AvatarUrl = null,
    DateTimeOffset? CreatedAt = null,
    DateTimeOffset? LastLoginAt = null);

public sealed record AuthenticationResult(
    string AccessToken,
    DateTimeOffset AccessTokenExpiresAt,
    string RefreshToken,
    DateTimeOffset RefreshTokenExpiresAt,
    AuthenticatedUserDto User);
