using System.Text.Json;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/books")]
public class BooksController(WorkspaceService workspace) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        return Content(ws.BooksJson, "application/json");
    }

    [HttpPut]
    public async Task<IActionResult> Put([FromBody] JsonElement books, CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.BooksJson = books.GetRawText();
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }
}
