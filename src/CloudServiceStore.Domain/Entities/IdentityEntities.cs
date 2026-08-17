using CloudServiceStore.Domain.Common;

namespace CloudServiceStore.Domain.Entities;

public sealed class AppUser : AuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTimeOffset? LastLoginAt { get; set; }
    public ICollection<AppUserRole> UserRoles { get; } = new List<AppUserRole>();
    public ICollection<RefreshToken> RefreshTokens { get; } = new List<RefreshToken>();
}

public sealed class Role : AuditableEntity
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public ICollection<AppUserRole> UserRoles { get; } = new List<AppUserRole>();
}

public sealed class AppUserRole
{
    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;
    public Guid RoleId { get; set; }
    public Role Role { get; set; } = null!;
}

public sealed class RefreshToken : AuditableEntity
{
    public Guid AppUserId { get; set; }
    public AppUser AppUser { get; set; } = null!;
    public string TokenHash { get; set; } = string.Empty;
    public DateTimeOffset ExpiresAt { get; set; }
    public DateTimeOffset? RevokedAt { get; set; }
    public string? ReplacedByTokenHash { get; set; }
}
