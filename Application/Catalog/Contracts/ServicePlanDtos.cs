using Domain.Enums;

namespace Application.Catalog.Contracts;

public class CreateServicePlanRequest
{
    public Guid ServiceCategoryId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateServicePlanRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class ServicePlanQuery
{
    public Guid? ServiceCategoryId { get; set; }
    public string? SearchTerm { get; set; }
    public bool? IsActive { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class ServicePlanListItemDto
{
    public Guid Id { get; set; }
    public Guid ServiceCategoryId { get; set; }
    public required string Name { get; set; }
    public bool IsActive { get; set; }
    public decimal? CurrentPrice { get; set; } // Derived field for convenience
}

public class ServicePlanDetailDto
{
    public Guid Id { get; set; }
    public Guid ServiceCategoryId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public List<PlanPriceDetailDto> Prices { get; set; } = new();
}

// PlanPrice DTOs
public class CreatePlanPriceRequest
{
    public Guid ServicePlanId { get; set; }
    public decimal Price { get; set; }
    public required string Currency { get; set; } = "VND";
    public BillingCycle BillingCycle { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class UpdatePlanPriceRequest
{
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public BillingCycle BillingCycle { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class PlanPriceQuery
{
    public Guid? ServicePlanId { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class PlanPriceListItemDto
{
    public Guid Id { get; set; }
    public Guid ServicePlanId { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public BillingCycle BillingCycle { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}

public class PlanPriceDetailDto
{
    public Guid Id { get; set; }
    public decimal Price { get; set; }
    public string Currency { get; set; } = "VND";
    public BillingCycle BillingCycle { get; set; }
    public DateTime EffectiveFrom { get; set; }
    public DateTime? EffectiveTo { get; set; }
}
