namespace CloudServiceStore.Integration.Tests;

public sealed class VisualQaResetScriptTests
{
    [Fact]
    public void Reset_script_is_scoped_to_the_visual_qa_compose_project_and_volume()
    {
        var root = FindRepositoryRoot();
        var script = File.ReadAllText(Path.Combine(root, "scripts", "Reset-VisualQa.ps1"));

        Assert.Contains("docker-compose.visual-qa.yml", script, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("cloud-service-store-visual-qa", script, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("$qaVolumeName = \"sqlserver-data\"", script, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("$qaVolumeName = \"cloud-service-store-sqlserver\"", script, StringComparison.OrdinalIgnoreCase);
    }

    private static string FindRepositoryRoot()
    {
        var directory = new DirectoryInfo(AppContext.BaseDirectory);
        while (directory is not null && !File.Exists(Path.Combine(directory.FullName, "CloudServiceStore.sln")))
        {
            directory = directory.Parent;
        }

        return directory?.FullName ?? throw new DirectoryNotFoundException("Repository root was not found.");
    }
}
