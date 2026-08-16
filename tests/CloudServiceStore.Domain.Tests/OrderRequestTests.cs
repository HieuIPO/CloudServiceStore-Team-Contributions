using CloudServiceStore.Domain.Entities;
using CloudServiceStore.Domain.Enums;

namespace CloudServiceStore.Domain.Tests;

public sealed class OrderRequestTests
{
    [Fact]
    public void New_order_request_defaults_to_pending_status()
    {
        var orderRequest = new OrderRequest();

        Assert.Equal(OrderRequestStatus.Pending, orderRequest.Status);
    }
}
