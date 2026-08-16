namespace CloudServiceStore.Infrastructure.Persistence;

public static class VisualQaSeedGuard
{
    public static void Validate(bool enabled, string environmentName)
    {
        if (!enabled) return;

        var allowed = environmentName.Equals("Development", StringComparison.OrdinalIgnoreCase)
            || environmentName.Equals("Testing", StringComparison.OrdinalIgnoreCase);

        if (!allowed)
        {
            throw new InvalidOperationException(
                "Seed:VisualQaData=true is only allowed when ASPNETCORE_ENVIRONMENT is Development or Testing.");
        }
    }
}
