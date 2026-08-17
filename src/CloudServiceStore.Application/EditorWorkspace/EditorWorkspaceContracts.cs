using CloudServiceStore.Application.Common;

namespace CloudServiceStore.Application.EditorWorkspace;

public sealed record EditorWorkspaceQuery(
    int Page = 1,
    int PageSize = 20,
    string Type = "all",
    string Status = "all",
    string? Search = null,
    string Sort = "newest")
{
    public int SafePage => Page < 1 ? 1 : Page;
    public int SafePageSize => PageSize is < 1 or > 100 ? 20 : PageSize;

    public string NormalizedType => (Type ?? "all").Trim().ToLowerInvariant() switch
    {
        "order" => "order",
        "affiliate" => "affiliate",
        "all" => "all",
        _ => (Type ?? "all").Trim().ToLowerInvariant()
    };

    public string NormalizedStatus => (Status ?? "all").Trim().ToLowerInvariant() switch
    {
        "new" => "new",
        "inprogress" => "inProgress",
        "completed" => "completed",
        "rejected" => "rejected",
        "cancelled" => "cancelled",
        "all" => "all",
        _ => (Status ?? "all").Trim().ToLowerInvariant()
    };

    public string NormalizedSort => (Sort ?? "newest").Trim().ToLowerInvariant() switch
    {
        "oldest" => "oldest",
        "newest" => "newest",
        _ => (Sort ?? "newest").Trim().ToLowerInvariant()
    };

    public string? NormalizedSearch => string.IsNullOrWhiteSpace(Search)
        ? null
        : (Search.Trim().Length > 256 ? Search.Trim()[..256] : Search.Trim());
}

public sealed record EditorWorkspaceSummaryDto(
    int NewOrders,
    int NewOrdersLast24Hours,
    int InProgressOrders,
    int OverdueActiveOrders,
    int PendingAffiliates,
    int NewAffiliatesLast24Hours,
    int DraftArticles,
    int DraftsUpdatedLast24Hours);

public sealed record EditorWorkspaceQueueItemDto(
    Guid Id,
    string Type,
    string CustomerName,
    string Email,
    string PhoneNumber,
    string? CompanyName,
    string Subject,
    string SourceStatus,
    string StatusGroup,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt,
    DateTimeOffset LastActivityAt);

public sealed record EditorWorkspaceDraftArticleDto(
    Guid Id,
    string Title,
    string CategoryName,
    DateTimeOffset UpdatedAt);

public sealed record EditorWorkspaceDto(
    EditorWorkspaceSummaryDto Summary,
    PagedResult<EditorWorkspaceQueueItemDto> Queue,
    IReadOnlyList<EditorWorkspaceDraftArticleDto> RecentDrafts);

public interface IEditorWorkspaceService
{
    Task<EditorWorkspaceDto> GetWorkspaceDataAsync(EditorWorkspaceQuery query, CancellationToken ct);
}
