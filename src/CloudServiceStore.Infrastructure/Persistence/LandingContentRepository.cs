using CloudServiceStore.Application.Landing;
using CloudServiceStore.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class LandingContentRepository(CloudServiceStoreDbContext dbContext) : ILandingContentRepository
{
    public Task<LandingPageContent?> GetContentAsync(bool publicOnly, CancellationToken cancellationToken)
    {
        IQueryable<LandingPageContent> source = dbContext.LandingPageContents;
        if (publicOnly) source = source.AsNoTracking().Where(x => x.IsPublished);
        return source.OrderBy(x => x.CreatedAt).FirstOrDefaultAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<Testimonial>> GetTestimonialsAsync(bool publicOnly, CancellationToken cancellationToken)
    {
        IQueryable<Testimonial> source = dbContext.Testimonials;
        if (publicOnly) source = source.AsNoTracking().Where(x => x.IsActive);
        return await source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.CustomerName).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<CustomerLogo>> GetCustomerLogosAsync(bool publicOnly, CancellationToken cancellationToken)
    {
        IQueryable<CustomerLogo> source = dbContext.CustomerLogos;
        if (publicOnly) source = source.AsNoTracking().Where(x => x.IsActive);
        return await source.OrderBy(x => x.DisplayOrder).ThenBy(x => x.Name).ToListAsync(cancellationToken);
    }

    public Task<Testimonial?> FindTestimonialAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Testimonials.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<CustomerLogo?> FindCustomerLogoAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.CustomerLogos.FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

    public Task<bool> CustomerLogoNameExistsAsync(string name, Guid? excludedId, CancellationToken cancellationToken) =>
        dbContext.CustomerLogos.IgnoreQueryFilters()
            .AnyAsync(x => x.Name == name && (!excludedId.HasValue || x.Id != excludedId), cancellationToken);

    public void AddTestimonial(Testimonial testimonial) => dbContext.Testimonials.Add(testimonial);
    public void AddCustomerLogo(CustomerLogo customerLogo) => dbContext.CustomerLogos.Add(customerLogo);
    public void AddAudit(Guid actorId, string action, string entityName, Guid entityId) =>
        dbContext.AuditLogs.Add(new AuditLog
        {
            AppUserId = actorId,
            Action = action,
            EntityName = entityName,
            EntityId = entityId,
            OccurredAt = DateTimeOffset.UtcNow
        });

    public Task SaveChangesAsync(CancellationToken cancellationToken) => dbContext.SaveChangesAsync(cancellationToken);
}
