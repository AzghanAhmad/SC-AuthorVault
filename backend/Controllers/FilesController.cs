using System.Diagnostics;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
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
    private static readonly string BrowserUserAgent =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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

    /// <summary>
    /// Fetch an image from a Canva share/design URL (or any public image URL) and store it as an uploaded file.
    /// Uses curl when available because Canva/Cloudflare often blocks .NET HttpClient with HTTP 403.
    /// </summary>
    [HttpPost("import-from-url")]
    [RequestSizeLimit(52_428_800)]
    public async Task<ActionResult<FileUploadResponse>> ImportFromUrl(
        [FromBody] ImportFromUrlRequest body,
        CancellationToken ct = default)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Url))
            return BadRequest(new { message = "URL is required." });

        if (!Uri.TryCreate(body.Url.Trim(), UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
            return BadRequest(new { message = "Enter a valid http(s) URL." });

        uri = NormalizeCanvaUrl(uri);

        var userId = WorkspaceService.GetUserId(User);
        await workspace.GetOrCreateAsync(userId, ct);

        byte[] bytes;
        string contentType;
        string fileName;

        try
        {
            var page = await FetchUrlAsync(uri, ct);
            if (page.StatusCode is < 200 or >= 400)
            {
                return BadRequest(new
                {
                    message = page.StatusCode == 403
                        ? "Canva blocked the server request (HTTP 403). Your link can still be public — paste a direct PNG/JPG export URL, or download the design and upload the file instead."
                        : $"Could not fetch URL (HTTP {page.StatusCode}). Make sure the Canva link is public (Share → Anyone with the link)."
                });
            }

            contentType = page.ContentType ?? "application/octet-stream";
            bytes = page.Bytes;

            // Canva design pages return HTML — extract og:image / media CDN preview.
            if (contentType.Contains("html", StringComparison.OrdinalIgnoreCase) || LooksLikeHtml(bytes))
            {
                var html = Encoding.UTF8.GetString(bytes);
                var imageUrl = ExtractPreviewImageUrl(html);
                if (string.IsNullOrWhiteSpace(imageUrl))
                {
                    return BadRequest(new
                    {
                        message = "No preview image found on that Canva page. Share the design publicly, export as PNG/JPG and paste the direct image URL, or upload the file manually."
                    });
                }

                if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var imgUri) &&
                    !Uri.TryCreate(uri, imageUrl, out imgUri))
                {
                    return BadRequest(new { message = "Found a preview image URL but it was invalid." });
                }

                var img = await FetchUrlAsync(imgUri, ct, referer: uri.ToString());
                if (img.StatusCode is < 200 or >= 400 || img.Bytes.Length == 0)
                {
                    return BadRequest(new
                    {
                        message = "Found a Canva preview image but failed to download it. Export the design as PNG and paste that direct image URL, or upload the file."
                    });
                }

                contentType = img.ContentType ?? "image/png";
                bytes = img.Bytes;
            }

            if (bytes.Length == 0)
                return BadRequest(new { message = "Downloaded file was empty." });

            if (bytes.Length > 20_000_000)
                return BadRequest(new { message = "Image is too large (max 20MB)." });

            if (!contentType.StartsWith("image/", StringComparison.OrdinalIgnoreCase) &&
                !contentType.Contains("svg", StringComparison.OrdinalIgnoreCase))
            {
                if (!LooksLikeImage(bytes))
                    return BadRequest(new { message = "URL did not resolve to an image. Paste a Canva share link or a direct image URL." });
                contentType = "image/png";
            }

            var ext = ExtFromContentType(contentType);
            fileName = string.IsNullOrWhiteSpace(body.FileName)
                ? $"canva-import-{DateTime.UtcNow:yyyyMMddHHmmss}{ext}"
                : EnsureExtension(body.FileName!, ext);
        }
        catch (TaskCanceledException)
        {
            return BadRequest(new { message = "Timed out fetching the Canva link." });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Failed to import from URL: {ex.Message}" });
        }

        await using var stream = new MemoryStream(bytes);
        var category = string.IsNullOrWhiteSpace(body.Category) ? "logo-canva" : body.Category!;
        var (key, url) = await storage.UploadAsync(userId, category, fileName, contentType, stream, ct);

        var record = new UploadedFile
        {
            UserId = userId,
            FileName = fileName,
            ContentType = contentType,
            S3Key = key,
            Url = url,
            Category = category,
            SizeBytes = bytes.Length
        };
        db.UploadedFiles.Add(record);
        await db.SaveChangesAsync(ct);

        return Ok(new FileUploadResponse(record.Id, record.FileName, record.Url, record.ContentType, record.SizeBytes, record.Category));
    }

    private static Uri NormalizeCanvaUrl(Uri uri)
    {
        if (!uri.Host.Contains("canva.com", StringComparison.OrdinalIgnoreCase))
            return uri;

        // Direct image / CDN URLs should not be rewritten.
        var path = uri.AbsolutePath;
        if (Regex.IsMatch(path, @"\.(png|jpe?g|gif|webp|svg)$", RegexOptions.IgnoreCase))
            return uri;
        if (uri.Host.Contains("media", StringComparison.OrdinalIgnoreCase) ||
            uri.Host.Contains("static", StringComparison.OrdinalIgnoreCase))
            return uri;

        // Ensure design links use /view and include share tracking params Canva expects.
        var match = Regex.Match(path, @"/design/(?<id>[A-Za-z0-9_-]+)(?:/(?<rest>[^/?#]*))?", RegexOptions.IgnoreCase);
        if (!match.Success)
            return uri;

        var designId = match.Groups["id"].Value;
        var rest = match.Groups["rest"].Success ? match.Groups["rest"].Value : "";
        if (string.Equals(rest, "edit", StringComparison.OrdinalIgnoreCase) || string.IsNullOrWhiteSpace(rest))
            rest = "view";

        var builder = new UriBuilder(uri)
        {
            Scheme = "https",
            Host = uri.Host.StartsWith("www.", StringComparison.OrdinalIgnoreCase) ? uri.Host : "www.canva.com",
            Path = $"/design/{designId}/{rest}",
        };

        var query = Microsoft.AspNetCore.WebUtilities.QueryHelpers.ParseQuery(uri.Query)
            .ToDictionary(kv => kv.Key, kv => kv.Value.ToString(), StringComparer.OrdinalIgnoreCase);
        query.TryAdd("utm_content", designId);
        query.TryAdd("utm_campaign", "designshare");
        query.TryAdd("utm_medium", "link");
        query.TryAdd("utm_source", "viewer");
        builder.Query = string.Join("&", query.Select(kv =>
            $"{Uri.EscapeDataString(kv.Key)}={Uri.EscapeDataString(kv.Value ?? string.Empty)}"));
        return builder.Uri;
    }

    private sealed record FetchResult(int StatusCode, byte[] Bytes, string? ContentType);

    private static async Task<FetchResult> FetchUrlAsync(Uri uri, CancellationToken ct, string? referer = null)
    {
        // Prefer curl: Cloudflare often 403s .NET HttpClient TLS fingerprint even for public Canva pages.
        var viaCurl = await TryFetchWithCurlAsync(uri, ct, referer);
        if (viaCurl is not null)
            return viaCurl;

        return await FetchWithHttpClientAsync(uri, ct, referer);
    }

    private static async Task<FetchResult> FetchWithHttpClientAsync(Uri uri, CancellationToken ct, string? referer)
    {
        using var handler = new HttpClientHandler
        {
            AutomaticDecompression = DecompressionMethods.All,
            AllowAutoRedirect = true,
            UseCookies = true,
            CookieContainer = new CookieContainer(),
        };
        using var http = new HttpClient(handler) { Timeout = TimeSpan.FromSeconds(30) };
        using var request = new HttpRequestMessage(HttpMethod.Get, uri);
        request.Headers.TryAddWithoutValidation("User-Agent", BrowserUserAgent);
        request.Headers.TryAddWithoutValidation("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8");
        request.Headers.TryAddWithoutValidation("Accept-Language", "en-US,en;q=0.9");
        request.Headers.TryAddWithoutValidation("Cache-Control", "no-cache");
        request.Headers.TryAddWithoutValidation("Pragma", "no-cache");
        request.Headers.TryAddWithoutValidation("Sec-CH-UA", "\"Google Chrome\";v=\"131\", \"Chromium\";v=\"131\", \"Not_A Brand\";v=\"24\"");
        request.Headers.TryAddWithoutValidation("Sec-CH-UA-Mobile", "?0");
        request.Headers.TryAddWithoutValidation("Sec-CH-UA-Platform", "\"Windows\"");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Dest", "document");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Mode", "navigate");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-Site", referer is null ? "none" : "cross-site");
        request.Headers.TryAddWithoutValidation("Sec-Fetch-User", "?1");
        request.Headers.TryAddWithoutValidation("Upgrade-Insecure-Requests", "1");
        if (!string.IsNullOrWhiteSpace(referer))
            request.Headers.TryAddWithoutValidation("Referer", referer);

        using var response = await http.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, ct);
        var bytes = await response.Content.ReadAsByteArrayAsync(ct);
        var contentType = response.Content.Headers.ContentType?.MediaType;
        return new FetchResult((int)response.StatusCode, bytes, contentType);
    }

    private static async Task<FetchResult?> TryFetchWithCurlAsync(Uri uri, CancellationToken ct, string? referer)
    {
        var curlPath = ResolveCurlPath();
        if (curlPath is null)
            return null;

        var tmpFile = Path.Combine(Path.GetTempPath(), $"av-canva-{Guid.NewGuid():N}.bin");
        var headerFile = Path.Combine(Path.GetTempPath(), $"av-canva-{Guid.NewGuid():N}.hdr");
        try
        {
            var args = new StringBuilder();
            args.Append("-sL --max-time 30 --compressed ");
            args.Append("-A ").Append(QuoteArg(BrowserUserAgent)).Append(' ');
            args.Append("-H ").Append(QuoteArg("Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8")).Append(' ');
            args.Append("-H ").Append(QuoteArg("Accept-Language: en-US,en;q=0.9")).Append(' ');
            args.Append("-H ").Append(QuoteArg("Cache-Control: no-cache")).Append(' ');
            if (!string.IsNullOrWhiteSpace(referer))
                args.Append("-e ").Append(QuoteArg(referer)).Append(' ');
            args.Append("-D ").Append(QuoteArg(headerFile)).Append(' ');
            args.Append("-o ").Append(QuoteArg(tmpFile)).Append(' ');
            args.Append("-w ").Append(QuoteArg("%{http_code}")).Append(' ');
            args.Append(QuoteArg(uri.ToString()));

            using var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = curlPath,
                    Arguments = args.ToString(),
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                }
            };

            process.Start();
            var stdoutTask = process.StandardOutput.ReadToEndAsync(ct);
            var stderrTask = process.StandardError.ReadToEndAsync(ct);
            await process.WaitForExitAsync(ct);
            var stdout = (await stdoutTask).Trim();
            _ = await stderrTask;

            if (!System.IO.File.Exists(tmpFile))
                return null;

            if (!int.TryParse(stdout, out var status))
                status = process.ExitCode == 0 ? 200 : 502;

            var bytes = await System.IO.File.ReadAllBytesAsync(tmpFile, ct);
            string? contentType = null;
            if (System.IO.File.Exists(headerFile))
            {
                var headers = await System.IO.File.ReadAllTextAsync(headerFile, ct);
                var ctMatch = Regex.Match(headers, @"^Content-Type:\s*([^\r\n;]+)", RegexOptions.IgnoreCase | RegexOptions.Multiline);
                if (ctMatch.Success)
                    contentType = ctMatch.Groups[1].Value.Trim();
            }

            return new FetchResult(status, bytes, contentType);
        }
        catch
        {
            return null;
        }
        finally
        {
            TryDelete(tmpFile);
            TryDelete(headerFile);
        }
    }

    private static string? ResolveCurlPath()
    {
        var candidates = new[]
        {
            Path.Combine(Environment.SystemDirectory, "curl.exe"),
            Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.System), "curl.exe"),
            "curl.exe",
            "curl",
        };
        foreach (var c in candidates)
        {
            try
            {
                if (c is "curl" or "curl.exe")
                {
                    // Let Process resolve PATH later — verify quickly
                    using var probe = Process.Start(new ProcessStartInfo
                    {
                        FileName = c,
                        Arguments = "--version",
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        UseShellExecute = false,
                        CreateNoWindow = true,
                    });
                    if (probe is null) continue;
                    probe.WaitForExit(2000);
                    if (probe.ExitCode == 0) return c;
                }
                else if (System.IO.File.Exists(c))
                    return c;
            }
            catch
            {
                // try next
            }
        }
        return null;
    }

    private static string QuoteArg(string value) =>
        "\"" + value.Replace("\"", "\\\"", StringComparison.Ordinal) + "\"";

    private static void TryDelete(string path)
    {
        try { if (System.IO.File.Exists(path)) System.IO.File.Delete(path); } catch { /* ignore */ }
    }

    private static bool LooksLikeHtml(byte[] bytes)
    {
        var sample = Encoding.UTF8.GetString(bytes, 0, Math.Min(bytes.Length, 256)).TrimStart();
        return sample.StartsWith("<!", StringComparison.OrdinalIgnoreCase) ||
               sample.StartsWith("<html", StringComparison.OrdinalIgnoreCase);
    }

    private static bool LooksLikeImage(byte[] bytes)
    {
        if (bytes.Length < 4) return false;
        if (bytes[0] == 0x89 && bytes[1] == 0x50 && bytes[2] == 0x4E && bytes[3] == 0x47) return true;
        if (bytes[0] == 0xFF && bytes[1] == 0xD8) return true;
        if (bytes[0] == 0x47 && bytes[1] == 0x49 && bytes[2] == 0x46) return true;
        if (bytes.Length > 12 && bytes[0] == 0x52 && bytes[1] == 0x49 && bytes[2] == 0x46 && bytes[3] == 0x46) return true;
        var head = Encoding.UTF8.GetString(bytes, 0, Math.Min(bytes.Length, 128));
        return head.Contains("<svg", StringComparison.OrdinalIgnoreCase);
    }

    private static string? ExtractPreviewImageUrl(string html)
    {
        var fromMeta = ExtractOgImage(html);
        if (!string.IsNullOrWhiteSpace(fromMeta))
            return fromMeta;

        // Canva often embeds CDN preview URLs in page JSON even when meta tags are sparse.
        var cdn = Regex.Match(
            html,
            @"https:\\?/\\?/[^""'\s<>]*(?:media-public|media-private|document-export)[^""'\s<>]*\.(?:png|jpe?g|webp)",
            RegexOptions.IgnoreCase);
        if (cdn.Success)
            return Regex.Unescape(cdn.Value).Replace("\\/", "/", StringComparison.Ordinal);

        var anyCanvaMedia = Regex.Match(
            html,
            @"https:\\?/\\?/media[-.][^""'\s<>]+\.(?:png|jpe?g|webp)",
            RegexOptions.IgnoreCase);
        if (anyCanvaMedia.Success)
            return Regex.Unescape(anyCanvaMedia.Value).Replace("\\/", "/", StringComparison.Ordinal);

        return null;
    }

    private static string? ExtractOgImage(string html)
    {
        var patterns = new[]
        {
            @"<meta[^>]+property=[""']og:image:secure_url[""'][^>]+content=[""']([^""']+)[""']",
            @"<meta[^>]+content=[""']([^""']+)[""'][^>]+property=[""']og:image:secure_url[""']",
            @"<meta[^>]+property=[""']og:image[""'][^>]+content=[""']([^""']+)[""']",
            @"<meta[^>]+content=[""']([^""']+)[""'][^>]+property=[""']og:image[""']",
            @"<meta[^>]+name=[""']twitter:image[""'][^>]+content=[""']([^""']+)[""']",
            @"<meta[^>]+content=[""']([^""']+)[""'][^>]+name=[""']twitter:image[""']",
        };
        foreach (var pattern in patterns)
        {
            var m = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
            if (m.Success && !string.IsNullOrWhiteSpace(m.Groups[1].Value))
                return WebUtility.HtmlDecode(m.Groups[1].Value.Trim());
        }
        return null;
    }

    private static string ExtFromContentType(string contentType)
    {
        if (contentType.Contains("jpeg", StringComparison.OrdinalIgnoreCase) || contentType.Contains("jpg", StringComparison.OrdinalIgnoreCase)) return ".jpg";
        if (contentType.Contains("webp", StringComparison.OrdinalIgnoreCase)) return ".webp";
        if (contentType.Contains("gif", StringComparison.OrdinalIgnoreCase)) return ".gif";
        if (contentType.Contains("svg", StringComparison.OrdinalIgnoreCase)) return ".svg";
        return ".png";
    }

    private static string EnsureExtension(string name, string ext)
    {
        if (name.EndsWith(ext, StringComparison.OrdinalIgnoreCase)) return name;
        if (Path.HasExtension(name)) return name;
        return name + ext;
    }
}

public record ImportFromUrlRequest(string Url, string? FileName = null, string? Category = null);
