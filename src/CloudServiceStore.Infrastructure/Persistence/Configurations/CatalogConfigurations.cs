using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace CloudServiceStore.Infrastructure.Persistence.Configurations;

public sealed class ServiceCategoryConfiguration : IEntityTypeConfiguration<ServiceCategory>
{
    public void Configure(EntityTypeBuilder<ServiceCategory> builder)
    {
        builder.ToTable("ServiceCategories");
        builder.Property(x => x.Name).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(140).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique().HasFilter("[IsDeleted] = 0");
        builder.HasIndex(x => new { x.IsActive, x.DisplayOrder });
    }
}

public sealed class ServicePlanConfiguration : IEntityTypeConfiguration<ServicePlan>
{
    public void Configure(EntityTypeBuilder<ServicePlan> builder)
    {
        builder.ToTable("ServicePlans");
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Slug).HasMaxLength(180).IsRequired();
        builder.Property(x => x.Summary).HasMaxLength(500).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique().HasFilter("[IsDeleted] = 0");
        builder.HasIndex(x => new { x.CategoryId, x.IsActive });
        builder.HasOne(x => x.Category).WithMany(x => x.ServicePlans).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class ServicePlanFeatureConfiguration : IEntityTypeConfiguration<ServicePlanFeature>
{
    public void Configure(EntityTypeBuilder<ServicePlanFeature> builder)
    {
        builder.ToTable("ServicePlanFeatures");
        builder.Property(x => x.FeatureKey).HasMaxLength(60).IsRequired();
        builder.Property(x => x.DisplayName).HasMaxLength(120).IsRequired();
        builder.Property(x => x.Value).HasMaxLength(160).IsRequired();
        builder.Property(x => x.Unit).HasMaxLength(30);
        builder.HasIndex(x => new { x.ServicePlanId, x.FeatureKey }).IsUnique();
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.Features).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class PlanPriceConfiguration : IEntityTypeConfiguration<PlanPrice>
{
    public void Configure(EntityTypeBuilder<PlanPrice> builder)
    {
        builder.ToTable("PlanPrices", table => table.HasCheckConstraint("CK_PlanPrices_Amount_NonNegative", "[Amount] >= 0"));
        builder.Property(x => x.Amount).HasPrecision(18, 2);
        builder.Property(x => x.Currency).HasMaxLength(3).IsRequired();
        builder.HasIndex(x => new { x.ServicePlanId, x.BillingCycle, x.EffectiveFrom });
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.Prices).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class PromotionConfiguration : IEntityTypeConfiguration<Promotion>
{
    public void Configure(EntityTypeBuilder<Promotion> builder)
    {
        builder.ToTable("Promotions", table =>
        {
            table.HasCheckConstraint("CK_Promotions_DiscountValue_Positive", "[DiscountValue] > 0");
            table.HasCheckConstraint("CK_Promotions_Period", "[EndsAt] > [StartsAt]");
            table.HasCheckConstraint("CK_Promotions_BillingCycle_Valid", "[BillingCycle] IS NULL OR [BillingCycle] IN (1, 12)");
        });
        builder.Property(x => x.Code).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(160).IsRequired();
        builder.Property(x => x.DiscountValue).HasPrecision(18, 2);
        builder.Property(x => x.BillingCycle).HasConversion<int?>();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.HasIndex(x => new { x.IsActive, x.StartsAt, x.EndsAt });
        builder.HasIndex(x => new { x.ShowOnPublicBanner, x.IsActive });
    }
}

public sealed class PromotionPlanConfiguration : IEntityTypeConfiguration<PromotionPlan>
{
    public void Configure(EntityTypeBuilder<PromotionPlan> builder)
    {
        builder.ToTable("PromotionPlans");
        builder.HasIndex(x => new { x.PromotionId, x.ServicePlanId }).IsUnique();
        builder.HasOne(x => x.Promotion).WithMany(x => x.PromotionPlans).HasForeignKey(x => x.PromotionId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.ServicePlan).WithMany(x => x.PromotionPlans).HasForeignKey(x => x.ServicePlanId).OnDelete(DeleteBehavior.Cascade);
    }
}
