using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

internal static partial class VisualQaDataSeeder
{
    public static async Task SeedAsync(
        CloudServiceStoreDbContext dbContext,
        string? adminPassword,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(adminPassword))
        {
            throw new InvalidOperationException("Seed:AdminPassword is required when Seed:VisualQaData=true.");
        }

        var now = DateTimeOffset.UtcNow;
        var actors = await EnsureActorsAsync(dbContext, adminPassword, cancellationToken);

        await SeedCatalogAsync(dbContext, now, cancellationToken);
        await SeedPromotionsAsync(dbContext, now, cancellationToken);
        await SeedLandingAsync(dbContext, now, cancellationToken);
        await SeedNewsAsync(dbContext, now, cancellationToken);
        await SeedOrdersAsync(dbContext, actors, now, cancellationToken);
        await SeedAffiliatesAsync(dbContext, actors, now, cancellationToken);
        await SeedAuditLogsAsync(dbContext, actors, now, cancellationToken);
    }

    private static async Task<SeededActors> EnsureActorsAsync(
        CloudServiceStoreDbContext dbContext,
        string adminPassword,
        CancellationToken cancellationToken)
    {
        var roleDefinitions = new[]
        {
            (VisualQaSeedIds.AdminRoleId, "Admin", "Visual QA administrator"),
            (VisualQaSeedIds.EditorRoleId, "Editor", "Visual QA content editor"),
            (VisualQaSeedIds.CustomerRoleId, "Customer", "Visual QA customer account")
        };

        var roles = new Dictionary<string, Role>(StringComparer.OrdinalIgnoreCase);
        foreach (var (id, name, description) in roleDefinitions)
        {
            var role = await dbContext.Roles.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
                ?? await dbContext.Roles.FirstOrDefaultAsync(x => x.Name == name, cancellationToken);
            if (role is null)
            {
                role = new Role { Id = id, Name = name, Description = description };
                dbContext.Roles.Add(role);
            }

            roles[name] = role;
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        var hasher = new PasswordHasher<AppUser>();
        var admin = await EnsureUserAsync(
            dbContext,
            hasher,
            VisualQaSeedIds.AdminUserId,
            "admin@cloud.local",
            "Cloud Visual QA Admin",
            roles["Admin"].Id,
            adminPassword,
            cancellationToken);
        var editor = await EnsureUserAsync(
            dbContext,
            hasher,
            VisualQaSeedIds.EditorUserId,
            "editor@cloud.local",
            "Cloud Visual QA Editor",
            roles["Editor"].Id,
            adminPassword,
            cancellationToken);

        await dbContext.SaveChangesAsync(cancellationToken);
        return new SeededActors(admin.Id, editor.Id);
    }

    private static async Task<AppUser> EnsureUserAsync(
        CloudServiceStoreDbContext dbContext,
        IPasswordHasher<AppUser> hasher,
        Guid id,
        string email,
        string fullName,
        Guid roleId,
        string password,
        CancellationToken cancellationToken)
    {
        var user = await dbContext.AppUsers.FirstOrDefaultAsync(x => x.Id == id, cancellationToken)
            ?? await dbContext.AppUsers.FirstOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (user is null)
        {
            user = new AppUser { Id = id, Email = email, FullName = fullName };
            user.PasswordHash = hasher.HashPassword(user, password);
            dbContext.AppUsers.Add(user);
        }

        if (!await dbContext.Set<AppUserRole>().AnyAsync(x => x.AppUserId == user.Id && x.RoleId == roleId, cancellationToken))
        {
            dbContext.Set<AppUserRole>().Add(new AppUserRole { AppUserId = user.Id, RoleId = roleId });
        }

        return user;
    }

    private static async Task PersistNewEntitiesAsync(
        CloudServiceStoreDbContext dbContext,
        IReadOnlyDictionary<AuditableEntity, DateTimeOffset> createdAt,
        CancellationToken cancellationToken)
    {
        if (createdAt.Count == 0) return;

        await dbContext.SaveChangesAsync(cancellationToken);
        foreach (var (entity, timestamp) in createdAt)
        {
            entity.CreatedAt = timestamp;
            dbContext.Entry(entity).Property(x => x.CreatedAt).IsModified = true;
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }

    private sealed record SeededActors(Guid AdminId, Guid EditorId);
}
