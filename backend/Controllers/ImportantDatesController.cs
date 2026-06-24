using System.Text.Json;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/important-dates")]
public class ImportantDatesController(WorkspaceService workspace) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        return Content(ws.ImportantDatesJson, "application/json");
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] JsonElement dates, CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.ImportantDatesJson = dates.GetRawText();
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }
}
