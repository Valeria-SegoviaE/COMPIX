using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using MySqlConnector;

namespace Compix.Api.Middleware;

public sealed class MySqlConflictExceptionHandler(ILogger<MySqlConflictExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        if (exception is not MySqlException databaseException)
        {
            return false;
        }

        var (statusCode, title, detail) = databaseException.Number switch
        {
            1062 => (
                StatusCodes.Status409Conflict,
                "Conflicto",
                "Ya existe un registro con uno de los valores únicos proporcionados."),
            1452 => (
                StatusCodes.Status400BadRequest,
                "Referencia inválida",
                "Uno de los registros relacionados no existe."),
            _ => (0, string.Empty, string.Empty)
        };

        if (statusCode == 0)
        {
            return false;
        }

        logger.LogWarning(databaseException, "A database constraint was violated.");
        httpContext.Response.StatusCode = statusCode;
        await httpContext.Response.WriteAsJsonAsync(new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Instance = httpContext.Request.Path
        }, cancellationToken);
        return true;
    }
}
