using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class AffiliateProgramContentConfiguration : IEntityTypeConfiguration<AffiliateProgramContent>
{
    public void Configure(EntityTypeBuilder<AffiliateProgramContent> builder)
    {
        builder.ToTable("AffiliateProgramContents");
        builder.Property(x => x.Title).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(1000).IsRequired();
        builder.Property(x => x.CommissionSummary).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PolicyMarkdown).HasMaxLength(20000).IsRequired();
        builder.HasIndex(x => x.IsPublished);
    }
}

public sealed class AffiliateApplicationConfiguration : IEntityTypeConfiguration<AffiliateApplication>
{
    public void Configure(EntityTypeBuilder<AffiliateApplication> builder)
    {
        builder.ToTable("AffiliateApplications");
        builder.Property(x => x.FullName).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Email).HasMaxLength(256).IsRequired();
        builder.Property(x => x.PhoneNumber).HasMaxLength(30).IsRequired();
        builder.Property(x => x.CompanyName).HasMaxLength(160);
        builder.Property(x => x.WebsiteUrl).HasMaxLength(500);
        builder.Property(x => x.PromotionChannels).HasMaxLength(500).IsRequired();
        builder.Property(x => x.AudienceDescription).HasMaxLength(1500).IsRequired();
        builder.Property(x => x.ExperienceDescription).HasMaxLength(1500);
        builder.Property(x => x.ReviewNote).HasMaxLength(1000);
        builder.HasIndex(x => new { x.Status, x.CreatedAt });
        builder.HasIndex(x => new { x.Email, x.CreatedAt });
        builder.HasIndex(x => new { x.AppUserId, x.CreatedAt });
        builder.HasOne(x => x.AppUser)
            .WithMany()
            .HasForeignKey(x => x.AppUserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class AffiliateApplicationStatusHistoryConfiguration : IEntityTypeConfiguration<AffiliateApplicationStatusHistory>
{
    public void Configure(EntityTypeBuilder<AffiliateApplicationStatusHistory> builder)
    {
        builder.ToTable("AffiliateApplicationStatusHistories");
        builder.Property(x => x.Note).HasMaxLength(1000);
        builder.HasIndex(x => new { x.AffiliateApplicationId, x.CreatedAt });
        builder.HasOne(x => x.AffiliateApplication)
            .WithMany(x => x.StatusHistory)
            .HasForeignKey(x => x.AffiliateApplicationId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
