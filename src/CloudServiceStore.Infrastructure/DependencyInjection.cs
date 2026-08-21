using CloudServiceStore.Application.Auth;
using CloudServiceStore.Application.Auth.Abstractions;
using CloudServiceStore.Application.Catalog;
using CloudServiceStore.Application.Promotions;
using CloudServiceStore.Application.News;
using CloudServiceStore.Application.Landing;
using CloudServiceStore.Application.Orders;
using CloudServiceStore.Application.Affiliates;
using CloudServiceStore.Application.ContactRequests;
using CloudServiceStore.Application.Reporting;
using CloudServiceStore.Application.EditorWorkspace;
using CloudServiceStore.Infrastructure.Authentication;
using CloudServiceStore.Infrastructure.NewsData;
using CloudServiceStore.Infrastructure.Persistence;
using CloudServiceStore.Infrastructure.Reporting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("CloudServiceStore")
            ?? throw new InvalidOperationException("ConnectionStrings:CloudServiceStore is required.");
        services.AddDbContext<CloudServiceStoreDbContext>(options => options.UseSqlServer(connectionString));
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IPasswordService, PasswordService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICatalogRepository, CatalogRepository>();
        services.AddScoped<ICatalogService, CatalogService>();
        services.AddScoped<IPromotionRepository, PromotionRepository>();
        services.AddScoped<IPromotionService, PromotionService>();
        services.AddSingleton<PercentageDiscountStrategy>();
        services.AddSingleton<FixedAmountDiscountStrategy>();
        services.AddSingleton<IDiscountStrategyFactory, DiscountStrategyFactory>();
        services.AddSingleton<IQrCodeService, QrCodeService>();
        services.AddScoped<INewsRepository, NewsRepository>();
        services.AddScoped<INewsService, NewsService>();
        services.Configure<NewsDataOptions>(configuration.GetSection(NewsDataOptions.SectionName));
        services.AddHttpClient<INewsDataClient, NewsDataClient>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IOptions<NewsDataOptions>>().Value;
            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/", UriKind.Absolute);
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        services.AddScoped<INewsDataSyncService, NewsDataSyncService>();
        services.AddScoped<ILandingContentRepository, LandingContentRepository>();
        services.AddScoped<ILandingContentService, LandingContentService>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IAffiliateRepository, AffiliateRepository>();
        services.AddScoped<IAffiliateService, AffiliateService>();
        services.AddScoped<IContactRequestRepository, ContactRequestRepository>();
        services.AddScoped<IContactRequestService, ContactRequestService>();
        services.AddScoped<IReportingRepository, ReportingRepository>();
        services.AddScoped<IReportingService, ReportingService>();
        services.AddScoped<IEditorWorkspaceRepository, EditorWorkspaceRepository>();
        services.AddScoped<IEditorWorkspaceService, EditorWorkspaceService>();
        services.AddSingleton<IExcelExportService, ClosedXmlExcelExportService>();
        return services;
    }
}
