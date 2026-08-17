using CloudServiceStore.Application.Common;

namespace CloudServiceStore.Application.EditorWorkspace;

public sealed class EditorWorkspaceService(
    IEditorWorkspaceRepository repository,
    TimeProvider? timeProvider = null) : IEditorWorkspaceService
{
    private readonly TimeProvider clock = timeProvider ?? TimeProvider.System;

    public async Task<EditorWorkspaceDto> GetWorkspaceDataAsync(EditorWorkspaceQuery query, CancellationToken ct)
    {
        if (query.Page < 1 || query.PageSize is < 1 or > 100)
            throw new EditorWorkspaceValidationException("Page must be at least 1 and PageSize must be from 1 to 100.");

        var validTypes = new[] { "all", "order", "affiliate" };
        if (!validTypes.Contains(query.NormalizedType))
            throw new EditorWorkspaceValidationException("Type must be all, order, or affiliate.");

        var validStatuses = new[] { "all", "new", "inProgress", "completed", "rejected", "cancelled" };
        if (!validStatuses.Contains(query.NormalizedStatus))
            throw new EditorWorkspaceValidationException("Status must be all, new, inProgress, completed, rejected, or cancelled.");

        var validSorts = new[] { "newest", "oldest" };
        if (!validSorts.Contains(query.NormalizedSort))
            throw new EditorWorkspaceValidationException("Sort must be newest or oldest.");

        if (query.Search?.Trim().Length > 256)
            throw new EditorWorkspaceValidationException("Search filter exceeds the supported length.");

        var now = clock.GetUtcNow();
        var summary = await repository.GetSummaryAsync(now, ct);
        var (items, total) = await repository.GetQueueAsync(query, ct);
        var queue = new PagedResult<EditorWorkspaceQueueItemDto>(items, query.Page, query.PageSize, total);
        var recentDrafts = await repository.GetRecentDraftsAsync(3, ct);

        return new EditorWorkspaceDto(summary, queue, recentDrafts);
    }
}
