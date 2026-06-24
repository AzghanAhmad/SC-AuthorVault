using Amazon;
using Amazon.S3;
using Amazon.S3.Model;
using AuthorVault.Api.Options;
using Microsoft.Extensions.Options;

namespace AuthorVault.Api.Services;

public interface IFileStorageService
{
    Task<(string Key, string Url)> UploadAsync(int userId, string category, string fileName, string contentType, Stream stream, CancellationToken ct = default);
    bool IsConfigured { get; }
}

public class S3FileStorageService : IFileStorageService, IDisposable
{
    private readonly AwsOptions _opts;
    private readonly IAmazonS3? _client;

    public S3FileStorageService(IOptions<AwsOptions> options)
    {
        _opts = options.Value;
        if (!IsConfigured) return;

        var config = new AmazonS3Config
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_opts.Region)
        };
        if (!string.IsNullOrWhiteSpace(_opts.ServiceUrl))
        {
            config.ServiceURL = _opts.ServiceUrl;
            config.ForcePathStyle = true;
        }

        _client = new AmazonS3Client(_opts.AccessKeyId, _opts.SecretAccessKey, config);
    }

    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(_opts.AccessKeyId) &&
        !string.IsNullOrWhiteSpace(_opts.SecretAccessKey) &&
        !string.IsNullOrWhiteSpace(_opts.S3BucketName);

    public async Task<(string Key, string Url)> UploadAsync(
        int userId, string category, string fileName, string contentType, Stream stream, CancellationToken ct = default)
    {
        if (_client is null || !IsConfigured)
            throw new InvalidOperationException("AWS S3 is not configured. Set AWS credentials in appsettings or environment variables.");

        var safeName = Path.GetFileName(fileName).Replace(" ", "-");
        var key = $"users/{userId}/{category}/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid():N}-{safeName}";

        var request = new PutObjectRequest
        {
            BucketName = _opts.S3BucketName,
            Key = key,
            InputStream = stream,
            ContentType = contentType,
            AutoCloseStream = false
        };

        await _client.PutObjectAsync(request, ct);

        var url = string.IsNullOrWhiteSpace(_opts.ServiceUrl)
            ? $"https://{_opts.S3BucketName}.s3.{_opts.Region}.amazonaws.com/{key}"
            : $"{_opts.ServiceUrl.TrimEnd('/')}/{_opts.S3BucketName}/{key}";

        return (key, url);
    }

    public void Dispose() => _client?.Dispose();
}

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _root;
    private readonly IWebHostEnvironment _env;

    public LocalFileStorageService(IWebHostEnvironment env)
    {
        _env = env;
        _root = Path.Combine(env.ContentRootPath, "uploads");
        Directory.CreateDirectory(_root);
    }

    public bool IsConfigured => true;

    public async Task<(string Key, string Url)> UploadAsync(
        int userId, string category, string fileName, string contentType, Stream stream, CancellationToken ct = default)
    {
        var safeName = Path.GetFileName(fileName).Replace(" ", "-");
        var relative = Path.Combine("users", userId.ToString(), category, $"{Guid.NewGuid():N}-{safeName}");
        var fullPath = Path.Combine(_root, relative);
        Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

        await using var fs = File.Create(fullPath);
        await stream.CopyToAsync(fs, ct);

        var key = relative.Replace('\\', '/');
        var url = $"/uploads/{key}";
        return (key, url);
    }
}
