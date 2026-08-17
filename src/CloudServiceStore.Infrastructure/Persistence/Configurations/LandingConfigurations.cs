using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class LandingPageContentConfiguration : IEntityTypeConfiguration<LandingPageContent>
{
    public void Configure(EntityTypeBuilder<LandingPageContent> builder)
    {
        builder.ToTable("LandingPageContents");
        builder.Property(x => x.HeroEyebrow).HasMaxLength(80).IsRequired();
        builder.Property(x => x.HeroTitle).HasMaxLength(180).IsRequired();
        builder.Property(x => x.HeroDescription).HasMaxLength(500).IsRequired();
        builder.Property(x => x.PrimaryCtaLabel).HasMaxLength(80).IsRequired();
        builder.Property(x => x.PrimaryCtaUrl).HasMaxLength(250).IsRequired();
        builder.Property(x => x.SecondaryCtaLabel).HasMaxLength(80).IsRequired();
        builder.Property(x => x.SecondaryCtaUrl).HasMaxLength(250).IsRequired();
        builder.Property(x => x.AboutTitle).HasMaxLength(180).IsRequired();
        builder.Property(x => x.AboutMarkdown).HasMaxLength(12_000).IsRequired();
        builder.Property(x => x.InfrastructureMarkdown).HasMaxLength(12_000).IsRequired();
        builder.Property(x => x.UptimeCommitment).HasMaxLength(80).IsRequired();
        builder.HasIndex(x => x.IsPublished);
    }
}

public sealed class TestimonialConfiguration : IEntityTypeConfiguration<Testimonial>
{
    public void Configure(EntityTypeBuilder<Testimonial> builder)
    {
        builder.ToTable("Testimonials");
        builder.Property(x => x.CustomerName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.CustomerRole).HasMaxLength(120);
        builder.Property(x => x.CompanyName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Quote).HasMaxLength(1_000).IsRequired();
        builder.Property(x => x.AvatarUrl).HasMaxLength(500);
        builder.HasIndex(x => new { x.IsActive, x.DisplayOrder });
    }
}

public sealed class CustomerLogoConfiguration : IEntityTypeConfiguration<CustomerLogo>
{
    public void Configure(EntityTypeBuilder<CustomerLogo> builder)
    {
        builder.ToTable("CustomerLogos");
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.LogoUrl).HasMaxLength(500).IsRequired();
        builder.Property(x => x.WebsiteUrl).HasMaxLength(500);
        builder.Property(x => x.AltText).HasMaxLength(200).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
        builder.HasIndex(x => new { x.IsActive, x.DisplayOrder });
    }
}
