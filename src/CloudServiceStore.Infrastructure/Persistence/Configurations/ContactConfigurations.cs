using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class ContactRequestConfiguration : IEntityTypeConfiguration<ContactRequest>
{
    public void Configure(EntityTypeBuilder<ContactRequest> builder)
    {
        builder.ToTable("ContactRequests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(160);
        builder.Property(x => x.Subject).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Message).HasMaxLength(4000).IsRequired();
        builder.Property(x => x.Status).IsRequired();
        builder.Property(x => x.ResolutionNote).HasMaxLength(1000);
        builder.HasIndex(x => new { x.AppUserId, x.CreatedAt });
        builder.HasIndex(x => new { x.Email, x.CreatedAt });
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasOne(x => x.AppUser)
            .WithMany()
            .HasForeignKey(x => x.AppUserId)
            .OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(x => x.StatusHistory)
            .WithOne(x => x.ContactRequest)
            .HasForeignKey(x => x.ContactRequestId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class ContactRequestStatusHistoryConfiguration : IEntityTypeConfiguration<ContactRequestStatusHistory>
{
    public void Configure(EntityTypeBuilder<ContactRequestStatusHistory> builder)
    {
        builder.ToTable("ContactRequestStatusHistories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.Property(x => x.FromStatus).IsRequired();
        builder.Property(x => x.ToStatus).IsRequired();
        builder.HasIndex(x => new { x.ContactRequestId, x.CreatedAt });
    }
}
