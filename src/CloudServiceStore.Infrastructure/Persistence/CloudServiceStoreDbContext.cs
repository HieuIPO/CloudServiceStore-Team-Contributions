using CloudServiceStore.Domain.Common;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class CloudServiceStoreDbContext(DbContextOptions<CloudServiceStoreDbContext> options) : DbContext(options)
{
    public DbSet<ServiceCategory> ServiceCategories => Set<ServiceCategory>();
    public DbSet<ServicePlan> ServicePlans => Set<ServicePlan>();
    public DbSet<ServicePlanFeature> ServicePlanFeatures => Set<ServicePlanFeature>();
    public DbSet<PlanPrice> PlanPrices => Set<PlanPrice>();
    public DbSet<Promotion> Promotions => Set<Promotion>();
    public DbSet<PromotionPlan> PromotionPlans => Set<PromotionPlan>();
    public DbSet<NewsCategory> NewsCategories => Set<NewsCategory>();
    public DbSet<NewsArticle> NewsArticles => Set<NewsArticle>();
    public DbSet<LandingPageContent> LandingPageContents => Set<LandingPageContent>();
    public DbSet<Testimonial> Testimonials => Set<Testimonial>();
    public DbSet<CustomerLogo> CustomerLogos => Set<CustomerLogo>();
    public DbSet<AffiliateProgramContent> AffiliateProgramContents => Set<AffiliateProgramContent>();
    public DbSet<AffiliateApplication> AffiliateApplications => Set<AffiliateApplication>();
    public DbSet<AffiliateApplicationStatusHistory> AffiliateApplicationStatusHistories => Set<AffiliateApplicationStatusHistory>();
    public DbSet<AppUser> AppUsers => Set<AppUser>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<OrderRequest> OrderRequests => Set<OrderRequest>();
    public DbSet<OrderRequestStatusHistory> OrderRequestStatusHistories => Set<OrderRequestStatusHistory>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ContactRequest> ContactRequests => Set<ContactRequest>();
    public DbSet<ContactRequestStatusHistory> ContactRequestStatusHistories => Set<ContactRequestStatusHistory>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(CloudServiceStoreDbContext).Assembly);
        foreach (var entityType in modelBuilder.Model.GetEntityTypes().Where(type => typeof(SoftDeletableEntity).IsAssignableFrom(type.ClrType)))
        {
            modelBuilder.Entity(entityType.ClrType).HasQueryFilter(BuildNotDeletedFilter(entityType.ClrType));
        }
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        ApplyAuditTimestamps();
        return base.SaveChangesAsync(cancellationToken);
    }

    private void ApplyAuditTimestamps()
    {
        var now = DateTimeOffset.UtcNow;
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            if (entry.State == EntityState.Added) entry.Entity.CreatedAt = now;
            if (entry.State == EntityState.Modified) entry.Entity.UpdatedAt = now;
        }
    }

    private static System.Linq.Expressions.LambdaExpression BuildNotDeletedFilter(Type entityType)
    {
        var parameter = System.Linq.Expressions.Expression.Parameter(entityType, "entity");
        var property = System.Linq.Expressions.Expression.Property(parameter, nameof(SoftDeletableEntity.IsDeleted));
        var body = System.Linq.Expressions.Expression.Equal(property, System.Linq.Expressions.Expression.Constant(false));
        return System.Linq.Expressions.Expression.Lambda(body, parameter);
    }
}
