using Domain.Entities.Catalog;
using Domain.Entities.Promotions;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(ApplicationDbContext context)
    {
        // Add Category if none exists
        if (!await context.ServiceCategories.AnyAsync())
        {
            var category = new ServiceCategory
            {
                Id = Guid.NewGuid(),
                Name = "Cloud Hosting",
                Description = "High performance cloud hosting services"
            };
            await context.ServiceCategories.AddAsync(category);
            await context.SaveChangesAsync();

            var plan = new ServicePlan
            {
                Id = Guid.NewGuid(),
                Name = "Basic Hosting",
                Description = "Perfect for small personal websites",
                ServiceCategoryId = category.Id,
                IsActive = true
            };
            await context.ServicePlans.AddAsync(plan);
            await context.SaveChangesAsync();

            var price = new PlanPrice
            {
                Id = Guid.NewGuid(),
                ServicePlanId = plan.Id,
                Price = 9.99m,
                Currency = "USD",
                BillingCycle = BillingCycle.Monthly,
                EffectiveFrom = DateTime.UtcNow.AddDays(-1)
            };
            await context.PlanPrices.AddAsync(price);
            await context.SaveChangesAsync();
        }

        // Add Promotion if none exists
        if (!await context.Promotions.AnyAsync())
        {
            var promotion = new Promotion
            {
                Id = Guid.NewGuid(),
                Code = "WELCOME2026",
                Name = "Welcome Bonus",
                Description = "Get 50% off your first month",
                DiscountType = DiscountType.Percentage,
                DiscountValue = 50,
                EffectiveFrom = DateTime.UtcNow.AddDays(-1),
                IsActive = true
            };
            await context.Promotions.AddAsync(promotion);
            await context.SaveChangesAsync();
        }
    }
}
