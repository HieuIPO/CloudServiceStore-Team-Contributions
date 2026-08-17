using CloudServiceStore.Domain.Entities;

namespace CloudServiceStore.Application.Landing;

public sealed class LandingContentService(ILandingContentRepository repository) : ILandingContentService
{
    public async Task<PublicLandingContentDto?> GetPublicAsync(CancellationToken cancellationToken)
    {
        var content = await repository.GetContentAsync(true, cancellationToken);
        if (content is null) return null;
        return new(
            Map(content),
            (await repository.GetTestimonialsAsync(true, cancellationToken)).Select(Map).ToArray(),
            (await repository.GetCustomerLogosAsync(true, cancellationToken)).Select(Map).ToArray());
    }

    public async Task<PublicLandingContentDto> GetAdminAsync(CancellationToken cancellationToken)
    {
        var content = await repository.GetContentAsync(false, cancellationToken)
            ?? throw new LandingContentNotFoundException("Landing page content is not initialized.");
        return new(
            Map(content),
            (await repository.GetTestimonialsAsync(false, cancellationToken)).Select(Map).ToArray(),
            (await repository.GetCustomerLogosAsync(false, cancellationToken)).Select(Map).ToArray());
    }

    public async Task<LandingPageContentDto> UpdateContentAsync(UpdateLandingPageContentRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateContent(request);
        var content = await repository.GetContentAsync(false, cancellationToken)
            ?? throw new LandingContentNotFoundException("Landing page content is not initialized.");
        content.HeroEyebrow = request.HeroEyebrow.Trim();
        content.HeroTitle = request.HeroTitle.Trim();
        content.HeroDescription = request.HeroDescription.Trim();
        content.PrimaryCtaLabel = request.PrimaryCtaLabel.Trim();
        content.PrimaryCtaUrl = request.PrimaryCtaUrl.Trim();
        content.SecondaryCtaLabel = request.SecondaryCtaLabel.Trim();
        content.SecondaryCtaUrl = request.SecondaryCtaUrl.Trim();
        content.AboutTitle = request.AboutTitle.Trim();
        content.AboutMarkdown = request.AboutMarkdown.Trim();
        content.InfrastructureMarkdown = request.InfrastructureMarkdown.Trim();
        content.UptimeCommitment = request.UptimeCommitment.Trim();
        content.IsPublished = request.IsPublished;
        content.UpdatedBy = actorId;
        repository.AddAudit(actorId, "Landing.ContentUpdated", nameof(LandingPageContent), content.Id);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(content);
    }

    public async Task<TestimonialDto> CreateTestimonialAsync(CreateTestimonialRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateTestimonial(request.CustomerName, request.CustomerRole, request.CompanyName, request.Quote, request.AvatarUrl, request.DisplayOrder);
        var existingTestimonials = (await repository.GetTestimonialsAsync(false, cancellationToken)).ToList();
        NormalizeTestimonialOrders(existingTestimonials);
        ShiftTestimonialOrdersForInsert(existingTestimonials, request.DisplayOrder);
        var testimonial = new Testimonial
        {
            CustomerName = request.CustomerName.Trim(),
            CustomerRole = NullIfWhiteSpace(request.CustomerRole),
            CompanyName = request.CompanyName.Trim(),
            Quote = request.Quote.Trim(),
            AvatarUrl = NullIfWhiteSpace(request.AvatarUrl),
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
            CreatedBy = actorId
        };
        repository.AddTestimonial(testimonial);
        repository.AddAudit(actorId, "Landing.TestimonialCreated", nameof(Testimonial), testimonial.Id);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(testimonial);
    }

