using System.Text.Json;
using AuthorVault.Api.Dtos;
using AuthorVault.Api.Services;
using BC = BCrypt.Net.BCrypt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/company/pin")]
public class CompanyPinController(WorkspaceService workspace) : ControllerBase
{
    private static readonly TimeSpan PinTimeout = TimeSpan.FromMinutes(10);

    [HttpGet("status")]
    public async Task<ActionResult<PinStatusResponse>> Status(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        var hasPin = !string.IsNullOrEmpty(ws.PinHash);
        var unlocked = hasPin && ws.PinLastActivityUtc.HasValue &&
                       DateTime.UtcNow - ws.PinLastActivityUtc.Value < PinTimeout;
        return Ok(new PinStatusResponse(hasPin, unlocked));
    }

    [HttpPost("setup")]
    public async Task<IActionResult> Setup([FromBody] PinSetupRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Pin) || req.Pin.Length < 4)
            return BadRequest(new { message = "PIN must be at least 4 characters." });

        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.PinHash = BC.HashPassword(req.Pin);
        ws.PinLastActivityUtc = DateTime.UtcNow;
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }

    [HttpPost("verify")]
    public async Task<IActionResult> Verify([FromBody] PinVerifyRequest req, CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        if (string.IsNullOrEmpty(ws.PinHash))
            return BadRequest(new { message = "PIN not set up yet." });
        if (!BC.Verify(req.Pin, ws.PinHash))
            return Unauthorized(new { message = "Incorrect PIN." });

        ws.PinLastActivityUtc = DateTime.UtcNow;
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true, unlocked = true });
    }

    [HttpPost("touch")]
    public async Task<IActionResult> Touch(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        if (string.IsNullOrEmpty(ws.PinHash))
            return BadRequest(new { message = "PIN not set up." });

        ws.PinLastActivityUtc = DateTime.UtcNow;
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }

    [HttpPost("lock")]
    public async Task<IActionResult> Lock(CancellationToken ct)
    {
        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.PinLastActivityUtc = null;
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }

    [HttpPost("change")]
    public async Task<IActionResult> Change([FromBody] PinSetupRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Pin) || req.Pin.Length < 4)
            return BadRequest(new { message = "PIN must be at least 4 characters." });

        var ws = await workspace.GetOrCreateAsync(WorkspaceService.GetUserId(User), ct);
        ws.PinHash = BC.HashPassword(req.Pin);
        ws.PinLastActivityUtc = DateTime.UtcNow;
        ws.UpdatedAt = DateTime.UtcNow;
        await workspace.SaveAsync(ws, ct);
        return Ok(new { success = true });
    }
}
