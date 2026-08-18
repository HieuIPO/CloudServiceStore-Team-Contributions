using System.Globalization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace CloudServiceStore.WebApi.Security;

public static class AuthSecurityExtensions
{
    public static IServiceCollection AddApiRateLimiting(this IServiceCollection services, IConfiguration configuration)
    {
        var window = TimeSpan.FromSeconds(Math.Max(1, configuration.GetValue("RateLimiting:WindowSeconds", 60)));
        var limits = new Dictionary<string, int>(StringComparer.Ordinal)
        {
            ["login"] = Math.Max(1, configuration.GetValue("RateLimiting:LoginPermitLimit", 5)),
            ["register"] = Math.Max(1, configuration.GetValue("RateLimiting:RegisterPermitLimit", 5)),
            ["refresh"] = Math.Max(1, configuration.GetValue("RateLimiting:RefreshPermitLimit", 20)),
            ["orders"] = Math.Max(1, configuration.GetValue("RateLimiting:OrderPermitLimit", 10)),
            ["affiliates"] = Math.Max(1, configuration.GetValue("RateLimiting:AffiliatePermitLimit", 5)),
            ["contacts"] = Math.Max(1, configuration.GetValue("RateLimiting:ContactPermitLimit", 5))
        };
        services.AddRateLimiter(options =>
        {
            options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            {
                var scope = GetRateLimitScope(context.Request.Path, context.Request.Method);
                if (scope is null) return RateLimitPartition.GetNoLimiter("unlimited");
                var client = context.Connection.RemoteIpAddress?.ToString() ?? "unknown";
                return RateLimitPartition.GetFixedWindowLimiter($"{scope}:{client}", _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limits[scope], Window = window, QueueLimit = 0, AutoReplenishment = true
                });
            });
            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
            options.OnRejected = async (context, cancellationToken) =>
            {
                if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
                    context.HttpContext.Response.Headers.RetryAfter = Math.Ceiling(retryAfter.TotalSeconds).ToString(CultureInfo.InvariantCulture);
                await context.HttpContext.Response.WriteAsJsonAsync(new ProblemDetails
                {
                    Status = StatusCodes.Status429TooManyRequests,
                    Title = "Too many requests",
                    Detail = "The request limit for this endpoint has been exceeded. Try again later."
                }, cancellationToken);
            };
        });
        return services;
    }

    public static IApplicationBuilder UseRefreshCookieOriginProtection(this IApplicationBuilder app, IEnumerable<string> configuredOrigins)
    {
        var allowedOrigins = configuredOrigins.Select(NormalizeOrigin).Where(origin => origin is not null).ToHashSet(StringComparer.OrdinalIgnoreCase);
        return app.Use(async (context, next) =>
        {
            if (!RequiresTrustedOrigin(context.Request)) { await next(); return; }
            var suppliedOrigin = NormalizeOrigin(context.Request.Headers.Origin.ToString());
            if (suppliedOrigin is not null && allowedOrigins.Contains(suppliedOrigin)) { await next(); return; }
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            context.Response.Headers.Vary = "Origin";
            await context.Response.WriteAsJsonAsync(new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Untrusted request origin",
                Detail = "Refresh-cookie operations require an Origin header allowed by the API CORS configuration."
            });
        });
    }

    private static string? GetRateLimitScope(PathString path, string method)
    {
        if (path.Equals("/api/v1/auth/login", StringComparison.OrdinalIgnoreCase)) return "login";
        if (path.Equals("/api/v1/auth/register", StringComparison.OrdinalIgnoreCase)) return "register";
        if (path.Equals("/api/v1/auth/refresh", StringComparison.OrdinalIgnoreCase)) return "refresh";
        if (HttpMethods.IsPost(method) && path.Equals("/api/v1/orders", StringComparison.OrdinalIgnoreCase)) return "orders";
        if (HttpMethods.IsPost(method) && path.Equals("/api/v1/affiliate-applications", StringComparison.OrdinalIgnoreCase)) return "affiliates";
        if (HttpMethods.IsPost(method) && path.Equals("/api/v1/contact-requests", StringComparison.OrdinalIgnoreCase)) return "contacts";
        return null;
    }

    private static bool RequiresTrustedOrigin(HttpRequest request) => HttpMethods.IsPost(request.Method)
        && (request.Path.Equals("/api/v1/auth/refresh", StringComparison.OrdinalIgnoreCase)
            || request.Path.Equals("/api/v1/auth/logout", StringComparison.OrdinalIgnoreCase));

    private static string? NormalizeOrigin(string? origin)
    {
        if (string.IsNullOrWhiteSpace(origin) || !Uri.TryCreate(origin.Trim(), UriKind.Absolute, out var uri)
            || (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps)
            || !string.Equals(uri.AbsolutePath, "/", StringComparison.Ordinal)
            || !string.IsNullOrEmpty(uri.Query) || !string.IsNullOrEmpty(uri.Fragment) || !string.IsNullOrEmpty(uri.UserInfo)) return null;
        return uri.GetLeftPart(UriPartial.Authority);
    }
}
