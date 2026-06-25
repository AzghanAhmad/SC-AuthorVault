namespace AuthorVault.Api.Configuration;

public static class ConnectionStringResolver
{
    public static string Resolve(IConfiguration configuration)
    {
        LogAvailableDatabaseKeys(configuration);

        // 1. Explicit ASP.NET connection string (env: ConnectionStrings__Default)
        var fromConfig = configuration.GetConnectionString("Default")
            ?? configuration["ConnectionStrings:Default"]
            ?? Env(configuration, "ConnectionStrings__Default");
        if (IsUsableConnectionString(fromConfig))
        {
            Console.WriteLine("[DB] Using ConnectionStrings__Default");
            return NormalizeAdoNet(fromConfig!);
        }

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
            {
                Console.WriteLine($"[DB] Using {key}");
                return parsed;
            }
        }

        // 3. Individual MySQL components (MYSQLHOST + MYSQLPASSWORD, etc.)
        var host = Env(configuration,
            "MYSQLHOST", "MYSQL_HOST", "MYSQL_HOSTNAME",
            "DB_HOST", "DATABASE_HOST", "RAILWAY_MYSQL_HOST");
        var password = Env(configuration, "MYSQLPASSWORD", "MYSQL_PASSWORD", "DB_PASSWORD");

        if (!string.IsNullOrWhiteSpace(host))
        {
            var port = Env(configuration, "MYSQLPORT", "MYSQL_PORT", "DB_PORT", "RAILWAY_MYSQL_PORT") ?? "3306";
            var user = Env(configuration, "MYSQLUSER", "MYSQL_USER", "DB_USER", "RAILWAY_MYSQL_USER") ?? "root";
            password ??= "";
            var database = Env(configuration, "MYSQLDATABASE", "MYSQL_DATABASE", "DB_DATABASE", "DB_NAME", "RAILWAY_MYSQL_DATABASE") ?? "railway";

            Console.WriteLine($"[DB] Using MYSQLHOST={host}");
            return BuildMySqlConnectionString(host, port, user, password, database);
        }

        // 4. Password only — set MYSQLPASSWORD on the Railway *web* service (host defaults from RAILWAY_MYSQL_*)
        if (!string.IsNullOrWhiteSpace(password))
        {
            host = Env(configuration, "RAILWAY_MYSQL_HOST") ?? "thomas.proxy.rlwy.net";
            var port = Env(configuration, "RAILWAY_MYSQL_PORT") ?? "30264";
            var user = Env(configuration, "RAILWAY_MYSQL_USER") ?? "root";
            var database = Env(configuration, "RAILWAY_MYSQL_DATABASE") ?? "railway";

            Console.WriteLine($"[DB] Using MYSQLPASSWORD with host {host} (set RAILWAY_MYSQL_HOST to override)");
            return BuildMySqlConnectionString(host, port, user, password, database);
        }

        throw new InvalidOperationException(
            "No database connection configured on this Railway web service. " +
            "Quickest fix — add these Variables on the WEB service (not MySQL): " +
            "MYSQLPASSWORD=<your-mysql-password>, Jwt__Key=<32+ char secret>, ASPNETCORE_ENVIRONMENT=Production. " +
            "Optional: RAILWAY_MYSQL_HOST, RAILWAY_MYSQL_PORT (defaults: thomas.proxy.rlwy.net / 30264). " +
            "Or reference MYSQL_URL from your MySQL service. See DEPLOY.md.");
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
        if (value.StartsWith("mysql://", StringComparison.OrdinalIgnoreCase))
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
