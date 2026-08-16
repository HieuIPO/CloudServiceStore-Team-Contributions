using Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class AuditLogConfiguration : IEntityTypeConfiguration<AuditLog>
{
    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.EntityName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.Action).IsRequired().HasMaxLength(50);
        builder.Property(x => x.Actor).IsRequired().HasMaxLength(100);
        builder.Property(x => x.BeforeSnapshot).HasMaxLength(4000);
        builder.Property(x => x.AfterSnapshot).HasMaxLength(4000);
    }
}
