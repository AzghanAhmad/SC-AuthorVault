using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace AuthorVault.Api.Data;

public static class DatabaseInitializer
{
    /// <summary>
    /// Creates the MySQL database if it does not exist (XAMPP-friendly).
    /// </summary>
    public static async Task EnsureDatabaseExistsAsync(string connectionString, CancellationToken ct = default)
    {
        var builder = new MySqlConnectionStringBuilder(connectionString);
        var databaseName = builder.Database;
        if (string.IsNullOrWhiteSpace(databaseName))
            return;

        builder.Database = string.Empty;

        await using var connection = new MySqlConnection(builder.ConnectionString);
        await connection.OpenAsync(ct);

        await using var command = connection.CreateCommand();
        command.CommandText =
            $"CREATE DATABASE IF NOT EXISTS `{databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
        await command.ExecuteNonQueryAsync(ct);
    }

    /// <summary>
    /// Drops and recreates schema, then applies migrations. Safe for local XAMPP repair.
    /// </summary>
    public static async Task RepairDatabaseAsync(
        AppDbContext db,
        string connectionString,
        ILogger logger,
        CancellationToken ct = default)
    {
        await EnsureDatabaseExistsAsync(connectionString, ct);
        await ClearSchemaAsync(connectionString, logger, ct);
        await db.Database.CloseConnectionAsync();
        await ApplyMigrationsAsync(db, logger, ct);
    }

    /// <summary>
    /// Creates the database (if needed) and applies pending EF Core migrations.
    /// In development, clears a corrupted local schema once and retries.
    /// </summary>
    public static async Task MigrateAsync(
        AppDbContext db,
        string connectionString,
        ILogger logger,
        bool allowRepair = false,
        CancellationToken ct = default)
    {
        if (ShouldEnsureDatabaseExists(connectionString))
            await EnsureDatabaseExistsAsync(connectionString, ct);

        try
        {
            await ApplyMigrationsAsync(db, logger, ct);
        }
        catch (Exception ex) when (allowRepair && ShouldRecreateLocalDatabase(ex))
        {
            logger.LogWarning(ex, "Local database schema is missing or corrupted (common with XAMPP). Repairing schema...");
            await ClearSchemaAsync(connectionString, logger, ct);
            await db.Database.CloseConnectionAsync();
            await ApplyMigrationsAsync(db, logger, ct);
        }
    }

    private static bool ShouldEnsureDatabaseExists(string connectionString)
    {
        var builder = new MySqlConnectionStringBuilder(connectionString);
        var host = builder.Server?.Trim() ?? "";
        return host.Equals("localhost", StringComparison.OrdinalIgnoreCase)
               || host == "127.0.0.1"
               || host.Equals("mysql", StringComparison.OrdinalIgnoreCase);
    }

    private static async Task ApplyMigrationsAsync(AppDbContext db, ILogger logger, CancellationToken ct)
    {
        var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
        if (pending.Count > 0)
            logger.LogInformation("Applying {Count} database migration(s): {Migrations}", pending.Count, string.Join(", ", pending));

        await db.Database.MigrateAsync(ct);
        logger.LogInformation("Database schema is up to date.");
    }

    private static async Task ClearSchemaAsync(string connectionString, ILogger logger, CancellationToken ct)
    {
        var builder = new MySqlConnectionStringBuilder(connectionString);
        var databaseName = builder.Database;
        if (string.IsNullOrWhiteSpace(databaseName))
            throw new InvalidOperationException("Cannot clear schema: connection string has no database name.");

        builder.Database = string.Empty;

        await using var serverConnection = new MySqlConnection(builder.ConnectionString);
        await serverConnection.OpenAsync(ct);

        await using (var dropDb = serverConnection.CreateCommand())
        {
            dropDb.CommandText = $"DROP DATABASE IF EXISTS `{databaseName}`;";
            try
            {
                await dropDb.ExecuteNonQueryAsync(ct);
            }
            catch (MySqlException ex) when (ex.Message.Contains("Directory not empty", StringComparison.OrdinalIgnoreCase))
            {
                logger.LogWarning("Could not drop database folder (XAMPP). Dropping all tables instead.");
                await DropAllTablesAsync(connectionString, ct);
                return;
            }
        }

        await using (var createDb = serverConnection.CreateCommand())
        {
            createDb.CommandText =
                $"CREATE DATABASE `{databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
            await createDb.ExecuteNonQueryAsync(ct);
        }

        logger.LogWarning("Recreated database `{Database}`.", databaseName);
    }

    private static async Task DropAllTablesAsync(string connectionString, CancellationToken ct)
    {
        await using var connection = new MySqlConnection(connectionString);
        await connection.OpenAsync(ct);

        var tables = new List<string>();
        await using (var listCmd = connection.CreateCommand())
        {
            listCmd.CommandText =
                "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE();";
            await using var reader = await listCmd.ExecuteReaderAsync(ct);
            while (await reader.ReadAsync(ct))
                tables.Add(reader.GetString(0));
        }

        await using (var fkOff = connection.CreateCommand())
        {
            fkOff.CommandText = "SET FOREIGN_KEY_CHECKS = 0;";
            await fkOff.ExecuteNonQueryAsync(ct);
        }

        foreach (var table in tables)
        {
            await using var dropCmd = connection.CreateCommand();
            dropCmd.CommandText = $"DROP TABLE IF EXISTS `{table}`;";
            try
            {
                await dropCmd.ExecuteNonQueryAsync(ct);
            }
            catch (MySqlException)
            {
                // Ignore ghost/corrupt table entries and continue.
            }
        }

        await using (var fkOn = connection.CreateCommand())
        {
            fkOn.CommandText = "SET FOREIGN_KEY_CHECKS = 1;";
            await fkOn.ExecuteNonQueryAsync(ct);
        }
    }

    private static bool ShouldRecreateLocalDatabase(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is MySqlException mysqlEx
                && mysqlEx.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
