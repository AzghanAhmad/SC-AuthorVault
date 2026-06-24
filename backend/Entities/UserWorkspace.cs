namespace AuthorVault.Api.Entities;

public class UserWorkspace
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string CompanyJson { get; set; } = "{}";
    public string VaultExtrasJson { get; set; } = "{}";
    public string ImportantDatesJson { get; set; } = "[]";
    public string BooksJson { get; set; } = "[]";
    public string SettingsJson { get; set; } = "{}";

    public string? PinHash { get; set; }
    public DateTime? PinLastActivityUtc { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
