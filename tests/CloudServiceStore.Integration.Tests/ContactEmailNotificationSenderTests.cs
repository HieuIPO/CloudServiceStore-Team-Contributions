using System.Net;
using System.Net.Sockets;
using System.Text;
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
    public async Task NotifyCreatedAsync_honors_runtime_smtp_timeout_when_server_stalls()
    {
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        var acceptTask = listener.AcceptTcpClientAsync();
        var sender = new SmtpContactRequestNotificationSender(
            Options.Create(new ContactEmailOptions
            {
                Enabled = true,
                Host = "127.0.0.1",
                Port = port,
                UseSsl = false,
                Username = "sender@example.test",
                Password = "test-password",
                FromAddress = "sender@example.test",
                AdminRecipientAddress = "admin@example.test",
                TimeoutSeconds = 1
            }));

        var sendTask = sender.NotifyCreatedAsync(Notification(), CancellationToken.None);
        using var server = await acceptTask.WaitAsync(TimeSpan.FromSeconds(5));
        await using var stream = server.GetStream();
        await stream.WriteAsync(Encoding.ASCII.GetBytes("220 test.smtp.local ready\\r\\n"));

        var completed = await Task.WhenAny(sendTask, Task.Delay(TimeSpan.FromSeconds(5)));

        Assert.Same(sendTask, completed);
        await Assert.ThrowsAnyAsync<Exception>(() => sendTask);
    }

    [Fact]
    public async Task NotifyCreatedAsync_does_not_open_smtp_when_feature_is_disabled()
    {
        var sender = new SmtpContactRequestNotificationSender(
            Options.Create(new ContactEmailOptions { Enabled = false }));

        await sender.NotifyCreatedAsync(Notification(), CancellationToken.None);
    }

    private static ContactRequestNotification Notification() =>
        new(
            Guid.NewGuid(),
            "Duy",
            "duy@example.test",
            "0901234567",
            null,
            "Tu van Cloud",
            DateTimeOffset.UtcNow);
}
