namespace CloudServiceStore.Application.EditorWorkspace;

public interface IEditorWorkspaceRepository
{
    Task<EditorWorkspaceSummaryDto> GetSummaryAsync(DateTimeOffset now, CancellationToken ct);
    Task<(IReadOnlyList<EditorWorkspaceQueueItemDto> Items, int Total)> GetQueueAsync(EditorWorkspaceQuery query, CancellationToken ct);
    Task<IReadOnlyList<EditorWorkspaceDraftArticleDto>> GetRecentDraftsAsync(int count, CancellationToken ct);
}

public sealed class EditorWorkspaceValidationException(string message) : Exception(message);
