using System.Net;
using System.Text;
using CloudServiceStore.Application.News;
using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Domain.Enums;
using CloudServiceStore.Infrastructure;
using CloudServiceStore.Infrastructure.NewsData;
using CloudServiceStore.Infrastructure.Reporting;
using ClosedXML.Excel;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Integration.Tests;

public sealed class InfrastructureBoundaryTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(11)]
    public async Task NewsDataClient_rejects_limits_outside_provider_range(int limit)
    {
        using var client = CreateHttpClient(_ => throw new InvalidOperationException("HTTP must not be called."));
        var service = CreateNewsDataClient(client, new NewsDataOptions { ApiKey = "test-key" });

        await Assert.ThrowsAsync<NewsValidationException>(() => service.GetLatestAsync(limit, CancellationToken.None));
    }

    [Fact]
    public async Task NewsDataClient_rejects_missing_credentials_or_categories()
    {
        using var client = CreateHttpClient(_ => throw new InvalidOperationException("HTTP must not be called."));
        var missingKey = CreateNewsDataClient(client, new NewsDataOptions { Categories = "technology" });
        var missingCategories = CreateNewsDataClient(client, new NewsDataOptions { ApiKey = "test-key", Categories = " , " });

        await Assert.ThrowsAsync<NewsExternalServiceException>(() => missingKey.GetLatestAsync(1, CancellationToken.None));
        await Assert.ThrowsAsync<NewsExternalServiceException>(() => missingCategories.GetLatestAsync(1, CancellationToken.None));
    }

    [Fact]
    public async Task NewsDataClient_fetches_distinct_categories_and_maps_provider_fields()
    {
        var requests = new List<string>();
        using var client = CreateHttpClient(request =>
        {
            requests.Add(request.RequestUri!.Query);
            var category = request.RequestUri.Query.Contains("category=business", StringComparison.Ordinal)
                ? "business"
                : "technology";
            var json = $$"""
                {
                  "status": "success",
                  "results": [
                    {
                      "article_id": null,
                      "title": "{{category}} headline",
                      "description": "{{category}} description",
                      "link": "https://example.com/{{category}}",
                      "image_url": "https://example.com/{{category}}.jpg",
                      "source_id": null,
                      "source_url": "{{category}}.example.com",
                      "pubDate": "2026-08-15 10:00:00"
                    },
                    {
                      "article_id": "second",
                      "title": "second headline",
                      "link": "https://example.com/second"
                    }
                  ]
                }
                """;
            return JsonResponse(json);
        });
        var service = CreateNewsDataClient(client, new NewsDataOptions
        {
            ApiKey = " test-key ",
            Categories = "technology, technology, business",
            Country = "vn",
            Language = "vi"
        });

        var articles = await service.GetLatestAsync(1, CancellationToken.None);

        Assert.Equal(2, requests.Count);
        Assert.Equal(2, articles.Count);
        Assert.Contains(articles, article => article.CategorySlug == "technology" && article.ExternalId == "https://example.com/technology");
        Assert.Contains(articles, article => article.CategorySlug == "business" && article.SourceName == "business.example.com");
        Assert.All(articles, article => Assert.NotNull(article.PublishedAt));
        Assert.Contains(requests, query => query.Contains("apikey=test-key", StringComparison.Ordinal));
        Assert.All(requests, query => Assert.Contains("size=1", query, StringComparison.Ordinal));
    }

    [Theory]
    [InlineData(HttpStatusCode.BadGateway, "")]
    [InlineData(HttpStatusCode.OK, "{\"status\":\"error\",\"results\":[]}")]
    [InlineData(HttpStatusCode.OK, "not-json")]
    public async Task NewsDataClient_surfaces_provider_failures_without_silent_data(HttpStatusCode statusCode, string body)
    {
        using var client = CreateHttpClient(_ => JsonResponse(body, statusCode));
        var service = CreateNewsDataClient(client, new NewsDataOptions { ApiKey = "test-key", Categories = "technology" });

        await Assert.ThrowsAsync<NewsExternalServiceException>(() => service.GetLatestAsync(1, CancellationToken.None));
    }

    [Fact]
    public void QrCodeService_accepts_http_urls_and_rejects_non_http_content()
    {
        var service = new QrCodeService();

        var png = service.GeneratePng("https://cloud.example.com/services/starter");

        Assert.True(png.Length > 8);
        Assert.Equal(new byte[] { 137, 80, 78, 71 }, png[..4]);
        Assert.Throws<ArgumentException>(() => service.GeneratePng("ftp://cloud.example.com/service"));
        Assert.Throws<ArgumentException>(() => service.GeneratePng("/relative/path"));
    }

    [Fact]
    public void ExcelExportService_writes_headers_data_and_status_styles_for_supported_statuses()
    {
        var createdAt = new DateTimeOffset(2026, 8, 15, 10, 0, 0, TimeSpan.Zero);
        var statuses = new[]
        {
            OrderRequestStatus.Pending,
            OrderRequestStatus.Contacted,
            OrderRequestStatus.Approved,
            OrderRequestStatus.Rejected,
            OrderRequestStatus.Cancelled
        };
        var rows = statuses.Select((status, index) => new OrderExportRow(
            Guid.NewGuid(),
            createdAt.AddMinutes(index),
            $"Customer {index}",
            $"customer{index}@example.com",
            "0900000000",
            index == 0 ? null : "Cloud Co",
            "Starter VPS",
            index % 2 == 0 ? BillingCycle.Monthly : BillingCycle.Yearly,
            100_000,
            90_000,
            "VND",
            index == 0 ? null : "SAVE10",
            status,
            index == 0 ? null : "Note")).ToArray();

        var content = new ClosedXmlExcelExportService().CreateOrderWorkbook(rows);

        using var workbook = new XLWorkbook(new MemoryStream(content));
        var sheet = workbook.Worksheet("Order Requests");

        Assert.Equal("STT", sheet.Cell(4, 1).GetString());
        Assert.Equal(rows.Length, sheet.LastRowUsed()!.RowNumber() - 4);
        Assert.Equal("Customer 0", sheet.Cell(5, 4).GetString());
        Assert.Equal("Starter VPS", sheet.Cell(9, 8).GetString());
        Assert.False(string.IsNullOrWhiteSpace(sheet.Cell(5, 14).GetString()));
    }

    private static NewsDataClient CreateNewsDataClient(HttpClient client, NewsDataOptions options) =>
        new(client, Options.Create(options));

    private static HttpClient CreateHttpClient(Func<HttpRequestMessage, HttpResponseMessage> handler)
    {
        return new HttpClient(new StubHttpMessageHandler(handler))
        {
            BaseAddress = new Uri("https://newsdata.test/api/1/")
        };
    }

    private static HttpResponseMessage JsonResponse(string json, HttpStatusCode statusCode = HttpStatusCode.OK) =>
        new(statusCode)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class StubHttpMessageHandler(Func<HttpRequestMessage, HttpResponseMessage> handler) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(handler(request));
    }
}
