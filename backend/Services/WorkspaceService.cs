using System.Security.Claims;
using AuthorVault.Api.Data;
using AuthorVault.Api.Entities;
using Microsoft.EntityFrameworkCore;

namespace AuthorVault.Api.Services;

public class WorkspaceService(AppDbContext db)
{
    public async Task<UserWorkspace> GetOrCreateAsync(int userId, CancellationToken ct = default)
    {
        var ws = await db.UserWorkspaces.FirstOrDefaultAsync(w => w.UserId == userId, ct);
        if (ws is not null) return ws;

        ws = new UserWorkspace
        {
            UserId = userId,
            CompanyJson = SeedData.DefaultCompanyJson,
            VaultExtrasJson = SeedData.DefaultVaultExtrasJson,
            ImportantDatesJson = SeedData.DefaultImportantDatesJson,
            BooksJson = SeedData.DefaultBooksJson,
            SettingsJson = SeedData.DefaultSettingsJson
        };
        db.UserWorkspaces.Add(ws);
        await db.SaveChangesAsync(ct);
        return ws;
    }

    public async Task SaveAsync(UserWorkspace ws, CancellationToken ct = default)
    {
        ws.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);
    }

    public static int GetUserId(ClaimsPrincipal user)
    {
        var sub = user.FindFirstValue(ClaimTypes.NameIdentifier)
                  ?? user.FindFirstValue("sub")
                  ?? user.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub);
        if (sub is null || !int.TryParse(sub, out var id))
            throw new UnauthorizedAccessException();
        return id;
    }
}
