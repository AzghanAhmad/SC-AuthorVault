namespace AuthorVault.Api.Configuration;

public static class ConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration)
    {
        var fromConfig = configuration.GetConnectionString("Default");
        if (IsUsableConnectionString(fromConfig))
            return fromConfig!;

        var fromUrl = ParseDatabaseUrl(
            Environment.GetEnvironmentVariable("DATABASE_URL")
            ?? Environment.GetEnvironmentVariable("MYSQL_URL"));
        if (fromUrl is not null)
            return fromUrl;

        var host = Environment.GetEnvironmentVariable("MYSQLHOST")
                   ?? Environment.GetEnvironmentVariable("MYSQL_HOST");
        if (!string.IsNullOrWhiteSpace(host))
        {
            var port = Environment.GetEnvironmentVariable("MYSQLPORT")
                       ?? Environment.GetEnvironmentVariable("MYSQL_PORT")
                       ?? "3306";
            var user = Environment.GetEnvironmentVariable("MYSQLUSER")
                       ?? Environment.GetEnvironmentVariable("MYSQL_USER")
                       ?? "root";
            var password = Environment.GetEnvironmentVariable("MYSQLPASSWORD")
                           ?? Environment.GetEnvironmentVariable("MYSQL_PASSWORD")
                           ?? "";
            var database = Environment.GetEnvironmentVariable("MYSQLDATABASE")
                           ?? Environment.GetEnvironmentVariable("MYSQL_DATABASE")
                           ?? "railway";

            return $"Server={host};Port={port};Database={database};User={user};Password={password};SslMode=Required;";
        }

        if (!string.IsNullOrWhiteSpace(fromConfig))
            return fromConfig;

        throw new InvalidOperationException(
            "No database connection configured. Set ConnectionStrings__Default or link a MySQL service on Railway.");
    }

    private static bool IsUsableConnectionString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        return !value.Contains("localhost", StringComparison.OrdinalIgnoreCase)
               || Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development";
    }

    private static string? ParseDatabaseUrl(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl))
            return null;

        if (!Uri.TryCreate(databaseUrl, UriKind.Absolute, out var uri))
            return null;

        var userInfo = uri.UserInfo.Split(':', 2);
        var user = Uri.UnescapeDataString(userInfo[0]);
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = uri.AbsolutePath.TrimStart('/');
        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port : 3306;

        return $"Server={host};Port={port};Database={database};User={user};Password={password};SslMode=Required;";
    }
}
