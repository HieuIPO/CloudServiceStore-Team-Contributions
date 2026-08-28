using CloudServiceStore.Application.ContactRequests;
using CloudServiceStore.Infrastructure.ContactRequests;
using Microsoft.Extensions.Options;

namespace CloudServiceStore.Integration.Tests;

public sealed class ContactEmailNotificationSenderTests
{
    [Fact]
    public async Task NotifyCreatedAsync_rejects_invalid_smtp_timeout_before_connecting()
    {
        var sender = new SmtpContactRequestNotificationSender(
            Options.Create(new ContactEmailOptions
            {
                Enabled = true,
                Host = "smtp.gmail.com",
                Username = "sender@example.test",
                Password = "test-password",
                FromAddress = "sender@example.test",
                AdminRecipientAddress = "admin@example.test",
                TimeoutSeconds = 0
            }));

        await Assert.ThrowsAsync<InvalidOperationException>(() => sender.NotifyCreatedAsync(
            new ContactRequestNotification(
                Guid.NewGuid(),
                "Duy",
                "duy@example.test",
                "0901234567",
                null,
                "Tu van Cloud",
                DateTimeOffset.UtcNow),
            CancellationToken.None));
    }

    [Fact]
    public async Task NotifyCreatedAsync_does_not_open_smtp_when_feature_is_disabled()
    {
        var sender = new SmtpContactRequestNotificationSender(
            Options.Create(new ContactEmailOptions { Enabled = false }));

        await sender.NotifyCreatedAsync(
            new ContactRequestNotification(
                Guid.NewGuid(),
                "Duy",
                "duy@example.test",
                "0901234567",
                null,
                "Tu van Cloud",
                DateTimeOffset.UtcNow),
            CancellationToken.None);
    }
}
