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
    /// Creates the database (if needed) and applies pending EF Core migrations.
    /// </summary>
    public static async Task MigrateAsync(AppDbContext db, string connectionString, ILogger logger, CancellationToken ct = default)
    {
        await EnsureDatabaseExistsAsync(connectionString, ct);
        var pending = (await db.Database.GetPendingMigrationsAsync(ct)).ToList();
        if (pending.Count > 0)
            logger.LogInformation("Applying {Count} database migration(s): {Migrations}", pending.Count, string.Join(", ", pending));

        await db.Database.MigrateAsync(ct);
        logger.LogInformation("Database schema is up to date.");
    }
}
