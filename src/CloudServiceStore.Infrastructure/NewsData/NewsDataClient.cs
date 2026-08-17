using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using CloudServiceStore.Application.News;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Infrastructure.NewsData;

public sealed class NewsDataClient(HttpClient httpClient, IOptions<NewsDataOptions> options) : INewsDataClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<IReadOnlyList<NewsDataArticle>> GetLatestAsync(int limit, CancellationToken cancellationToken)
    {
        if (limit is < 1 or > 10) throw new NewsValidationException("NewsData limit must be from 1 to 10.");

        var settings = options.Value;
        if (string.IsNullOrWhiteSpace(settings.ApiKey))
            throw new NewsExternalServiceException("NewsData integration is not configured.");

        var categories = settings.Categories
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(5)
            .ToArray();
        if (categories.Length == 0)
            throw new NewsExternalServiceException("NewsData categories are not configured.");

        var articles = new List<NewsDataArticle>();
        foreach (var category in categories)
        {
            var query = $"latest?apikey={Uri.EscapeDataString(settings.ApiKey.Trim())}" +
                        $"&country={Uri.EscapeDataString(settings.Country)}" +
                        $"&language={Uri.EscapeDataString(settings.Language)}" +
                        $"&category={Uri.EscapeDataString(category)}" +
                        $"&size={limit}";

            NewsDataResponse? response;
            try
            {
                using var httpResponse = await httpClient.GetAsync(query, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
                if (!httpResponse.IsSuccessStatusCode)
                    throw new NewsExternalServiceException("NewsData request failed.");

                response = await httpResponse.Content.ReadFromJsonAsync<NewsDataResponse>(JsonOptions, cancellationToken);
            }
            catch (NewsExternalServiceException)
            {
                throw;
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested)
            {
                throw new NewsExternalServiceException("NewsData request timed out.", ex);
            }
            catch (HttpRequestException ex)
            {
                throw new NewsExternalServiceException("NewsData request failed.", ex);
            }
            catch (JsonException ex)
            {
                throw new NewsExternalServiceException("NewsData returned an invalid response.", ex);
            }

            if (response is null || !string.Equals(response.Status, "success", StringComparison.OrdinalIgnoreCase))
                throw new NewsExternalServiceException("NewsData returned an unsuccessful response.");

            articles.AddRange((response.Results ?? Array.Empty<NewsDataResponseItem>()).Take(limit).Select(item => Map(item, category)));
        }

        return articles;
    }

    private static NewsDataArticle Map(NewsDataResponseItem item, string category) =>
        new(
            item.ArticleId ?? item.Link ?? string.Empty,
            item.Title ?? string.Empty,
            item.Description,
            item.Link ?? string.Empty,
            item.ImageUrl,
            item.SourceId ?? item.SourceUrl,
            ParsePublishedAt(item.PublishedAt),
            category);

    private static DateTimeOffset? ParsePublishedAt(string? value) =>
        DateTimeOffset.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.AllowWhiteSpaces | DateTimeStyles.AssumeUniversal, out var parsed)
            ? parsed
            : null;

    private sealed class NewsDataResponse
    {
        [JsonPropertyName("status")]
        public string? Status { get; init; }

        [JsonPropertyName("results")]
        public NewsDataResponseItem[]? Results { get; init; }
    }

    private sealed class NewsDataResponseItem
    {
        [JsonPropertyName("article_id")]
        public string? ArticleId { get; init; }

        [JsonPropertyName("title")]
        public string? Title { get; init; }

        [JsonPropertyName("description")]
        public string? Description { get; init; }

        [JsonPropertyName("link")]
        public string? Link { get; init; }

        [JsonPropertyName("image_url")]
        public string? ImageUrl { get; init; }

        [JsonPropertyName("source_id")]
        public string? SourceId { get; init; }

        [JsonPropertyName("source_url")]
        public string? SourceUrl { get; init; }

        [JsonPropertyName("pubDate")]
        public string? PublishedAt { get; init; }
    }
}
