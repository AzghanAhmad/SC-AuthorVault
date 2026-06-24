namespace AuthorVault.Api.Options;

public class AwsOptions
{
    public const string SectionName = "AWS";
    public string AccessKeyId { get; set; } = string.Empty;
    public string SecretAccessKey { get; set; } = string.Empty;
    public string Region { get; set; } = "us-east-1";
    public string S3BucketName { get; set; } = string.Empty;
    public string? ServiceUrl { get; set; }
}
