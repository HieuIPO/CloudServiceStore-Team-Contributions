using System.Net.Mail;
using System.Text.Json;
using System.Text.RegularExpressions;
using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.ContactRequests;

public sealed partial class ContactRequestService(IContactRequestRepository repository, TimeProvider? timeProvider = null) : IContactRequestService
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;

    public async Task<ContactRequestConfirmationDto> CreateAsync(CreateContactRequestRequest request, Guid? ownerId, string? ipAddress, CancellationToken ct)
    {
        ValidateCreate(request);
        var now = clock.GetUtcNow();
        var email = request.Email.Trim().ToLowerInvariant();
        if (await repository.HasRecentRequestAsync(email, now.AddHours(-24), ct))
            throw new ContactRequestConflictException("A contact request with this email was submitted recently.");

        var item = new ContactRequest
        {
            AppUserId = ownerId,
            CreatedBy = ownerId,
            FullName = request.FullName.Trim(),
            Email = email,
            PhoneNumber = NormalizePhone(request.PhoneNumber),
            CompanyName = CleanOptional(request.CompanyName),
            Subject = request.Subject.Trim(),
            Message = request.Message.Trim(),
            Status = ContactRequestStatus.New,
            CreatedAt = now
        };
        item.StatusHistory.Add(new ContactRequestStatusHistory
        {
            ContactRequest = item,
            FromStatus = ContactRequestStatus.New,
            ToStatus = ContactRequestStatus.New,
            Note = "Contact request received.",
            ChangedBy = ownerId,
            CreatedBy = ownerId,
            CreatedAt = now
        });
        repository.Add(item);
        repository.AddAudit(ownerId, "ContactRequest.Created", nameof(ContactRequest), item.Id, null, JsonSerializer.Serialize(new { item.Status, item.Email }), ipAddress);
        await repository.SaveChangesAsync(ct);
        return new(item.Id, item.Status, item.CreatedAt);
    }

    public async Task<PagedResult<ContactRequestListItemDto>> GetAsync(ContactRequestQuery query, CancellationToken ct)
    {
        ValidateQuery(query);
        var result = await repository.GetAsync(query, ct);
        return new(result.Items.Select(MapList).ToArray(), query.Page, query.PageSize, result.Total);
    }

    public async Task<ContactRequestDetailDto?> GetByIdAsync(Guid id, CancellationToken ct)
    {
        if (id == Guid.Empty) return null;
        return (await repository.FindAsync(id, ct)) is { } item ? MapDetail(item) : null;
    }

    public async Task<ContactRequestDetailDto> UpdateStatusAsync(Guid id, UpdateContactRequestStatusRequest request, Guid actorId, string? ipAddress, CancellationToken ct)
    {
        if (actorId == Guid.Empty || !Enum.IsDefined(request.Status))
            throw new ContactRequestValidationException("A valid actor and status are required.");
        if (request.Note?.Trim().Length > 1000)
            throw new ContactRequestValidationException("Note must be 1000 characters or fewer.");
        if (request.Status == ContactRequestStatus.Rejected && string.IsNullOrWhiteSpace(request.Note))
            throw new ContactRequestValidationException("A rejection note is required.");

        var item = await repository.FindAsync(id, ct) ?? throw new ContactRequestNotFoundException("Contact request was not found.");
        if (item.Status == request.Status)
            throw new ContactRequestConflictException("The request already has this status.");
        if (!CanTransition(item.Status, request.Status))
            throw new ContactRequestConflictException($"Cannot change status from {item.Status} to {request.Status}.");

        var previous = item.Status;
        var now = clock.GetUtcNow();
        var note = CleanOptional(request.Note);
        item.Status = request.Status;
        item.ResolutionNote = note;
        item.ResolvedBy = request.Status is ContactRequestStatus.Resolved or ContactRequestStatus.Rejected ? actorId : null;
        item.ResolvedAt = request.Status is ContactRequestStatus.Resolved or ContactRequestStatus.Rejected ? now : null;
        item.UpdatedBy = actorId;
        item.UpdatedAt = now;

        repository.AddStatusHistory(new ContactRequestStatusHistory
        {
            ContactRequestId = item.Id,
            FromStatus = previous,
            ToStatus = request.Status,
            Note = note,
            ChangedBy = actorId,
            CreatedBy = actorId,
            CreatedAt = now
        });
        repository.AddAudit(actorId, "ContactRequest.StatusChanged", nameof(ContactRequest), item.Id,
            JsonSerializer.Serialize(new { Status = previous }), JsonSerializer.Serialize(new { Status = item.Status, Note = note }), ipAddress);
        await repository.SaveChangesAsync(ct);
        return MapDetail(item);
    }

    private static bool CanTransition(ContactRequestStatus from, ContactRequestStatus to) => from switch
    {
        ContactRequestStatus.New => to is ContactRequestStatus.InProgress or ContactRequestStatus.Resolved or ContactRequestStatus.Rejected,
        ContactRequestStatus.InProgress => to is ContactRequestStatus.Resolved or ContactRequestStatus.Rejected,
        _ => false
    };

    private static void ValidateCreate(CreateContactRequestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName) || request.FullName.Trim().Length > 160)
            throw new ContactRequestValidationException("Full name is required and must be 160 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Trim().Length > 256 || !IsValidEmail(request.Email))
            throw new ContactRequestValidationException("A valid email address is required.");
        if (string.IsNullOrWhiteSpace(request.PhoneNumber) || !PhonePattern().IsMatch(request.PhoneNumber.Trim()))
            throw new ContactRequestValidationException("A valid phone number from 8 to 15 digits is required.");
        if (request.CompanyName?.Trim().Length > 160)
            throw new ContactRequestValidationException("Company name must be 160 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Subject) || request.Subject.Trim().Length > 180)
            throw new ContactRequestValidationException("Subject is required and must be 180 characters or fewer.");
        if (string.IsNullOrWhiteSpace(request.Message) || request.Message.Trim().Length > 4000)
            throw new ContactRequestValidationException("Message is required and must be 4000 characters or fewer.");
    }

    private static void ValidateQuery(ContactRequestQuery query)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new ContactRequestValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");
        if (query.Search?.Trim().Length > 256)
            throw new ContactRequestValidationException("Search must be 256 characters or fewer.");
        if (query.Status is not null && !Enum.IsDefined(query.Status.Value))
            throw new ContactRequestValidationException("Contact request status is not supported.");
        if (query.CreatedFrom is not null && query.CreatedTo is not null && query.CreatedTo < query.CreatedFrom)
            throw new ContactRequestValidationException("CreatedTo must be on or after CreatedFrom.");
        ListSortQuery.ValidateAndNormalize(query.SortBy, query.SortDirection,
            new HashSet<string>(StringComparer.OrdinalIgnoreCase) { "fullName", "subject", "status", "createdAt" },
            message => new ContactRequestValidationException(message));
    }

    private static bool IsValidEmail(string value)
    {
        try { return new MailAddress(value.Trim()).Address == value.Trim(); }
        catch { return false; }
    }

    private static string NormalizePhone(string value) => Regex.Replace(value.Trim(), "[\\s().-]", "");
    private static string? CleanOptional(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    [GeneratedRegex(@"^\+?(?:[\d][\s().-]*){8,15}$")]
    private static partial Regex PhonePattern();

    private static ContactRequestListItemDto MapList(ContactRequest x) => new(x.Id, x.FullName, x.Email, x.PhoneNumber, x.CompanyName, x.Subject, x.Status, x.CreatedAt);

    private static ContactRequestDetailDto MapDetail(ContactRequest x) => new(
        x.Id, x.FullName, x.Email, x.PhoneNumber, x.CompanyName, x.Subject, x.Message, x.Status,
        x.ResolutionNote, x.ResolvedBy, x.ResolvedAt, x.CreatedAt, x.UpdatedAt,
        x.StatusHistory.OrderBy(item => item.CreatedAt).Select(item => new ContactRequestStatusHistoryDto(item.Id, item.FromStatus, item.ToStatus, item.Note, item.ChangedBy, item.CreatedAt)).ToArray());
}