    public async Task<TestimonialDto> UpdateTestimonialAsync(Guid id, UpdateTestimonialRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateTestimonial(request.CustomerName, request.CustomerRole, request.CompanyName, request.Quote, request.AvatarUrl, request.DisplayOrder);
        var testimonial = await repository.FindTestimonialAsync(id, cancellationToken)
            ?? throw new LandingContentNotFoundException("Testimonial was not found.");
        var existingTestimonials = (await repository.GetTestimonialsAsync(false, cancellationToken)).ToList();
        var currentIndex = existingTestimonials.FindIndex(item => item.Id == id);
        if (currentIndex >= 0) existingTestimonials[currentIndex] = testimonial;
        else existingTestimonials.Add(testimonial);
        NormalizeTestimonialOrders(existingTestimonials);
        ShiftTestimonialOrdersForMove(existingTestimonials, testimonial, request.DisplayOrder);
        testimonial.CustomerName = request.CustomerName.Trim();
        testimonial.CustomerRole = NullIfWhiteSpace(request.CustomerRole);
        testimonial.CompanyName = request.CompanyName.Trim();
        testimonial.Quote = request.Quote.Trim();
        testimonial.AvatarUrl = NullIfWhiteSpace(request.AvatarUrl);
        testimonial.DisplayOrder = request.DisplayOrder;
        testimonial.IsActive = request.IsActive;
        testimonial.UpdatedBy = actorId;
        repository.AddAudit(actorId, "Landing.TestimonialUpdated", nameof(Testimonial), testimonial.Id);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(testimonial);
    }

    private static void NormalizeTestimonialOrders(IList<Testimonial> testimonials)
    {
        if (testimonials.Count < 2 || testimonials.Select(item => item.DisplayOrder).Distinct().Count() == testimonials.Count) return;

        var ordered = testimonials
            .OrderBy(item => item.DisplayOrder)
            .ThenBy(item => item.CustomerName, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Id)
            .ToArray();
        var firstOrder = ordered[0].DisplayOrder;
        for (var index = 0; index < ordered.Length; index++) ordered[index].DisplayOrder = firstOrder + index;
    }

    private static void ShiftTestimonialOrdersForInsert(IEnumerable<Testimonial> testimonials, int requestedOrder)
    {
        foreach (var testimonial in testimonials.Where(item => item.DisplayOrder >= requestedOrder)) testimonial.DisplayOrder++;
    }

    private static void ShiftTestimonialOrdersForMove(IEnumerable<Testimonial> testimonials, Testimonial moving, int requestedOrder)
    {
        var previousOrder = moving.DisplayOrder;
        if (requestedOrder < previousOrder)
        {
            foreach (var testimonial in testimonials.Where(item => item.Id != moving.Id && item.DisplayOrder >= requestedOrder && item.DisplayOrder < previousOrder)) testimonial.DisplayOrder++;
        }
        else if (requestedOrder > previousOrder)
        {
            foreach (var testimonial in testimonials.Where(item => item.Id != moving.Id && item.DisplayOrder > previousOrder && item.DisplayOrder <= requestedOrder)) testimonial.DisplayOrder--;
        }
    }

    public async Task DeleteTestimonialAsync(Guid id, Guid actorId, CancellationToken cancellationToken)
    {
        var testimonial = await repository.FindTestimonialAsync(id, cancellationToken)
            ?? throw new LandingContentNotFoundException("Testimonial was not found.");
        testimonial.IsDeleted = true;
        testimonial.DeletedAt = DateTimeOffset.UtcNow;
        testimonial.DeletedBy = actorId;
        repository.AddAudit(actorId, "Landing.TestimonialDeleted", nameof(Testimonial), testimonial.Id);
        await repository.SaveChangesAsync(cancellationToken);
    }

    public async Task<CustomerLogoDto> CreateCustomerLogoAsync(CreateCustomerLogoRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateCustomerLogo(request.Name, request.LogoUrl, request.WebsiteUrl, request.AltText, request.DisplayOrder);
        var name = request.Name.Trim();
        if (await repository.CustomerLogoNameExistsAsync(name, null, cancellationToken))
            throw new LandingContentConflictException("A customer logo with the same name already exists.");
        var existingLogos = (await repository.GetCustomerLogosAsync(false, cancellationToken)).ToList();
        NormalizeCustomerLogoOrders(existingLogos);
        ShiftCustomerLogoOrdersForInsert(existingLogos, request.DisplayOrder);
        var logo = new CustomerLogo
        {
            Name = name,
            LogoUrl = request.LogoUrl.Trim(),
            WebsiteUrl = NullIfWhiteSpace(request.WebsiteUrl),
            AltText = request.AltText.Trim(),
            DisplayOrder = request.DisplayOrder,
            IsActive = request.IsActive,
            CreatedBy = actorId
        };
        repository.AddCustomerLogo(logo);
        repository.AddAudit(actorId, "Landing.CustomerLogoCreated", nameof(CustomerLogo), logo.Id);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(logo);
    }

