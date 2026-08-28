using System.Net;
using System.Net.Mail;
using System.Text;
using CloudServiceStore.Application.ContactRequests;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Infrastructure.ContactRequests;

public sealed class ContactEmailOptions
{
    public const string SectionName = "ContactEmail";

    public bool Enabled { get; init; }
    public string Host { get; init; } = "smtp.gmail.com";
    public int Port { get; init; } = 587;
    public bool UseSsl { get; init; } = true;
    public string Username { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string FromAddress { get; init; } = string.Empty;
    public string FromDisplayName { get; init; } = "CloudServiceStore";
    public string AdminRecipientAddress { get; init; } = string.Empty;
    public int TimeoutSeconds { get; init; } = 10;
}

public sealed class SmtpContactRequestNotificationSender(
    IOptions<ContactEmailOptions> options) : IContactRequestNotificationSender
{
    public async Task NotifyCreatedAsync(
        ContactRequestNotification notification,
        CancellationToken cancellationToken)
    {
        var settings = options.Value;
        if (!settings.Enabled)
            return;

        Validate(settings);

        using var message = new MailMessage(
            new MailAddress(settings.FromAddress, settings.FromDisplayName),
            new MailAddress(settings.AdminRecipientAddress))
        {
            Subject = $"[CloudServiceStore] New contact request: {notification.Subject}",
            Body = BuildBody(notification),
            BodyEncoding = Encoding.UTF8,
            SubjectEncoding = Encoding.UTF8,
            IsBodyHtml = false
        };

        using var smtp = new SmtpClient(settings.Host, settings.Port)
        {
            EnableSsl = settings.UseSsl,
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(settings.Username, settings.Password),
            Timeout = checked(settings.TimeoutSeconds * 1000)
        };

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(settings.TimeoutSeconds));
        await smtp.SendMailAsync(message, timeoutCts.Token);
    }

    private static void Validate(ContactEmailOptions settings)
    {
        if (string.IsNullOrWhiteSpace(settings.Host)
            || settings.Port is < 1 or > 65535
            || string.IsNullOrWhiteSpace(settings.Username)
            || string.IsNullOrWhiteSpace(settings.Password)
            || string.IsNullOrWhiteSpace(settings.FromAddress)
            || string.IsNullOrWhiteSpace(settings.AdminRecipientAddress)
            || settings.TimeoutSeconds is < 1 or > 300)
        {
            throw new InvalidOperationException(
                "ContactEmail is enabled but the SMTP configuration is incomplete.");
        }
    }

    private static string BuildBody(ContactRequestNotification notification) =>
        $"""
        A new Contact Request was created.

        Request ID: {notification.Id}
        Received (UTC): {notification.CreatedAt:O}
        Name: {notification.FullName}
        Email: {notification.Email}
        Phone: {notification.PhoneNumber}
        Company: {notification.CompanyName ?? "(not provided)"}
        Subject: {notification.Subject}

        Open the Admin Contact Requests page to review and process this request.
        """;
}
