using CloudServiceStore.Application.Common;
using CloudServiceStore.Application.EditorWorkspace;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class EditorWorkspaceServiceTests
{
    private readonly Mock<IEditorWorkspaceRepository> repositoryMock = new();
    private readonly EditorWorkspaceService service;

    public EditorWorkspaceServiceTests()
    {
        service = new EditorWorkspaceService(repositoryMock.Object);
    }

    [Fact]
    public async Task GetWorkspaceDataAsync_Throws_On_Invalid_Page()
    {
        var query = new EditorWorkspaceQuery(Page: 0);
        await Assert.ThrowsAsync<EditorWorkspaceValidationException>(() => service.GetWorkspaceDataAsync(query, CancellationToken.None));
    }

    [Fact]
    public async Task GetWorkspaceDataAsync_Throws_On_Invalid_Type()
    {
        var query = new EditorWorkspaceQuery(Type: "invalid");
        await Assert.ThrowsAsync<EditorWorkspaceValidationException>(() => service.GetWorkspaceDataAsync(query, CancellationToken.None));
    }

    [Fact]
    public async Task GetWorkspaceDataAsync_Returns_Expected_Data()
    {
        var query = new EditorWorkspaceQuery();
        var expectedSummary = new EditorWorkspaceSummaryDto(1, 1, 2, 0, 3, 3, 4, 4);
        var expectedQueue = new List<EditorWorkspaceQueueItemDto>
        {
            new(Guid.NewGuid(), "order", "John Doe", "john@example.com", "123456789", null, "Standard Plan", "Pending", "new", DateTimeOffset.UtcNow, null, DateTimeOffset.UtcNow)
        };
        var expectedDrafts = new List<EditorWorkspaceDraftArticleDto>
        {
            new(Guid.NewGuid(), "Draft Article", "News", DateTimeOffset.UtcNow)
        };

        repositoryMock.Setup(r => r.GetSummaryAsync(It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedSummary);

        repositoryMock.Setup(r => r.GetQueueAsync(query, It.IsAny<CancellationToken>()))
            .ReturnsAsync((expectedQueue, 1));

        repositoryMock.Setup(r => r.GetRecentDraftsAsync(3, It.IsAny<CancellationToken>()))
            .ReturnsAsync(expectedDrafts);

        var result = await service.GetWorkspaceDataAsync(query, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal(1, result.Summary.NewOrders);
        Assert.Single(result.Queue.Items);
        Assert.Single(result.RecentDrafts);
    }
}