    public async Task<CustomerLogoDto> UpdateCustomerLogoAsync(Guid id, UpdateCustomerLogoRequest request, Guid actorId, CancellationToken cancellationToken)
    {
        ValidateCustomerLogo(request.Name, request.LogoUrl, request.WebsiteUrl, request.AltText, request.DisplayOrder);
        var logo = await repository.FindCustomerLogoAsync(id, cancellationToken)
            ?? throw new LandingContentNotFoundException("Customer logo was not found.");
        var existingLogos = (await repository.GetCustomerLogosAsync(false, cancellationToken)).ToList();
        var currentIndex = existingLogos.FindIndex(item => item.Id == id);
        if (currentIndex >= 0) existingLogos[currentIndex] = logo;
        else existingLogos.Add(logo);
        NormalizeCustomerLogoOrders(existingLogos);
        ShiftCustomerLogoOrdersForMove(existingLogos, logo, request.DisplayOrder);
        var name = request.Name.Trim();
        if (await repository.CustomerLogoNameExistsAsync(name, id, cancellationToken))
            throw new LandingContentConflictException("A customer logo with the same name already exists.");
        logo.Name = name;
        logo.LogoUrl = request.LogoUrl.Trim();
        logo.WebsiteUrl = NullIfWhiteSpace(request.WebsiteUrl);
        logo.AltText = request.AltText.Trim();
        logo.DisplayOrder = request.DisplayOrder;
        logo.IsActive = request.IsActive;
        logo.UpdatedBy = actorId;
        repository.AddAudit(actorId, "Landing.CustomerLogoUpdated", nameof(CustomerLogo), logo.Id);
        await repository.SaveChangesAsync(cancellationToken);
        return Map(logo);
    }

