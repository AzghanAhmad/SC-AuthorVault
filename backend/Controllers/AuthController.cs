using System.Text.Json;
using AuthorVault.Api.Data;
using AuthorVault.Api.Dtos;
using AuthorVault.Api.Entities;
using AuthorVault.Api.Services;
using BC = BCrypt.Net.BCrypt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(
    AppDbContext db,
    JwtService jwt,
    WorkspaceService workspace) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register([FromBody] RegisterRequest req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Name, email, and password are required." });

        var email = req.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            return Conflict(new { message = "An account with this email already exists." });

        if (req.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var user = new User
        {
            Name = req.Name.Trim(),
            Email = email,
            PasswordHash = BC.HashPassword(req.Password)
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);
        await workspace.GetOrCreateAsync(user.Id, ct);

        var token = jwt.CreateToken(user.Id, user.Email, user.Name);
        return Ok(new AuthResponse(token, new UserDto(user.Id, user.Name, user.Email)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest req, CancellationToken ct)
    {
        var email = req.Email.Trim().ToLowerInvariant();
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == email, ct);
        if (user is null || !BC.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid credentials." });

        var token = jwt.CreateToken(user.Id, user.Email, user.Name);
        return Ok(new AuthResponse(token, new UserDto(user.Id, user.Name, user.Email)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me(CancellationToken ct)
    {
        var userId = WorkspaceService.GetUserId(User);
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound();
        return Ok(new UserDto(user.Id, user.Name, user.Email));
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<ActionResult<UserDto>> UpdateProfile([FromBody] JsonElement body, CancellationToken ct)
    {
        var userId = WorkspaceService.GetUserId(User);
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound();

        if (body.TryGetProperty("name", out var nameEl) && nameEl.ValueKind == JsonValueKind.String)
            user.Name = nameEl.GetString()!.Trim();
        if (body.TryGetProperty("email", out var emailEl) && emailEl.ValueKind == JsonValueKind.String)
        {
            var email = emailEl.GetString()!.Trim().ToLowerInvariant();
            if (await db.Users.AnyAsync(u => u.Email == email && u.Id != userId, ct))
                return Conflict(new { message = "Email already in use." });
            user.Email = email;
        }

        await db.SaveChangesAsync(ct);
        return Ok(new UserDto(user.Id, user.Name, user.Email));
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req, CancellationToken ct)
    {
        var userId = WorkspaceService.GetUserId(User);
        var user = await db.Users.FindAsync([userId], ct);
        if (user is null) return NotFound();
        if (!BC.Verify(req.CurrentPassword, user.PasswordHash))
            return BadRequest(new { message = "Current password is incorrect." });
        if (req.NewPassword.Length < 6)
            return BadRequest(new { message = "New password must be at least 6 characters." });

        user.PasswordHash = BC.HashPassword(req.NewPassword);
        await db.SaveChangesAsync(ct);
        return Ok(new { success = true });
    }
}
