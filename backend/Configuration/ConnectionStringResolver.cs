namespace AuthorVault.Api.Configuration;

public static class ConnectionStringResolver
{
    private static readonly string[] DatabaseUrlKeys =
    [
        "MYSQL_URL", "MYSQL_PRIVATE_URL", "MYSQL_PUBLIC_URL",
        "DATABASE_URL", "DATABASE_PRIVATE_URL", "DATABASE_PUBLIC_URL",
    ];

    public static string Resolve(IConfiguration configuration)
    {
        LogAvailableDatabaseKeys(configuration);

        // 1. Cloud database URLs (Railway, etc.) — highest priority
        foreach (var key in DatabaseUrlKeys)
        {
            var url = Env(configuration, key);
            var parsed = ParseDatabaseUrl(url) ?? ParseAdoNetString(url);
            if (parsed is not null)
            {
                Console.WriteLine($"[DB] Using {key}");
                return parsed;
            }
        }

        // 2. Explicit env connection string (set by docker-entrypoint or Railway variables)
        var fromEnv = Environment.GetEnvironmentVariable("ConnectionStrings__Default");
        if (IsUsableConnectionString(fromEnv))
        {
            Console.WriteLine("[DB] Using ConnectionStrings__Default (environment)");
            return NormalizeAdoNet(fromEnv!);
        }

        // 3. Individual MySQL components (MYSQLHOST + MYSQLPASSWORD, etc.)
        var host = Env(configuration,
            "MYSQLHOST", "MYSQL_HOST", "MYSQL_HOSTNAME",
            "DB_HOST", "DATABASE_HOST", "RAILWAY_MYSQL_HOST");
        var password = Env(configuration, "MYSQLPASSWORD", "MYSQL_PASSWORD", "DB_PASSWORD");
        var user = Env(configuration, "MYSQLUSER", "MYSQL_USER", "DB_USER", "RAILWAY_MYSQL_USER");
        var port = Env(configuration, "MYSQLPORT", "MYSQL_PORT", "DB_PORT", "RAILWAY_MYSQL_PORT");
        var database = Env(configuration, "MYSQLDATABASE", "MYSQL_DATABASE", "DB_DATABASE", "DB_NAME", "RAILWAY_MYSQL_DATABASE");

        if (!string.IsNullOrWhiteSpace(host))
        {
            Console.WriteLine($"[DB] Using MYSQLHOST={host}");
            return BuildMySqlConnectionString(
                host,
                port ?? "3306",
                user ?? "root",
                password ?? "",
                database ?? "railway");
        }

        // 4. appsettings / config fallback (local dev, docker-compose)
        var fromConfig = configuration.GetConnectionString("Default")
            ?? configuration["ConnectionStrings:Default"];
        if (IsUsableConnectionString(fromConfig))
        {
            Console.WriteLine("[DB] Using ConnectionStrings:Default (config file)");
            return NormalizeAdoNet(fromConfig!);
        }

        // 5. Password only — require explicit host (no baked-in Railway host)
        if (!string.IsNullOrWhiteSpace(password))
        {
            host = Env(configuration, "RAILWAY_MYSQL_HOST");
            if (string.IsNullOrWhiteSpace(host))
            {
                throw new InvalidOperationException(
                    "MYSQLPASSWORD is set but no database host was found. " +
                    "Add MYSQL_URL (recommended: ${{YourMySqlService.MYSQL_URL}} on the web service), " +
                    "or set MYSQLHOST / RAILWAY_MYSQL_HOST with the host from Railway → MySQL → Connect.");
            }

            Console.WriteLine($"[DB] Using MYSQLPASSWORD with host {host}");
            return BuildMySqlConnectionString(
                host,
                port ?? Env(configuration, "RAILWAY_MYSQL_PORT") ?? "3306",
                user ?? Env(configuration, "RAILWAY_MYSQL_USER") ?? "root",
                password,
                database ?? Env(configuration, "RAILWAY_MYSQL_DATABASE") ?? "railway");
        }

        throw new InvalidOperationException(
            "No database connection configured. On Railway, add this to the WEB service (not MySQL): " +
            "MYSQL_URL=${{YourMySqlServiceName.MYSQL_URL}} " +
            "(or MYSQL_PRIVATE_URL for private networking). " +
            "Also set Jwt__Key and ASPNETCORE_ENVIRONMENT=Production. See DEPLOY.md.");
    }

