using CloudServiceStore.Application.Common;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Application.ContactRequests;

public sealed record CreateContactRequestRequest(
    string FullName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string Subject,
    string Message);

public sealed record ContactRequestConfirmationDto(Guid Id, ContactRequestStatus Status, DateTimeOffset CreatedAt);
public sealed record ContactRequestListItemDto(Guid Id, string FullName, string Email, string PhoneNumber, string? CompanyName, string Subject, ContactRequestStatus Status, DateTimeOffset CreatedAt);
public sealed record ContactRequestStatusHistoryDto(Guid Id, ContactRequestStatus FromStatus, ContactRequestStatus ToStatus, string? Note, Guid? ChangedBy, DateTimeOffset CreatedAt);
public sealed record ContactRequestDetailDto(Guid Id, string FullName, string Email, string PhoneNumber, string? CompanyName, string Subject, string Message, ContactRequestStatus Status, string? ResolutionNote, Guid? ResolvedBy, DateTimeOffset CreatedAt, DateTimeOffset? UpdatedAt, IReadOnlyList<ContactRequestStatusHistoryDto> StatusHistory);

public sealed record ContactRequestQuery(
    int Page = 1,
    int PageSize = 20,
    string? Search = null,
    ContactRequestStatus? Status = null,
    DateTimeOffset? CreatedFrom = null,
    DateTimeOffset? CreatedTo = null,
    string? SortBy = "createdAt",
    string? SortDirection = "desc");

public sealed record UpdateContactRequestStatusRequest(ContactRequestStatus Status, string? Note);
