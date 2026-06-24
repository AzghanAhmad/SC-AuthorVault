namespace AuthorVault.Api.Data;

public static class SeedData
{
    private static string ReadSeed(string fileName)
    {
        var path = Path.Combine(AppContext.BaseDirectory, "Data", "Seeds", fileName);
        if (!File.Exists(path))
        {
            path = Path.Combine(Directory.GetCurrentDirectory(), "Data", "Seeds", fileName);
        }
        return File.Exists(path) ? File.ReadAllText(path) : "{}";
    }

    public static string DefaultCompanyJson => ReadSeed("company.json");
    public static string DefaultVaultExtrasJson => ReadSeed("vault-extras.json");
    public static string DefaultImportantDatesJson => ReadSeed("important-dates.json");
    public static string DefaultBooksJson => ReadSeed("books.json");
    public static string DefaultSettingsJson => ReadSeed("settings.json");
}
