using CloudServiceStore.Application;

namespace CloudServiceStore.Application.Tests;

public sealed class ApplicationAssemblyTests
{
    [Fact]
    public void Application_assembly_marker_is_available()
    {
        Assert.NotNull(typeof(ApplicationAssemblyMarker).Assembly);
    }
}
