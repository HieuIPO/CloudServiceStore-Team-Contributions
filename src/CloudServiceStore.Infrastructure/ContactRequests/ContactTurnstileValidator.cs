using System.Net.Http.Json;
using System.Text.Json.Serialization;
using CloudServiceStore.Application.ContactRequests;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Infrastructure.ContactRequests;

public sealed class ContactTurnstileOptions
{
    public const string SectionName = "ContactTurnstile";

    public bool Enabled { get; init; }
    public string SecretKey { get; init; } = string.Empty;
    public string ExpectedAction { get; init; } = "contact_submit";
    public string? ExpectedHostname { get; init; }
}

public sealed class ContactTurnstileValidator(
    HttpClient httpClient,
    IOptions<ContactTurnstileOptions> options) : IContactTurnstileValidator
{
    public async Task<ContactTurnstileValidationResult> ValidateAsync(
        string? token,
        string? remoteIpAddress,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!settings.Enabled)
            return new(true, true);

        if (string.IsNullOrWhiteSpace(settings.SecretKey))
            return new(false, false);

        if (string.IsNullOrWhiteSpace(token) || token.Length > 2048)
            return new(false, true);

        var values = new Dictionary<string, string>
        {
            ["secret"] = settings.SecretKey,
            ["response"] = token,
            ["idempotency_key"] = Guid.NewGuid().ToString()
        };

        if (!string.IsNullOrWhiteSpace(remoteIpAddress))
            values["remoteip"] = remoteIpAddress;

        using var content = new FormUrlEncodedContent(values);

        try
        {
            using var response = await httpClient.PostAsync(
                "turnstile/v0/siteverify",
                content,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
                return new(false, false);

            var payload = await response.Content.ReadFromJsonAsync<TurnstileSiteverifyResponse>(
                cancellationToken: cancellationToken);

            var matchesAction = string.IsNullOrWhiteSpace(settings.ExpectedAction)
                || string.Equals(payload?.Action, settings.ExpectedAction, StringComparison.Ordinal);
            var matchesHostname = string.IsNullOrWhiteSpace(settings.ExpectedHostname)
                || string.Equals(payload?.Hostname, settings.ExpectedHostname, StringComparison.OrdinalIgnoreCase);

            return new(payload?.Success == true && matchesAction && matchesHostname, true);
        }
        catch (HttpRequestException)
        {
            return new(false, false);
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return new(false, false);
        }
    }

    private sealed record TurnstileSiteverifyResponse(
        [property: JsonPropertyName("success")] bool Success,
        [property: JsonPropertyName("hostname")] string? Hostname,
        [property: JsonPropertyName("action")] string? Action);
}
