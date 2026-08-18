using CloudServiceStore.Infrastructure;
using CloudServiceStore.Infrastructure.Authentication;
using CloudServiceStore.Infrastructure.Persistence;
using CloudServiceStore.WebApi.Security;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var visualQaData = builder.Configuration.GetValue<bool>("Seed:VisualQaData");
VisualQaSeedGuard.Validate(visualQaData, builder.Environment.EnvironmentName);
var connectionString = builder.Configuration.GetConnectionString("CloudServiceStore")
    ?? throw new InvalidOperationException("ConnectionStrings:CloudServiceStore is required.");

var jwtOptions = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? throw new InvalidOperationException("Jwt configuration is required.");
if (string.IsNullOrWhiteSpace(jwtOptions.SigningKey) || jwtOptions.SigningKey.Length < 32)
    throw new InvalidOperationException("Jwt:SigningKey must contain at least 32 characters.");

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddInfrastructure(builder.Configuration);
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:3000"];
builder.Services.AddCors(options => options.AddPolicy("Frontend", policy => policy
    .WithOrigins(allowedOrigins)
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));
builder.Services.AddApiRateLimiting(builder.Configuration);
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtOptions.Issuer,
        ValidateAudience = true,
        ValidAudience = jwtOptions.Audience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey)),
        ValidateLifetime = true,
        ClockSkew = TimeSpan.FromSeconds(30)
    });
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManageUsers", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ViewAuditLogs", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManageCatalog", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagePricing", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManagePromotions", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManageQrCodes", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManageLandingContent", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ManageNews", policy => policy.RequireRole("Admin", "Editor"));
    options.AddPolicy("ManageOrders", policy => policy.RequireRole("Admin", "Editor"));
    options.AddPolicy("ManageContactRequests", policy => policy.RequireRole("Admin", "Editor"));
    options.AddPolicy("ManageAffiliates", policy => policy.RequireRole("Admin", "Editor"));
    options.AddPolicy("ManageAffiliateProgram", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ViewDashboard", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ExportOrders", policy => policy.RequireRole("Admin"));
    options.AddPolicy("ViewEditorWorkspace", policy => policy.RequireRole("Admin", "Editor"));
});

var app = builder.Build();

if (app.Environment.IsDevelopment()) app.MapOpenApi();

var databaseStartupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("DatabaseStartup");
await DatabaseStartup.ExecuteWithRetryAsync(
    async () =>
    {
        await using var scope = app.Services.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<CloudServiceStoreDbContext>();
        await dbContext.SeedAsync(builder.Configuration["Seed:AdminPassword"], visualQaData);
    },
    onRetry: (exception, attempt, delay) => databaseStartupLogger.LogWarning(
        exception,
        "Database initialization attempt {Attempt} failed. Retrying in {DelaySeconds} seconds.",
        attempt,
        delay.TotalSeconds),
    cancellationToken: app.Lifetime.ApplicationStopping);

// CORS must run before HTTPS redirection so browser preflight requests receive
// the allow headers instead of being redirected without them.
app.UseCors("Frontend");
if (!app.Environment.IsEnvironment("Testing")) app.UseHttpsRedirection();
app.UseRateLimiter();
app.UseRefreshCookieOriginProtection(allowedOrigins);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHealthChecks("/health");
app.Run();

public partial class Program;
