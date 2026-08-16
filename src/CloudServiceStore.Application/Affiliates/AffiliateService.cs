using System.Net.Mail;
using System.Text.Json;
using System.Text.RegularExpressions;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.Affiliates;

public sealed partial class AffiliateService(
    IAffiliateRepository repository,
    TimeProvider? timeProvider = null) : IAffiliateService
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;

    public async Task<AffiliateProgramContentDto?> GetProgramContentAsync(bool publicOnly, CancellationToken ct)
    {
        var content = await repository.FindProgramContentAsync(ct);
        return content is null || (publicOnly && !content.IsPublished) ? null : Map(content);
    }

    public async Task<AffiliateProgramContentDto> UpdateProgramContentAsync(UpdateAffiliateProgramContentRequest request, Guid actorId, CancellationToken ct)
    {
        ValidateProgramContent(request);
        var content = await repository.FindProgramContentAsync(ct)
            ?? throw new AffiliateNotFoundException("Affiliate program content was not found.");
        var oldValues = JsonSerializer.Serialize(new { content.Title, content.IsPublished });
        content.Title = request.Title.Trim();
        content.Summary = request.Summary.Trim();
        content.CommissionSummary = request.CommissionSummary.Trim();
        content.PolicyMarkdown = request.PolicyMarkdown.Trim();
        content.IsPublished = request.IsPublished;
        content.UpdatedBy = actorId;
        content.UpdatedAt = clock.GetUtcNow();
        repository.AddAudit(actorId, "Affiliate.ProgramUpdated", nameof(AffiliateProgramContent), content.Id,
            oldValues, JsonSerializer.Serialize(new { content.Title, content.IsPublished }), null);
        await repository.SaveChangesAsync(ct);
        return Map(content);
    }

    public async Task<AffiliateApplicationConfirmationDto> CreateApplicationAsync(CreateAffiliateApplicationRequest request, AffiliateApplicationOwner owner, string? ipAddress, CancellationToken ct)
    {
        if (owner.UserId == Guid.Empty || string.IsNullOrWhiteSpace(owner.FullName) || string.IsNullOrWhiteSpace(owner.Email))
            throw new AffiliateValidationException("A valid customer account is required.");

        var effectiveRequest = request with { FullName = owner.FullName, Email = owner.Email };
        ValidateApplication(effectiveRequest);
        var now = clock.GetUtcNow();
        var email = effectiveRequest.Email.Trim().ToLowerInvariant();
        if (await repository.HasRecentApplicationAsync(email, now.AddDays(-30), ct))
            throw new AffiliateConflictException("An affiliate application with this email was submitted in the last 30 days.");

        var application = new AffiliateApplication
        {
            AppUserId = owner.UserId,
            CreatedBy = owner.UserId,
            FullName = effectiveRequest.FullName.Trim(),
            Email = email,
            PhoneNumber = NormalizePhone(effectiveRequest.PhoneNumber),
            CompanyName = CleanOptional(effectiveRequest.CompanyName),
            WebsiteUrl = CleanOptional(effectiveRequest.WebsiteUrl),
            PromotionChannels = effectiveRequest.PromotionChannels.Trim(),
            AudienceDescription = effectiveRequest.AudienceDescription.Trim(),
            ExperienceDescription = CleanOptional(effectiveRequest.ExperienceDescription),
            Status = AffiliateApplicationStatus.Pending,
            CreatedAt = now
        };
        application.StatusHistory.Add(new AffiliateApplicationStatusHistory
        {
            FromStatus = AffiliateApplicationStatus.Pending,
            ToStatus = AffiliateApplicationStatus.Pending,
            Note = "Affiliate application received.",
            CreatedBy = owner.UserId,
            CreatedAt = now
        });
        repository.AddApplication(application);
        repository.AddAudit(owner.UserId, "Affiliate.ApplicationCreated", nameof(AffiliateApplication), application.Id, null,
            JsonSerializer.Serialize(new { application.Status, application.Email }), ipAddress);
        await repository.SaveChangesAsync(ct);
        return new(application.Id, application.Status, application.CreatedAt);
    }

    public async Task<PagedResult<AffiliateApplicationListItemDto>> GetApplicationsAsync(AffiliateApplicationQuery query, CancellationToken ct)
    {
        ValidateQuery(query);
        var result = await repository.GetApplicationsAsync(query, ct);
        return new(result.Items.Select(MapList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<AffiliateApplicationDetailDto?> GetApplicationAsync(Guid id, CancellationToken ct) =>
        (await repository.FindApplicationAsync(id, ct)) is { } application ? MapDetail(application) : null;

    public async Task<PagedResult<CustomerAffiliateApplicationListItemDto>> GetCustomerApplicationsAsync(Guid userId, CustomerAffiliateQuery query, CancellationToken ct)
    {
        ValidateCustomerQuery(userId, query);
        var result = await repository.GetApplicationsForCustomerAsync(userId, query, ct);
        return new(result.Items.Select(MapCustomerList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<CustomerAffiliateApplicationDetailDto?> GetCustomerApplicationAsync(Guid userId, Guid id, CancellationToken ct)
    {
        if (userId == Guid.Empty || id == Guid.Empty) return null;
        return (await repository.FindApplicationForCustomerAsync(id, userId, ct)) is { } application
            ? MapCustomerDetail(application)
            : null;
    }

    public async Task<AffiliateApplicationDetailDto> UpdateStatusAsync(Guid id, UpdateAffiliateStatusRequest request, Guid actorId, string? ipAddress, CancellationToken ct)
    {
        if (!Enum.IsDefined(request.Status))
            throw new AffiliateValidationException("Affiliate application status is not supported.");
        if (request.Note?.Trim().Length > 1000)
            throw new AffiliateValidationException("Review note must be 1000 characters or fewer.");
        if (request.Status == AffiliateApplicationStatus.Rejected && string.IsNullOrWhiteSpace(request.Note))
            throw new AffiliateValidationException("A review note is required when rejecting an application.");

        var application = await repository.FindApplicationAsync(id, ct)
            ?? throw new AffiliateNotFoundException("Affiliate application was not found.");
        if (application.Status == request.Status)
            throw new AffiliateConflictException("Affiliate application already has the selected status.");
        if (!CanTransition(application.Status, request.Status))
            throw new AffiliateConflictException($"Cannot change affiliate application status from {application.Status} to {request.Status}.");

        var previous = application.Status;
        var now = clock.GetUtcNow();
        var note = CleanOptional(request.Note);
        application.Status = request.Status;
        application.ReviewNote = note;
        application.ReviewedBy = actorId;
        application.ReviewedAt = request.Status is AffiliateApplicationStatus.Approved or AffiliateApplicationStatus.Rejected ? now : null;
        application.UpdatedBy = actorId;
        application.UpdatedAt = now;
        var history = new AffiliateApplicationStatusHistory
        {
            AffiliateApplicationId = application.Id,
            FromStatus = previous,
            ToStatus = request.Status,
            Note = note,
            ChangedBy = actorId,
            CreatedBy = actorId,
            CreatedAt = now
        };
        application.StatusHistory.Add(history);
        repository.AddStatusHistory(history);
        repository.AddAudit(actorId, "Affiliate.StatusChanged", nameof(AffiliateApplication), application.Id,
            JsonSerializer.Serialize(new { Status = previous }),
            JsonSerializer.Serialize(new { application.Status, Note = note }), ipAddress);
        await repository.SaveChangesAsync(ct);
        return MapDetail(application);
    }

    private static bool CanTransition(AffiliateApplicationStatus from, AffiliateApplicationStatus to) => from switch
    {
        AffiliateApplicationStatus.Pending => to is AffiliateApplicationStatus.UnderReview or AffiliateApplicationStatus.Approved or AffiliateApplicationStatus.Rejected,
        AffiliateApplicationStatus.UnderReview => to is AffiliateApplicationStatus.Approved or AffiliateApplicationStatus.Rejected,
        _ => false
    };

    private static void ValidateProgramContent(UpdateAffiliateProgramContentRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || request.Title.Trim().Length > 180)
            throw new AffiliateValidationException("Title is required and must be 180 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Summary) || request.Summary.Trim().Length > 1000)
            throw new AffiliateValidationException("Summary is required and must be 1000 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.CommissionSummary) || request.CommissionSummary.Trim().Length > 500)
            throw new AffiliateValidationException("Commission summary is required and must be 500 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.PolicyMarkdown) || request.PolicyMarkdown.Trim().Length > 20000)
            throw new AffiliateValidationException("Policy Markdown is required and must be 20000 characters or fewer.");
    }

    private static void ValidateApplication(CreateAffiliateApplicationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 160)
            throw new AffiliateValidationException("Full name is required and must be 160 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Trim().Length > 256 || !IsValidEmail(request.Email))
            throw new AffiliateValidationException("A valid email address is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || !PhonePattern().IsMatch(request.PhoneNumber.Trim()))
            throw new AffiliateValidationException("A valid phone number from 8 to 15 digits is required.");
        if (request.CompanyName?.Trim().Length > 160)
            throw new AffiliateValidationException("Company name must be 160 characters or fewer.");
        if (!string.IsNullOrWhiteSpace(request.WebsiteUrl) && !IsSafeWebUrl(request.WebsiteUrl))
            throw new AffiliateValidationException("Website URL must be an absolute HTTP or HTTPS URL.");
        if (string.IsNullOrWhiteSpace(request.PromotionChannels) || request.PromotionChannels.Trim().Length > 500)
            throw new AffiliateValidationException("Promotion channels are required and must be 500 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.AudienceDescription) || request.AudienceDescription.Trim().Length > 1500)
            throw new AffiliateValidationException("Audience description is required and must be 1500 characters or fewer.");
        if (request.ExperienceDescription?.Trim().Length > 1500)
            throw new AffiliateValidationException("Experience description must be 1500 characters or fewer.");
    }

    private static void ValidateQuery(AffiliateApplicationQuery query)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new AffiliateValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Search?.Trim().Length > 256)
            throw new AffiliateValidationException("Search must be 256 characters or fewer.");
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new AffiliateValidationException("Affiliate application status is not supported.");
        if (query.CreatedFrom is not null && query.CreatedTo is not null && query.CreatedTo < query.CreatedFrom)
            throw new AffiliateValidationException("CreatedTo must be on or after CreatedFrom.");
    }

    private static void ValidateCustomerQuery(Guid userId, CustomerAffiliateQuery query)
    {
        if (userId == Guid.Empty)
            throw new AffiliateValidationException("A valid customer account is required.");
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new AffiliateValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new AffiliateValidationException("Affiliate application status is not supported.");
    }

    private static bool IsValidEmail(string value)
    {
        try { return new MailAddress(value.Trim()).Address == value.Trim(); }
        catch { return false; }
    }

    private static bool IsSafeWebUrl(string value) =>
        Uri.TryCreate(value.Trim(), UriKind.Absolute, out var uri)
        && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps)
        && string.IsNullOrEmpty(uri.UserInfo);

    private static string NormalizePhone(string value) => Regex.Replace(value.Trim(), "[\\s().-]", "");
    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
    [GeneratedRegex(@"^\+?(?:[\d][\s().-]*){8,15}$")]
    private static partial Regex PhonePattern();

    private static AffiliateProgramContentDto Map(AffiliateProgramContent x) =>
        new(x.Id, x.Title, x.Summary, x.CommissionSummary, x.PolicyMarkdown, x.IsPublished, x.UpdatedAt);

    private static AffiliateApplicationListItemDto MapList(AffiliateApplication x) =>
        new(x.Id, x.FullName, x.Email, x.PhoneNumber, x.CompanyName, x.WebsiteUrl, x.PromotionChannels, x.Status, x.CreatedAt);

    private static AffiliateApplicationDetailDto MapDetail(AffiliateApplication x) =>
        new(x.Id, x.FullName, x.Email, x.PhoneNumber, x.CompanyName, x.WebsiteUrl, x.PromotionChannels,
            x.AudienceDescription, x.ExperienceDescription, x.Status, x.ReviewNote, x.ReviewedBy, x.ReviewedAt,
            x.CreatedAt, x.UpdatedAt, x.StatusHistory.OrderBy(item => item.CreatedAt).Select(item =>
                new AffiliateStatusHistoryDto(item.Id, item.FromStatus, item.ToStatus, item.Note, item.ChangedBy, item.CreatedAt)).ToArray());

    private static CustomerAffiliateApplicationListItemDto MapCustomerList(AffiliateApplication x) =>
        new(x.Id, x.FullName, x.CompanyName, x.Status, x.CreatedAt, x.UpdatedAt);

    private static CustomerAffiliateApplicationDetailDto MapCustomerDetail(AffiliateApplication x) =>
        new(x.Id, x.FullName, x.Email, x.PhoneNumber, x.CompanyName, x.WebsiteUrl, x.PromotionChannels,
            x.AudienceDescription, x.ExperienceDescription, x.Status, x.CreatedAt, x.UpdatedAt,
            x.StatusHistory.OrderBy(item => item.CreatedAt).Select(item =>
                new CustomerAffiliateStatusHistoryDto(item.Id, item.FromStatus, item.ToStatus, item.CreatedAt)).ToArray());
}
