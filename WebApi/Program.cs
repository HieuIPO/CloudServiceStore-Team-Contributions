using Application.Catalog.Abstractions;
using Application.Catalog.Services;
using Application.Common.Interfaces;
using Application.Promotions.Abstractions;
using Application.Promotions.Services;
using Infrastructure.Persistence;
using Infrastructure.Repositories;
using Infrastructure.Repositories.Catalog;
using Infrastructure.Repositories.Promotions;
using Infrastructure.Services;
using Microsoft.EntityFrameworkCore;
using WebApi.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddHttpContextAccessor();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuditLogRepository, AuditLogRepository>();
builder.Services.AddScoped<IServiceCategoryRepository, ServiceCategoryRepository>();
builder.Services.AddScoped<IServicePlanRepository, ServicePlanRepository>();
builder.Services.AddScoped<IPlanPriceRepository, PlanPriceRepository>();
builder.Services.AddScoped<IServiceCategoryService, ServiceCategoryService>();
builder.Services.AddScoped<IServicePlanService, ServicePlanService>();
builder.Services.AddScoped<IPromotionRepository, PromotionRepository>();
builder.Services.AddScoped<IPromotionService, PromotionService>();
builder.Services.AddScoped<IQrCodeGenerator, QrCodeGenerator>();

// Policies
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("ManageCatalog", policy => policy.RequireAuthenticatedUser());
    options.AddPolicy("ManagePricing", policy => policy.RequireAuthenticatedUser());
    options.AddPolicy("ManagePromotions", policy => policy.RequireAuthenticatedUser());
    options.AddPolicy("ManageQrCodes", policy => policy.RequireAuthenticatedUser());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowFrontend");

app.UseAuthorization();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    // Apply pending migrations automatically
    context.Database.Migrate();
    await DataSeeder.SeedAsync(context);
}

app.MapControllers();
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();

public partial class Program { }