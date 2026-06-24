using AuthorVault.Api.Data;
using AuthorVault.Api.Dtos;
using AuthorVault.Api.Entities;
using AuthorVault.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AuthorVault.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/files")]
public class FilesController(
    AppDbContext db,
    WorkspaceService workspace,
    IFileStorageService storage) : ControllerBase
{
    [HttpGet("storage-info")]
    public ActionResult<object> StorageInfo()
    {
        return Ok(new
        {
            provider = storage is S3FileStorageService ? "aws-s3" : "local",
            configured = storage.IsConfigured
        });
    }

    [HttpPost("upload")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<FileUploadResponse>> Upload(
        IFormFile file,
        [FromQuery] string category = "general",
        CancellationToken ct = default)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided." });

        var userId = WorkspaceService.GetUserId(User);
        await workspace.GetOrCreateAsync(userId, ct);

        await using var stream = file.OpenReadStream();
        var (key, url) = await storage.UploadAsync(userId, category, file.FileName, file.ContentType, stream, ct);

        var record = new UploadedFile
        {
            UserId = userId,
            FileName = file.FileName,
            ContentType = file.ContentType,
            S3Key = key,
            Url = url,
            Category = category,
            SizeBytes = file.Length
        };
        db.UploadedFiles.Add(record);
        await db.SaveChangesAsync(ct);

        return Ok(new FileUploadResponse(record.Id, record.FileName, record.Url, record.ContentType, record.SizeBytes, record.Category));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        var userId = WorkspaceService.GetUserId(User);
        var file = await db.UploadedFiles.FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId, ct);
        if (file is null) return NotFound();

        db.UploadedFiles.Remove(file);
        await db.SaveChangesAsync(ct);
        return Ok(new { success = true });
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<FileUploadResponse>>> List([FromQuery] string? category, CancellationToken ct)
    {
        var userId = WorkspaceService.GetUserId(User);
        var query = db.UploadedFiles.Where(f => f.UserId == userId);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(f => f.Category == category);

        var files = await query.OrderByDescending(f => f.UploadedAt).Take(200).ToListAsync(ct);
        return Ok(files.Select(f => new FileUploadResponse(f.Id, f.FileName, f.Url, f.ContentType, f.SizeBytes, f.Category)));
    }
}
