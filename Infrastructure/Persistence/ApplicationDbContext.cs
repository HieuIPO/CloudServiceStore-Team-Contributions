using Domain.Common;
using Domain.Entities;
using Domain.Entities.Catalog;
using Domain.Entities.Promotions;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }

    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServicePlan> ServicePlans => Set<ServicePlan>();
    public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();
    public DbSet<ServicePlanFeature> ServicePlanFeatures => Set<ServicePlanFeature>();
    public DbSet<Promotion> Promotions => Set<Promotion>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
