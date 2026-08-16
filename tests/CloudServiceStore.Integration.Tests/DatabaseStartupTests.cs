using CloudServiceStore.Infrastructure.Persistence;

namespace CloudServiceStore.Integration.Tests;

public sealed class DatabaseStartupTests
{
    [Fact]
    public async Task ExecuteWithRetryAsync_retries_database_initialization_until_it_succeeds()
    {
        var attempts = 0;

        await DatabaseStartup.ExecuteWithRetryAsync(
            () =>
            {
                attempts++;
                if (attempts < 3) throw new InvalidOperationException("Database is still starting.");
                return Task.CompletedTask;
            },
            maxAttempts: 3,
            initialDelay: TimeSpan.Zero);

        Assert.Equal(3, attempts);
    }
}