    private static void NormalizeCustomerLogoOrders(IList<CustomerLogo> logos)
    {
        if (logos.Count < 2 || logos.Select(item => item.DisplayOrder).Distinct().Count() == logos.Count) return;

        var ordered = logos
            .OrderBy(item => item.DisplayOrder)
            .ThenBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Id)
            .ToArray();
        var firstOrder = ordered[0].DisplayOrder;
        for (var index = 0; index < ordered.Length; index++) ordered[index].DisplayOrder = firstOrder + index;
    }

    private static void ShiftCustomerLogoOrdersForInsert(IEnumerable<CustomerLogo> logos, int requestedOrder)
    {
        foreach (var logo in logos.Where(item => item.DisplayOrder >= requestedOrder)) logo.DisplayOrder++;
    }

    private static void ShiftCustomerLogoOrdersForMove(IEnumerable<CustomerLogo> logos, CustomerLogo moving, int requestedOrder)
    {
        var previousOrder = moving.DisplayOrder;
        if (requestedOrder < previousOrder)
        {
            foreach (var logo in logos.Where(item => item.Id != moving.Id && item.DisplayOrder >= requestedOrder && item.DisplayOrder < previousOrder)) logo.DisplayOrder++;
        }
        else if (requestedOrder > previousOrder)
        {
            foreach (var logo in logos.Where(item => item.Id != moving.Id && item.DisplayOrder > previousOrder && item.DisplayOrder <= requestedOrder)) logo.DisplayOrder--;
        }
    }

    public async Task DeleteCustomerLogoAsync(Guid id, Guid actorId, CancellationToken cancellationToken)
    {
        var logo = await repository.FindCustomerLogoAsync(id, cancellationToken)
            ?? throw new LandingContentNotFoundException("Customer logo was not found.");
        logo.IsDeleted = true;
        logo.DeletedAt = DateTimeOffset.UtcNow;
        logo.DeletedBy = actorId;
        repository.AddAudit(actorId, "Landing.CustomerLogoDeleted", nameof(CustomerLogo), logo.Id);
        await repository.SaveChangesAsync(cancellationToken);
    }

    private static void ValidateContent(UpdateLandingPageContentRequest request)
    {
        RequireText(request.HeroEyebrow, 80, "Hero eyebrow");
        RequireText(request.HeroTitle, 180, "Hero title");
        RequireText(request.HeroDescription, 500, "Hero description");
        RequireText(request.PrimaryCtaLabel, 80, "Primary CTA label");
        RequireUrl(request.PrimaryCtaUrl, true, 250, "Primary CTA URL");
        RequireText(request.SecondaryCtaLabel, 80, "Secondary CTA label");
        RequireUrl(request.SecondaryCtaUrl, true, 250, "Secondary CTA URL");
        RequireText(request.AboutTitle, 180, "About title");
        RequireText(request.AboutMarkdown, 12_000, "About content");
        RequireText(request.InfrastructureMarkdown, 12_000, "Infrastructure content");
        RequireText(request.UptimeCommitment, 80, "Uptime commitment");
    }

    private static void ValidateTestimonial(string customerName, string? customerRole, string companyName, string quote, string? avatarUrl, int displayOrder)
    {
        RequireText(customerName, 120, "Customer name");
        OptionalText(customerRole, 120, "Customer role");
        RequireText(companyName, 120, "Company name");
        RequireText(quote, 1_000, "Quote");
        if (!string.IsNullOrWhiteSpace(avatarUrl)) RequireUrl(avatarUrl, false, 500, "Avatar URL");
        if (displayOrder < 0) throw new LandingContentValidationException("Display order cannot be negative.");
    }

    private static void ValidateCustomerLogo(string name, string logoUrl, string? websiteUrl, string altText, int displayOrder)
    {
        RequireText(name, 120, "Customer logo name");
        RequireUrl(logoUrl, false, 500, "Logo URL");
        if (!string.IsNullOrWhiteSpace(websiteUrl)) RequireUrl(websiteUrl, false, 500, "Website URL");
        RequireText(altText, 200, "Logo alternative text");
        if (displayOrder < 0) throw new LandingContentValidationException("Display order cannot be negative.");
    }

    private static void RequireText(string value, int maxLength, string field)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new LandingContentValidationException($"{field} is required.");
        if (value.Trim().Length > maxLength) throw new LandingContentValidationException($"{field} cannot exceed {maxLength} characters.");
    }

    private static void OptionalText(string? value, int maxLength, string field)
    {
        if (!string.IsNullOrWhiteSpace(value) && value.Trim().Length > maxLength)
            throw new LandingContentValidationException($"{field} cannot exceed {maxLength} characters.");
    }

    private static void RequireUrl(string value, bool allowRelative, int maxLength, string field)
    {
        var trimmed = value.Trim();
        if (trimmed.Length > maxLength) throw new LandingContentValidationException($"{field} cannot exceed {maxLength} characters.");
        if (allowRelative && trimmed.StartsWith('/') && !trimmed.StartsWith("//", StringComparison.Ordinal)) return;
        if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri) || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            throw new LandingContentValidationException($"{field} must be a valid HTTP URL{(allowRelative ? " or root-relative path" : string.Empty)}.");
    }

    private static string? NullIfWhiteSpace(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static LandingPageContentDto Map(LandingPageContent content) => new(
        content.Id, content.HeroEyebrow, content.HeroTitle, content.HeroDescription,
        content.PrimaryCtaLabel, content.PrimaryCtaUrl, content.SecondaryCtaLabel, content.SecondaryCtaUrl,
        content.AboutTitle, content.AboutMarkdown, content.InfrastructureMarkdown,
        content.UptimeCommitment, content.IsPublished, content.UpdatedAt);

    private static TestimonialDto Map(Testimonial testimonial) => new(
        testimonial.Id, testimonial.CustomerName, testimonial.CustomerRole, testimonial.CompanyName,
        testimonial.Quote, testimonial.AvatarUrl, testimonial.DisplayOrder, testimonial.IsActive);

    private static CustomerLogoDto Map(CustomerLogo logo) => new(
        logo.Id, logo.Name, logo.LogoUrl, logo.WebsiteUrl, logo.AltText, logo.DisplayOrder, logo.IsActive);
}
