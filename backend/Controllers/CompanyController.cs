using System.Text.Json;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class CompanyController(WorkspaceService workspace) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        return Content(ws.CompanyJson, "application/json");
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] JsonElement company, CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.CompanyJson = company.GetRawText();
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }
}
