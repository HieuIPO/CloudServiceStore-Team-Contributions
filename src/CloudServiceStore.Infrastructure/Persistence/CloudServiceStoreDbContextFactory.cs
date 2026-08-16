using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace CloudServiceStore.Infrastructure.Persistence;

public sealed class CloudServiceStoreDbContextFactory : IDesignTimeDbContextFactory<CloudServiceStoreDbContext>
{
    public CloudServiceStoreDbContext CreateDbContext(string[] args)
    {
        const string fallbackConnectionString = "Server=localhost,1433;Database=CloudServiceStore;User Id=sa;Password=DesignTimeOnly123!;TrustServerCertificate=True;";
        var connectionString = Environment.GetEnvironmentVariable("ConnectionStrings__CloudServiceStore") ?? fallbackConnectionString;
        var options = new DbContextOptionsBuilder<CloudServiceStoreDbContext>()
            .UseSqlServer(connectionString)
            .Options;
        return new CloudServiceStoreDbContext(options);
    }
}
