using CloudServiceStore.Application.EditorWorkspace;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CloudServiceStore.WebApi.Controllers;

[ApiController]
[Route("api/v1/editor-workspace")]
public sealed class EditorWorkspaceController(IEditorWorkspaceService workspaceService) : ControllerBase
{
    [Authorize(Policy = "ViewEditorWorkspace")]
    [HttpGet]
    public Task<IActionResult> Get([FromQuery] EditorWorkspaceQuery query, CancellationToken ct) =>
        Execute(async () => Ok(await workspaceService.GetWorkspaceDataAsync(query, ct)));

    private static async Task<IActionResult> Execute(Func<Task<IActionResult>> action)
    {
        try { return await action(); }
        catch (EditorWorkspaceValidationException ex)
        {
            return new ObjectResult(new ProblemDetails { Status = 400, Title = "Validation failed", Detail = ex.Message })
            { StatusCode = StatusCodes.Status400BadRequest };
        }
    }
}
