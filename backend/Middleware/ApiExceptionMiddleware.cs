using Microsoft.EntityFrameworkCore;
using MySqlConnector;

namespace AuthorVault.Api.Middleware;

public class ApiExceptionMiddleware(RequestDelegate next, ILogger<ApiExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        if (!context.Request.Path.StartsWithSegments("/api"))
        {
            await next(context);
            return;
        }

        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "API error on {Method} {Path}", context.Request.Method, context.Request.Path);
            await WriteJsonErrorAsync(context, ex);
        }
    }

    internal static (int StatusCode, string Message) MapException(Exception ex)
    {
        for (var current = ex; current is not null; current = current.InnerException)
        {
            if (current is MySqlException mysqlEx)
            {
                if (mysqlEx.Message.Contains("doesn't exist", StringComparison.OrdinalIgnoreCase)
                    || mysqlEx.Number == 1146)
                {
                    return (StatusCodes.Status503ServiceUnavailable,
                        "The database schema is not set up yet. Restart the API so migrations can run, or run: dotnet ef database update --project backend/AuthorVault.Api.csproj");
                }

                if (mysqlEx.Message.Contains("Unable to connect", StringComparison.OrdinalIgnoreCase)
                    || mysqlEx.Message.Contains("Connect Timeout", StringComparison.OrdinalIgnoreCase))
                {
                    return (StatusCodes.Status503ServiceUnavailable,
                        "We couldn't connect to the database. Please try again in a moment. If you're running locally, start MySQL (XAMPP) and restart the API.");
                }
            }

            if (current is InvalidOperationException
                && (current.Message.Contains("transient failure", StringComparison.OrdinalIgnoreCase)
                    || current.Message.Contains("Unable to connect", StringComparison.OrdinalIgnoreCase)))
            {
                return (StatusCodes.Status503ServiceUnavailable,
                    "We couldn't connect to the database. Please try again in a moment. If you're running locally, start MySQL (XAMPP) and restart the API.");
            }
        }

        if (ex is UnauthorizedAccessException)
            return (StatusCodes.Status401Unauthorized, "You are not authorized to perform this action.");

        return (StatusCodes.Status500InternalServerError,
            "Something went wrong. Please try again.");
    }

    private static async Task WriteJsonErrorAsync(HttpContext context, Exception ex)
    {
        if (context.Response.HasStarted)
            throw ex;

        var (statusCode, message) = MapException(ex);
        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message });
    }
}