    private static void LogAvailableDatabaseKeys(IConfiguration configuration)
    {
        var keys = new SortedSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var child in configuration.AsEnumerable())
        {
            if (child.Key.Contains("MYSQL", StringComparison.OrdinalIgnoreCase)
                || child.Key.Contains("DATABASE", StringComparison.OrdinalIgnoreCase)
                || child.Key.Contains("ConnectionStrings", StringComparison.OrdinalIgnoreCase)
                || child.Key.StartsWith("RAILWAY_MYSQL", StringComparison.OrdinalIgnoreCase))
            {
                if (!string.IsNullOrWhiteSpace(child.Value))
                    keys.Add(child.Key);
            }
        }

        foreach (var key in Environment.GetEnvironmentVariables().Keys)
        {
            var name = key.ToString() ?? "";
            if (name.Contains("MYSQL", StringComparison.OrdinalIgnoreCase)
                || name.Contains("DATABASE", StringComparison.OrdinalIgnoreCase)
                || name.Contains("ConnectionStrings", StringComparison.OrdinalIgnoreCase)
                || name.StartsWith("RAILWAY_MYSQL", StringComparison.OrdinalIgnoreCase))
            {
                keys.Add(name);
            }
        }

        if (keys.Count == 0)
            Console.WriteLine("[DB] No MYSQL/DATABASE/ConnectionStrings env vars found on this service.");
        else
            Console.WriteLine("[DB] Env keys present: " + string.Join(", ", keys));
    }

    private static string? Env(IConfiguration configuration, params string[] keys)
    {
        foreach (var key in keys)
        {
            var value = configuration[key] ?? Environment.GetEnvironmentVariable(key);
            if (string.IsNullOrWhiteSpace(value))
                continue;

            value = value.Trim();
            if (value.Contains("${{", StringComparison.Ordinal))
            {
                Console.WriteLine($"[DB] Skipping unresolved Railway reference for {key}");
                continue;
            }

            return value;
        }
        return null;
    }

    private static bool IsUsableConnectionString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value) || value.Contains("${{", StringComparison.Ordinal))
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

    private static string NormalizeAdoNet(string value)
    {
        if (value.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase)
            || value.StartsWith("mysql2://", StringComparison.OrdinalIgnoreCase))
            return ParseDatabaseUrl(value) ?? value;

        return value.Contains("SslMode=", StringComparison.OrdinalIgnoreCase)
            ? value
            : $"{value.TrimEnd(';')};SslMode={SslModeForHost(ExtractHost(value))};";
    }

    private static string? ParseAdoNetString(string? value)
    {
        if (string.IsNullOrWhiteSpace(value))
            return null;
        if (!value.StartsWith("Server=", StringComparison.OrdinalIgnoreCase))
            return null;
        return NormalizeAdoNet(value);
    }

    private static string? ParseDatabaseUrl(string? databaseUrl)
    {
        if (string.IsNullOrWhiteSpace(databaseUrl) || databaseUrl.Contains("${{", StringComparison.Ordinal))
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

        return BuildMySqlConnectionString(uri.Host, uri.Port > 0 ? uri.Port.ToString() : "3306", user, password, database);
    }

    private static string BuildMySqlConnectionString(
        string host, string port, string user, string password, string database)
    {
        var ssl = SslModeForHost(host);
        return $"Server={host};Port={port};Database={database};User={user};Password={password};SslMode={ssl};";
    }

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
