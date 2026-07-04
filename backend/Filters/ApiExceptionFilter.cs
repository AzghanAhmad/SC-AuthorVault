using AuthorVault.Api.Middleware;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AuthorVault.Api.Filters;

public class ApiExceptionFilter(ILogger<ApiExceptionFilter> logger) : IExceptionFilter
{
    public void OnException(ExceptionContext context)
    {
        if (!context.HttpContext.Request.Path.StartsWithSegments("/api"))
            return;

        logger.LogError(context.Exception, "API error on {Method} {Path}",
            context.HttpContext.Request.Method, context.HttpContext.Request.Path);

        var (statusCode, message) = ApiExceptionMiddleware.MapException(context.Exception);
        context.Result = new ObjectResult(new { message }) { StatusCode = statusCode };
        context.ExceptionHandled = true;
    }
}
