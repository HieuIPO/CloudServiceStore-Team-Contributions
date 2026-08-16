using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Landing;

public interface ILandingContentRepository
{
    Task<LandingPageContent?> GetContentAsync(bool publicOnly, CancellationToken cancellationToken);
    Task<IReadOnlyList<Testimonial>> GetTestimonialsAsync(bool publicOnly, CancellationToken cancellationToken);
    Task<IReadOnlyList<CustomerLogo>> GetCustomerLogosAsync(bool publicOnly, CancellationToken cancellationToken);
    Task<Testimonial?> FindTestimonialAsync(Guid id, CancellationToken cancellationToken);
    Task<CustomerLogo?> FindCustomerLogoAsync(Guid id, CancellationToken cancellationToken);
    Task<bool> CustomerLogoNameExistsAsync(string name, Guid? excludedId, CancellationToken cancellationToken);
    void AddTestimonial(Testimonial testimonial);
    void AddCustomerLogo(CustomerLogo customerLogo);
    void AddAudit(Guid actorId, string action, string entityName, Guid entityId);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}

public sealed class LandingContentNotFoundException(string message) : Exception(message);
public sealed class LandingContentConflictException(string message) : Exception(message);
public sealed class LandingContentValidationException(string message) : Exception(message);
