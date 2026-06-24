namespace AuthorVault.Api.Options;

public class JwtOptions
{
    public const string SectionName = "Jwt";
    public string Key { get; set; } = "AuthorVault-Dev-Secret-Key-Change-In-Production-32chars!";
    public string Issuer { get; set; } = "AuthorVault.Api";
    public string Audience { get; set; } = "AuthorVault.App";
    public int ExpiryMinutes { get; set; } = 10080;
}
