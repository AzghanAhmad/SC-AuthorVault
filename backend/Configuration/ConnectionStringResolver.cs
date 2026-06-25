namespace AuthorVault.Api.Configuration;

public static class ConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration)
    {
        // 1. Explicit ASP.NET connection string (env: ConnectionStrings__Default)
        var fromConfig = configuration.GetConnectionString("Default")
            ?? configuration["ConnectionStrings:Default"]
            ?? Env(configuration, "ConnectionStrings__Default");
        if (IsUsableConnectionString(fromConfig))
            return fromConfig!;

        // 2. Railway / cloud database URLs
        foreach (var key in new[]
        {
            "MYSQL_URL", "MYSQL_PUBLIC_URL", "MYSQL_PRIVATE_URL",
            "DATABASE_URL", "DATABASE_PRIVATE_URL", "DATABASE_PUBLIC_URL"
        })
        {
            var url = Env(configuration, key);
            var parsed = ParseDatabaseUrl(url) ?? ParseAdoNetString(url);
            if (parsed is not null)
                return parsed;
        }

        // 3. Individual MySQL components (Railway injects MYSQLHOST, MYSQLPORT, …)
        var host = Env(configuration,
            "MYSQLHOST", "MYSQL_HOST", "MYSQL_HOSTNAME",
            "DB_HOST", "DATABASE_HOST");
        if (!string.IsNullOrWhiteSpace(host))
        {
            var port = Env(configuration, "MYSQLPORT", "MYSQL_PORT", "DB_PORT") ?? "3306";
            var user = Env(configuration, "MYSQLUSER", "MYSQL_USER", "DB_USER") ?? "root";
            var password = Env(configuration, "MYSQLPASSWORD", "MYSQL_PASSWORD", "DB_PASSWORD") ?? "";
            var database = Env(configuration, "MYSQLDATABASE", "MYSQL_DATABASE", "DB_DATABASE", "DB_NAME") ?? "railway";

            return BuildMySqlConnectionString(host, port, user, password, database);
        }

        var checkedKeys = string.Join(", ", new[]
        {
            "ConnectionStrings__Default", "MYSQL_URL", "MYSQLHOST", "MYSQL_HOST"
        });

        throw new InvalidOperationException(
            "No database connection configured. On Railway: open your **web service** (not MySQL) → Variables → " +
            "add a reference variable `MYSQL_URL` = `${{MySQL.MYSQL_URL}}` (replace MySQL with your database service name), " +
            "or add MYSQLHOST / MYSQLPORT / MYSQLUSER / MYSQLPASSWORD / MYSQLDATABASE references from the MySQL service. " +
            $"Checked: {checkedKeys}.");
    }

    private static string? Env(IConfiguration configuration, params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = configuration[key] ?? Environment.GetEnvironmentVariable(key);
            if (!string.IsNullOrWhiteSpace(value))
                return value.Trim();
        }
        return null;
    }

    private static bool IsUsableConnectionString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return false;

        if (value.StartsWith("Server=", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("mysql2://", StringComparison.OrdinalIgnoreCase))
            return true;

        return !value.Contains("localhost", StringComparison.OrdinalIgnoreCase)
               || string.Equals(
                   Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                   "Development",
                   StringComparison.OrdinalIgnoreCase);
    }

    private static string? ParseAdoNetString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        if (!value.StartsWith("Server=", StringComparison.OrdinalIgnoreCase))
            return null;
        return value.Contains("SslMode=", StringComparison.OrdinalIgnoreCase)
            ? value
            : $"{value.TrimEnd(';')};SslMode={SslModeForHost(ExtractHost(value))};";
    }

    private static string? ParseDatabaseUrl(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl))
            return null;

        var normalized = databaseUrl.Trim();
        if (normalized.StartsWith("mysql2://", StringComparison.OrdinalIgnoreCase))
            normalized = "mysql://" + normalized["mysql2://".Length..];

        if (!normalized.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase))
            return null;

        if (!Uri.TryCreate(normalized, UriKind.Absolute, out var uri))
            return null;

        var userInfo = uri.UserInfo.Split(':', 2);
        var user = userInfo.Length > 0 ? Uri.UnescapeDataString(userInfo[0]) : "root";
        var password = userInfo.Length > 1 ? Uri.UnescapeDataString(userInfo[1]) : "";
        var database = uri.AbsolutePath.TrimStart('/');
        if (string.IsNullOrWhiteSpace(database))
            database = "railway";

        var host = uri.Host;
        var port = uri.Port > 0 ? uri.Port.ToString() : "3306";

        return BuildMySqlConnectionString(host, port, user, password, database);
    }

    private static string BuildMySqlConnectionString(
        string host, string port, string user, string password, string database)
    {
        var ssl = SslModeForHost(host);
        return $"Server={host};Port={port};Database={database};User={user};Password={password};SslMode={ssl};";
    }

    /// <summary>
    /// Railway public proxy hosts need SSL; internal *.railway.internal hosts typically do not.
    /// </summary>
    private static string SslModeForHost(string host)
    {
        if (host.Contains("proxy.rlwy.net", StringComparison.OrdinalIgnoreCase)
            || host.Contains("railway.app", StringComparison.OrdinalIgnoreCase))
            return "Required";

        if (host.Contains("railway.internal", StringComparison.OrdinalIgnoreCase)
            || host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
            || host == "127.0.0.1")
            return "Preferred";

        return "Required";
    }

    private static string ExtractHost(string adoNetConnectionString)
    {
        foreach (var part in adoNetConnectionString.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var kv = part.Split('=', 2);
            if (kv.Length == 2 && kv[0].Trim().Equals("Server", StringComparison.OrdinalIgnoreCase))
                return kv[1].Trim();
        }
        return "";
    }
}
