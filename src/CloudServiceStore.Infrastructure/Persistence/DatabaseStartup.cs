namespace CloudServiceStore.Infrastructure.Persistence;

public static class DatabaseStartup
{
    private static readonly TimeSpan MaximumRetryDelay = TimeSpan.FromSeconds(10);

    public static async Task ExecuteWithRetryAsync(
        Func<Task> operation,
        Action<Exception, int, TimeSpan>? onRetry = null,
        int maxAttempts = 5,
        TimeSpan? initialDelay = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(operation);
        if (maxAttempts < 1) throw new ArgumentOutOfRangeException(nameof(maxAttempts));

        var delay = initialDelay ?? TimeSpan.FromSeconds(2);

        for (var attempt = 1; ; attempt++)
        {
            try
            {
                await operation();
                return;
            }
            catch (Exception exception) when (attempt < maxAttempts && exception is not OperationCanceledException)
            {
                onRetry?.Invoke(exception, attempt, delay);
                await Task.Delay(delay, cancellationToken);
                delay = TimeSpan.FromMilliseconds(Math.Min(
                    delay.TotalMilliseconds * 2,
                    MaximumRetryDelay.TotalMilliseconds));
            }
        }
    }
}
