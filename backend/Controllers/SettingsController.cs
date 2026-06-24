using System.Text.Json;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/settings")]
public class SettingsController(WorkspaceService workspace) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        return Content(ws.SettingsJson, "application/json");
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] JsonElement settings, CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.SettingsJson = settings.GetRawText();
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Content(ws.SettingsJson, "application/json");
    }
}
