using System.Security.Claims;
using Compix.Api.Contracts.Mantenimientos;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/mantenimientos")]
[Authorize]
public sealed class MantenimientosController(IMantenimientosService mantenimientosService)
    : ControllerBase
{
    /// <summary>Lista los equipos que tienen un mantenimiento sin cerrar.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<MantenimientoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<MantenimientoResponse>>> ListarAbiertos(
        CancellationToken cancellationToken) =>
        Ok(await mantenimientosService.ListarAbiertosAsync(cancellationToken));

    /// <summary>Consulta el historial de mantenimientos de un equipo.</summary>
    [HttpGet("equipo/{id:int}")]
    [ProducesResponseType<IReadOnlyList<MantenimientoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<MantenimientoResponse>>> ListarPorEquipo(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await mantenimientosService.ListarPorEquipoAsync(id, cancellationToken);
        return result.ExisteEquipo ? Ok(result.Mantenimientos) : NotFound();
    }

    /// <summary>Ingresa un equipo a mantenimiento y registra el movimiento.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Crear(
        CrearMantenimientoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var (resultado, id) = await mantenimientosService.CrearAsync(
            request,
            idUsuario,
            cancellationToken);
        if (resultado == ResultadoOperacion.NoEncontrado)
        {
            return NotFound();
        }

        if (resultado == ResultadoOperacion.Conflicto)
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "No se puede ingresar el equipo a mantenimiento.",
                Detail = "El equipo ya está en mantenimiento o fue dado de baja."
            });
        }

        return CreatedAtAction(
            nameof(ListarPorEquipo),
            new { id = request.IdEquipo },
            new { IdMantenimiento = id });
    }

    /// <summary>Cierra un mantenimiento, guarda la solución y libera el equipo.</summary>
    [HttpPut("{id:int}/cerrar")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Cerrar(
        int id,
        CerrarMantenimientoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var resultado = await mantenimientosService.CerrarAsync(
            id,
            request.SolucionAplicada,
            idUsuario,
            cancellationToken);
        return resultado switch
        {
            ResultadoOperacion.Exito => NoContent(),
            ResultadoOperacion.NoEncontrado => NotFound(),
            _ => Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "El mantenimiento ya fue cerrado o el equipo ya no está en mantenimiento."
            })
        };
    }
}
