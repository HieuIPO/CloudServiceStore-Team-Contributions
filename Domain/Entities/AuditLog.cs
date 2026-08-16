using Domain.Common;

namespace Domain.Entities;

public class AuditLog : BaseEntity
{
    public required string EntityName { get; set; }
    public required string Action { get; set; }
    public string? BeforeSnapshot { get; set; }
    public string? AfterSnapshot { get; set; }
    public required string Actor { get; set; }
}
