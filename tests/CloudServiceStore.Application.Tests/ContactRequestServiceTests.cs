using CloudServiceStore.Application.ContactRequests;
using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;
using Moq;

namespace CloudServiceStore.Application.Tests;

public sealed class ContactRequestServiceTests
{
    [Fact]
    public async Task Create_trims_values_adds_initial_history_and_audit()
    {
        var repository = CreateRepository();
        var actorId = Guid.NewGuid();
        var service = new ContactRequestService(repository.Object);
        var result = await service.CreateAsync(
            new("  Nguyen Van A  ", " A@EXAMPLE.COM ", "+84 901 234 567", "  ACME  ", "  Cloud tư vấn  ", "  Cần tư vấn VPS  "),
            actorId, "127.0.0.1", CancellationToken.None);
        Assert.NotEqual(Guid.Empty, result.Id);
        Assert.Equal(ContactRequestStatus.New, result.Status);
        repository.Verify(x => x.Add(It.Is<ContactRequest>(item =>
            item.FullName == "Nguyen Van A" && item.Email == "a@example.com" && item.PhoneNumber == "+84901234567"
            && item.CompanyName == "ACME" && item.Subject == "Cloud tư vấn" && item.Message == "Cần tư vấn VPS"
            && item.StatusHistory.Count == 1)), Times.Once);
        repository.Verify(x => x.AddAudit(actorId, "ContactRequest.Created", nameof(ContactRequest), It.IsAny<Guid>(), null, It.IsAny<string>(), "127.0.0.1"), Times.Once);
        repository.Verify(x => x.AddStatusHistory(It.IsAny<ContactRequestStatusHistory>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Create_rejects_invalid_input_before_repository_access()
    {
        var repository = CreateRepository();
        var service = new ContactRequestService(repository.Object);
        await Assert.ThrowsAsync<ContactRequestValidationException>(() => service.CreateAsync(
            new("", "not-an-email", "123", null, "", ""), null, null, CancellationToken.None));
        repository.Verify(x => x.HasRecentRequestAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>()), Times.Never);
        repository.Verify(x => x.Add(It.IsAny<ContactRequest>()), Times.Never);
    }

    [Fact]
    public async Task Create_rejects_recent_duplicate()
    {
        var repository = CreateRepository();
        repository.Setup(x => x.HasRecentRequestAsync(It.IsAny<string>(), It.IsAny<DateTimeOffset>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        var service = new ContactRequestService(repository.Object);
        await Assert.ThrowsAsync<ContactRequestConflictException>(() => service.CreateAsync(
            new("Nguyen Van A", "a@example.com", "0901234567", null, "Tư vấn", "Nội dung"), null, null, CancellationToken.None));
        repository.Verify(x => x.Add(It.IsAny<ContactRequest>()), Times.Never);
        repository.Verify(x => x.SaveChangesAsync(It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Reject_requires_note_and_final_status_cannot_reopen()
    {
        var repository = CreateRepository();
        var contact = new ContactRequest { FullName = "Nguyen Van A", Email = "a@example.com", PhoneNumber = "0901234567", Subject = "Tư vấn", Message = "Nội dung", Status = ContactRequestStatus.New };
        repository.Setup(x => x.FindAsync(contact.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contact);
        var actorId = Guid.NewGuid();
        var service = new ContactRequestService(repository.Object);
        await Assert.ThrowsAsync<ContactRequestValidationException>(() => service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.Rejected, null), actorId, null, CancellationToken.None));
        await service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.Rejected, "Không phù hợp"), actorId, null, CancellationToken.None);
        Assert.Equal(ContactRequestStatus.Rejected, contact.Status);
        await Assert.ThrowsAsync<ContactRequestConflictException>(() => service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.InProgress, "Mở lại"), actorId, null, CancellationToken.None));
    }

    [Fact]
    public async Task New_can_move_to_in_progress_then_resolved_and_set_resolution_fields()
    {
        var repository = CreateRepository();
        var contact = new ContactRequest { FullName = "Nguyen Van A", Email = "a@example.com", PhoneNumber = "0901234567", Subject = "Tư vấn", Message = "Nội dung", Status = ContactRequestStatus.New };
        repository.Setup(x => x.FindAsync(contact.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contact);
        var actorId = Guid.NewGuid();
        var service = new ContactRequestService(repository.Object);
        await service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.InProgress, null), actorId, null, CancellationToken.None);
        Assert.Equal(ContactRequestStatus.InProgress, contact.Status);
        Assert.Null(contact.ResolvedBy);
        Assert.Null(contact.ResolvedAt);
        await service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.Resolved, "Đã tư vấn xong"), actorId, null, CancellationToken.None);
        Assert.Equal(ContactRequestStatus.Resolved, contact.Status);
        Assert.Equal("Đã tư vấn xong", contact.ResolutionNote);
        Assert.Equal(actorId, contact.ResolvedBy);
        Assert.NotNull(contact.ResolvedAt);
        repository.Verify(x => x.AddStatusHistory(It.IsAny<ContactRequestStatusHistory>()), Times.Exactly(2));
    }

    [Fact]
    public async Task In_progress_cannot_move_back_to_new_and_final_states_cannot_reopen()
    {
        var repository = CreateRepository();
        var contact = new ContactRequest { Status = ContactRequestStatus.InProgress };
        repository.Setup(x => x.FindAsync(contact.Id, It.IsAny<CancellationToken>())).ReturnsAsync(contact);
        var service = new ContactRequestService(repository.Object);
        var actorId = Guid.NewGuid();
        await Assert.ThrowsAsync<ContactRequestConflictException>(() => service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.New, null), actorId, null, CancellationToken.None));
        contact.Status = ContactRequestStatus.Resolved;
        await Assert.ThrowsAsync<ContactRequestConflictException>(() => service.UpdateStatusAsync(contact.Id, new(ContactRequestStatus.InProgress, "Mở lại"), actorId, null, CancellationToken.None));
    }

    private static Mock<IContactRequestRepository> CreateRepository()
    {
        var repository = new Mock<IContactRequestRepository>();
        repository.Setup(x => x.SaveChangesAsync(It.IsAny<CancellationToken>())).Returns(Task.CompletedTask);
        return repository;
    }
}
