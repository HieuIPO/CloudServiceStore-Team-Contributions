using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
{
    public void Configure(EntityTypeBuilder<AppUser> builder)
    {
        builder.ToTable("AppUsers");
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.AvatarUrl).HasMaxLength(500);
        builder.HasIndex(x => x.Email).IsUnique();
    }
}

public sealed class RoleConfiguration : IEntityTypeConfiguration<Role>
{
    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.Property(x => x.Name).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
    }
}

public sealed class AppUserRoleConfiguration : IEntityTypeConfiguration<AppUserRole>
{
    public void Configure(EntityTypeBuilder<AppUserRole> builder)
    {
        builder.ToTable("AppUserRoles");
        builder.HasKey(x => new { x.AppUserId, x.RoleId });
        builder.HasOne(x => x.AppUser).WithMany(x => x.UserRoles).HasForeignKey(x => x.AppUserId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Role).WithMany(x => x.UserRoles).HasForeignKey(x => x.RoleId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.ToTable("RefreshTokens");
        builder.Property(x => x.TokenHash).HasMaxLength(64).IsRequired();
        builder.Property(x => x.ReplacedByTokenHash).HasMaxLength(64);
        builder.HasIndex(x => x.TokenHash).IsUnique();
        builder.HasIndex(x => new { x.AppUserId, x.RevokedAt, x.ExpiresAt });
        builder.HasOne(x => x.AppUser).WithMany(x => x.RefreshTokens).HasForeignKey(x => x.AppUserId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.Property(x => x.Action).HasMaxLength(120).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.IpAddress).HasMaxLength(64);
        builder.HasIndex(x => new { x.OccurredAt, x.AppUserId });
    }
}

public sealed class OrderRequestConfiguration : IEntityTypeConfiguration<OrderRequest>
{
    public void Configure(EntityTypeBuilder<OrderRequest> builder)
    {
        builder.ToTable("OrderRequests", table =>
        {
            table.HasCheckConstraint("CK_OrderRequests_OriginalAmount_NonNegative", "[OriginalAmount] >= 0");
            table.HasCheckConstraint("CK_OrderRequests_QuotedAmount_NonNegative", "[QuotedAmount] >= 0");
        });
        builder.Property(x => x.CustomerName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(160);
        builder.Property(x => x.OriginalAmount).HasPrecision(18, 2);
        builder.Property(x => x.QuotedAmount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.Property(x => x.PlanNameSnapshot).HasMaxLength(160).IsRequired();
        builder.Property(x => x.PromotionCodeSnapshot).HasMaxLength(50);
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasIndex(x => new { x.ServicePlanId, x.CreatedAt });
        builder.HasIndex(x => new { x.Email, x.CreatedAt });
        builder.HasIndex(x => new { x.AppUserId, x.CreatedAt });
        builder.HasOne(x => x.AppUser)
            .WithMany()
            .HasForeignKey(x => x.AppUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.ServicePlan).WithMany().HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class OrderRequestStatusHistoryConfiguration : IEntityTypeConfiguration<OrderRequestStatusHistory>
{
    public void Configure(EntityTypeBuilder<OrderRequestStatusHistory> builder)
    {
        builder.ToTable("OrderRequestStatusHistories");
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.HasIndex(x => new { x.OrderRequestId, x.CreatedAt });
        builder.HasOne(x => x.OrderRequest)
            .WithMany(x => x.StatusHistory)
            .HasForeignKey(x => x.OrderRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
