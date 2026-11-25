using System.Security.Claims;
using Compix.Api.Contracts.Equipos;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/equipos")]
[Authorize]
public sealed class EquiposController(IEquipoService equipoService) : ControllerBase
{
    /// <summary>Lista equipos con filtros opcionales por estado, tipo, marca y búsqueda.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EquipoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EquipoResponse>>> ObtenerTodos(
        [FromQuery] string? estado,
        [FromQuery] string? tipo,
        [FromQuery] string? marca,
        [FromQuery] string? busqueda,
        CancellationToken cancellationToken)
    {
        var equipos = await equipoService.ObtenerTodosAsync(
            estado,
            tipo,
            marca,
            busqueda,
            cancellationToken);
        return Ok(equipos);
    }

    /// <summary>Busca un equipo por número de serie o código de inventario.</summary>
    [HttpGet("codigo/{codigo}")]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EquipoResponse>> ObtenerPorCodigo(
        string codigo,
        CancellationToken cancellationToken)
    {
        var equipo = await equipoService.ObtenerPorCodigoAsync(codigo, cancellationToken);
        return equipo is null ? NotFound() : Ok(equipo);
    }

    /// <summary>Consulta las especificaciones técnicas de un equipo.</summary>
    [HttpGet("{id:int}", Name = nameof(ObtenerPorId))]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EquipoResponse>> ObtenerPorId(
        int id,
        CancellationToken cancellationToken)
    {
        var equipo = await equipoService.ObtenerPorIdAsync(id, cancellationToken);
        return equipo is null ? NotFound() : Ok(equipo);
    }

    /// <summary>Registra un equipo y crea su movimiento inicial en el historial.</summary>
    [HttpPost]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EquipoResponse>> Crear(
        EquipoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var id = await equipoService.CrearAsync(request, idUsuario, cancellationToken);
        var equipo = await equipoService.ObtenerPorIdAsync(id, cancellationToken);

        if (equipo is null)
        {
            throw new InvalidOperationException($"No se encontró el equipo {id} después de registrarlo.");
        }

        return CreatedAtAction(nameof(ObtenerPorId), new { id }, equipo);
    }

    /// <summary>Actualiza las especificaciones técnicas de un equipo.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<EquipoResponse>> Actualizar(
        int id,
        EquipoRequest request,
        CancellationToken cancellationToken)
    {
        var equipo = await equipoService.ActualizarAsync(id, request, cancellationToken);
        return equipo is null ? NotFound() : Ok(equipo);
    }

    /// <summary>Cambia el estado operativo y registra el movimiento en el historial.</summary>
    [HttpPatch("{id:int}/estado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarEstado(
        int id,
        CambiarEstadoEquipoRequest request,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var exists = await equipoService.CambiarEstadoAsync(
            id,
            request.EstadoOperativo,
            idUsuario,
            cancellationToken);
        return exists ? NoContent() : NotFound();
    }

    /// <summary>Da de baja lógica a un equipo y registra el movimiento en el historial.</summary>
    [HttpDelete("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DarDeBaja(
        int id,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var exists = await equipoService.DarDeBajaAsync(id, idUsuario, cancellationToken);
        return exists ? NoContent() : NotFound();
    }
}
