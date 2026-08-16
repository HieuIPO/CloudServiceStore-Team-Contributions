namespace CloudServiceStore.Infrastructure.NewsData;

public sealed class NewsDataOptions
{
    public const string SectionName = "NewsData";
    public string ApiKey { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://newsdata.io/api/1";
    public string Country { get; set; } = "vi";
    public string Language { get; set; } = "vi";
    public string Categories { get; set; } = "technology,business,science,health,environment";
}
