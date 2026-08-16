using Domain.Entities.Catalog;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class ServicePlanConfiguration : IEntityTypeConfiguration<ServicePlan>
{
    public void Configure(EntityTypeBuilder<ServicePlan> builder)
    {
        builder.HasKey(x => x.Id);

        builder.Property(x => x.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(x => x.Description)
            .HasMaxLength(1000);

        builder.HasOne(x => x.ServiceCategory)
            .WithMany(c => c.ServicePlans)
            .HasForeignKey(x => x.ServiceCategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasQueryFilter(x => !x.IsDeleted);
    }
}
