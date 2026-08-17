using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace CloudServiceStore.Integration.Tests;

public sealed class NewsApiTests(CloudServiceStoreApiFactory factory)
    : IClassFixture<CloudServiceStoreApiFactory>
{
    [Fact]
    public async Task Public_news_supports_category_filter_pagination_and_detail()
    {
        using var admin = CreateAuthenticatedClient("Admin");
        var categoryId = await CreateCategoryAsync(admin, $"API News {Guid.NewGuid():N}", $"api-news-{Guid.NewGuid():N}");
        var firstSlug = $"api-first-{Guid.NewGuid():N}";
        var secondSlug = $"api-second-{Guid.NewGuid():N}";
        await CreateAndPublishArticleAsync(admin, categoryId, "API First Article", firstSlug);
        await CreateAndPublishArticleAsync(admin, categoryId, "API Second Article", secondSlug);

        using var publicList = await factory.CreateClient().GetAsync(
            $"/api/v1/news-articles?page=1&pageSize=1&categoryId={categoryId}");
        using var listJson = JsonDocument.Parse(await publicList.Content.ReadAsStreamAsync());
        using var publicDetail = await factory.CreateClient().GetAsync($"/api/v1/news-articles/{firstSlug}");
        var detailJson = await publicDetail.Content.ReadFromJsonAsync<JsonElement>();

        Assert.Equal(HttpStatusCode.OK, publicList.StatusCode);
        Assert.Equal(1, listJson.RootElement.GetProperty("items").GetArrayLength());
        Assert.Equal(2, listJson.RootElement.GetProperty("totalCount").GetInt32());
        Assert.Equal(HttpStatusCode.OK, publicDetail.StatusCode);
        Assert.Equal(firstSlug, detailJson.GetProperty("slug").GetString());
        Assert.Contains("# Article content", detailJson.GetProperty("markdownContent").GetString());
    }

    [Fact]
    public async Task News_admin_endpoints_require_manage_news_and_allow_editor_read_access()
    {
        using var anonymous = factory.CreateClient();
        using var customer = CreateAuthenticatedClient("Customer");
        using var editor = CreateAuthenticatedClient("Editor");

        using var anonymousResponse = await anonymous.GetAsync("/api/v1/news-articles/admin?page=1&pageSize=5");
        using var customerResponse = await customer.GetAsync("/api/v1/news-articles/admin?page=1&pageSize=5");
        using var editorResponse = await editor.GetAsync("/api/v1/news-articles/admin?page=1&pageSize=5");

        Assert.Equal(HttpStatusCode.Unauthorized, anonymousResponse.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, customerResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, editorResponse.StatusCode);
    }

    [Fact]
    public async Task Admin_can_manage_article_lifecycle_through_controller_endpoints()
    {
        using var admin = CreateAuthenticatedClient("Admin");
        var categoryId = await CreateCategoryAsync(admin, "Lifecycle News", $"lifecycle-{Guid.NewGuid():N}");
        var slug = $"lifecycle-article-{Guid.NewGuid():N}";

        using var createResponse = await admin.PostAsJsonAsync("/api/v1/news-articles", new
        {
            categoryId,
            title = "Lifecycle Article",
            slug,
            excerpt = "Lifecycle excerpt",
            markdownContent = "# Article content",
            thumbnailUrl = (string?)null
        });
        var created = await createResponse.Content.ReadFromJsonAsync<JsonElement>();
        var articleId = created.GetProperty("id").GetGuid();

        using var updateResponse = await admin.PutAsJsonAsync($"/api/v1/news-articles/{articleId}", new
        {
            categoryId,
            title = "Updated Lifecycle Article",
            slug,
            excerpt = "Updated excerpt",
            markdownContent = "# Updated content",
            thumbnailUrl = (string?)null
        });
        using var publishResponse = await admin.PatchAsJsonAsync(
            $"/api/v1/news-articles/{articleId}/publish",
            new { publishedAt = DateTimeOffset.UtcNow });
        using var featuredResponse = await admin.PatchAsJsonAsync(
            $"/api/v1/news-articles/{articleId}/featured",
            new { isFeatured = false });
        using var unpublishRequest = new HttpRequestMessage(HttpMethod.Patch, $"/api/v1/news-articles/{articleId}/unpublish");
        using var unpublishResponse = await admin.SendAsync(unpublishRequest);
        using var deleteResponse = await admin.DeleteAsync($"/api/v1/news-articles/{articleId}");

        Assert.Equal(HttpStatusCode.OK, createResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, updateResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, publishResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, featuredResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, unpublishResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NoContent, deleteResponse.StatusCode);
    }

    private HttpClient CreateAuthenticatedClient(string role)
    {
        var client = factory.CreateClient();
        client.DefaultRequestHeaders.Add(TestAuthHandler.RoleHeader, role);
        return client;
    }

    private static async Task<Guid> CreateCategoryAsync(HttpClient admin, string name, string slug)
    {
        using var response = await admin.PostAsJsonAsync("/api/v1/news-categories", new
        {
            name,
            slug,
            description = "API test category",
            displayOrder = 1,
            isActive = true
        });
        var body = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        return body.GetProperty("id").GetGuid();
    }

    private static async Task CreateAndPublishArticleAsync(HttpClient admin, Guid categoryId, string title, string slug)
    {
        using var create = await admin.PostAsJsonAsync("/api/v1/news-articles", new
        {
            categoryId,
            title,
            slug,
            excerpt = "API test excerpt",
            markdownContent = "# Article content",
            thumbnailUrl = (string?)null
        });
        var created = await create.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(HttpStatusCode.OK, create.StatusCode);

        using var publish = await admin.PatchAsJsonAsync(
            $"/api/v1/news-articles/{created.GetProperty("id").GetGuid()}/publish",
            new { publishedAt = DateTimeOffset.UtcNow });
        Assert.Equal(HttpStatusCode.OK, publish.StatusCode);
    }
}
