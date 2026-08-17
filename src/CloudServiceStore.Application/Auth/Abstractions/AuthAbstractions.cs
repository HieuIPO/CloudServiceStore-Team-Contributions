using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Application.Auth.Contracts;

namespace CloudServiceStore.Application.Auth.Abstractions;

public interface IAuthRepository
{
    Task<AppUser?> FindByEmailAsync(string email, CancellationToken cancellationToken);
    Task<Role?> FindRoleByNameAsync(string name, CancellationToken cancellationToken);
    Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken);
    Task<AppUser?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
    void AddUser(AppUser user);
    void AddRefreshToken(RefreshToken refreshToken);
    void AddAuditLog(AuditLog auditLog);
    void RevokeActiveRefreshTokens(Guid userId, DateTimeOffset revokedAt);
}

public interface IPasswordService
{
    bool Verify(AppUser user, string password);
    string Hash(AppUser user, string password);
}

public interface ITokenService
{
    AccessTokenResult CreateAccessToken(AppUser user);
    string CreateRefreshToken();
    string HashRefreshToken(string token);
}

public sealed record AccessTokenResult(string Token, DateTimeOffset ExpiresAt);

public interface IAuthService
{
    Task<AuthenticationResult> RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthenticationResult> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthenticationResult> RefreshAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken);
    Task LogoutAsync(string refreshToken, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthenticatedUserDto?> GetCurrentUserAsync(Guid userId, CancellationToken cancellationToken);
    Task ChangePasswordAsync(Guid userId, ChangePasswordRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<AuthenticatedUserDto> UpdateProfileAsync(Guid userId, UpdateProfileRequest request, string? ipAddress, CancellationToken cancellationToken);
}
