using System.Security.Claims;
using Compix.Api.Contracts.Asignaciones;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/asignaciones")]
[Authorize]
public sealed class AsignacionesController(IAsignacionesService asignacionesService) : ControllerBase
{
    /// <summary>Lista las asignaciones que todavía no se han devuelto.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<AsignacionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AsignacionResponse>>> ListarActivas(
        CancellationToken cancellationToken) =>
        Ok(await asignacionesService.ListarActivasAsync(cancellationToken));

    /// <summary>Consulta las asignaciones actuales y pasadas.</summary>
    [HttpGet("historial")]
    [ProducesResponseType<IReadOnlyList<AsignacionResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<AsignacionResponse>>> ListarHistorial(
        CancellationToken cancellationToken) =>
        Ok(await asignacionesService.ListarHistorialAsync(cancellationToken));

    /// <summary>Asigna un equipo disponible a un empleado activo.</summary>
    [HttpPost("asignar")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Asignar(
        AsignarEquipoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var (resultado, id) = await asignacionesService.AsignarAsync(
            request,
            idUsuario,
            cancellationToken);
        if (resultado == ResultadoOperacion.NoEncontrado)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Equipo o empleado no encontrado."
            });
        }

        if (resultado == ResultadoOperacion.Conflicto)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "No se puede asignar el equipo.",
                Detail = "El equipo no está disponible o el empleado está inactivo."
            });
        }

        return CreatedAtAction(nameof(ListarHistorial), new { }, new { IdAsignacion = id });
    }

    /// <summary>Transfiere una asignación vigente a otro empleado en una operación atómica.</summary>
    [HttpPost("reasignar")]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Reasignar(
        ReasignarEquipoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var (resultado, id) = await asignacionesService.ReasignarAsync(
            request,
            idUsuario,
            cancellationToken);
        if (resultado == ResultadoOperacion.NoEncontrado)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Equipo o empleado no encontrado."
            });
        }

        if (resultado == ResultadoOperacion.Conflicto)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "No se puede reasignar el equipo.",
                Detail = "El equipo no tiene una asignación activa, no está en estado Activo o el empleado destino no es válido."
            });
        }

        return CreatedAtAction(nameof(ListarHistorial), new { }, new { IdAsignacion = id });
    }

    /// <summary>Registra la devolución de una asignación activa y libera el equipo.</summary>
    [HttpPut("{id:int}/devolver")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Devolver(
        int id,
        [FromBody] DevolverAsignacionRequest? request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var resultado = await asignacionesService.DevolverAsync(
            id,
            request?.ObservacionesDevolucion,
            idUsuario,
            cancellationToken);
        return resultado switch
        {
            ResultadoOperacion.Exito => NoContent(),
            ResultadoOperacion.NoEncontrado => NotFound(),
            _ => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "La asignación ya fue devuelta o el equipo no está en estado Activo."
            })
        };
    }
}
