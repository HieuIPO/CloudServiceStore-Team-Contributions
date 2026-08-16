namespace Application.Catalog.Contracts;

public class CreateServiceCategoryRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
}

public class UpdateServiceCategoryRequest
{
    public required string Name { get; set; }
    public string? Description { get; set; }
}

public class ServiceCategoryQuery
{
    public string? SearchTerm { get; set; }
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
}

public class ServiceCategoryListItemDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class ServiceCategoryDetailDto
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
