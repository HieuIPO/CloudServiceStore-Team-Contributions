using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Authentication;

public sealed class AuthRepository(CloudServiceStoreDbContext dbContext) : IAuthRepository
{
    public Task<AppUser?> FindByEmailAsync(string email, CancellationToken cancellationToken) =>
        UsersWithRoles().SingleOrDefaultAsync(x => x.Email == email, cancellationToken);

    public Task<Role?> FindRoleByNameAsync(string name, CancellationToken cancellationToken) =>
        dbContext.Roles.SingleOrDefaultAsync(x => x.Name == name, cancellationToken);

    public Task<RefreshToken?> FindRefreshTokenAsync(string tokenHash, CancellationToken cancellationToken) =>
        dbContext.RefreshTokens
            .Include(x => x.AppUser)
            .ThenInclude(x => x.UserRoles)
            .ThenInclude(x => x.Role)
            .SingleOrDefaultAsync(x => x.TokenHash == tokenHash, cancellationToken);

    public Task<AppUser?> FindUserByIdAsync(Guid userId, CancellationToken cancellationToken) =>
        UsersWithRoles().SingleOrDefaultAsync(x => x.Id == userId, cancellationToken);

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);

    public void AddUser(AppUser user) => dbContext.AppUsers.Add(user);

    public void AddRefreshToken(RefreshToken refreshToken) => dbContext.RefreshTokens.Add(refreshToken);

    public void AddAuditLog(AuditLog auditLog) => dbContext.AuditLogs.Add(auditLog);

    public void RevokeActiveRefreshTokens(Guid userId, DateTimeOffset revokedAt)
    {
        foreach (var token in dbContext.RefreshTokens.Local.Where(x => x.AppUserId == userId && x.RevokedAt is null)) token.RevokedAt = revokedAt;
        dbContext.RefreshTokens
            .Where(x => x.AppUserId == userId && x.RevokedAt == null)
            .ExecuteUpdate(setters => setters.SetProperty(x => x.RevokedAt, revokedAt));
    }

    private IQueryable<AppUser> UsersWithRoles() => dbContext.AppUsers
        .Include(x => x.UserRoles)
        .ThenInclude(x => x.Role);
}
