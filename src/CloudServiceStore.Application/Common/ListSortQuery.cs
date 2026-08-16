namespace CloudServiceStore.Application.Common;

public static class ListSortQuery
{
    public static string? ValidateAndNormalize(
        string? sortBy,
        string? sortDirection,
        IReadOnlySet<string> allowedFields,
        Func<string, Exception> createValidationException)
    {
        var field = string.IsNullOrWhiteSpace(sortBy) ? null : sortBy.Trim().ToLowerInvariant();
        var direction = string.IsNullOrWhiteSpace(sortDirection) ? null : sortDirection.Trim().ToLowerInvariant();

        if (field is null)
        {
            if (direction is not null)
                throw createValidationException("SortDirection requires SortBy.");
            return null;
        }

        if (!allowedFields.Contains(field))
            throw createValidationException($"SortBy must be one of: {string.Join(", ", allowedFields.OrderBy(x => x))}.");
        if (direction is not null and not ("asc" or "desc"))
            throw createValidationException("SortDirection must be either 'asc' or 'desc'.");

        return field;
    }

    public static bool IsDescending(string? sortDirection) =>
        string.Equals(sortDirection?.Trim(), "desc", StringComparison.OrdinalIgnoreCase);
}
