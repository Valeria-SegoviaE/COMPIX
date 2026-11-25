using Compix.Api.Contracts.Equipos;
using Compix.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/equipos")]
public sealed class EquiposController(IEquipoService equipoService) : ControllerBase
{
    /// <summary>Lista equipos, con filtros opcionales por estado, tipo y búsqueda.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EquipoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EquipoResponse>>> ObtenerTodos(
        [FromQuery] string? estado,
        [FromQuery] string? tipo,
        [FromQuery] string? busqueda,
        CancellationToken cancellationToken)
    {
        var equipos = await equipoService.ObtenerTodosAsync(estado, tipo, busqueda, cancellationToken);
        return Ok(equipos);
    }

    /// <summary>Consulta las especificaciones de un equipo por su identificador.</summary>
    [HttpGet("{id:int}", Name = nameof(ObtenerPorId))]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EquipoResponse>> ObtenerPorId(int id, CancellationToken cancellationToken)
    {
        var equipo = await equipoService.ObtenerPorIdAsync(id, cancellationToken);
        return equipo is null ? NotFound() : Ok(equipo);
    }

    /// <summary>Registra un equipo usando el procedimiento almacenado correspondiente.</summary>
    [HttpPost]
    [ProducesResponseType<EquipoResponse>(StatusCodes.Status201Created)]
    public async Task<ActionResult<EquipoResponse>> Crear(
        CrearEquipoRequest request,
        CancellationToken cancellationToken)
    {
        var id = await equipoService.CrearAsync(request, cancellationToken);
        var equipo = await equipoService.ObtenerPorIdAsync(id, cancellationToken);

        if (equipo is null)
        {
            throw new InvalidOperationException($"No se encontró el equipo {id} después de registrarlo.");
        }

        return CreatedAtAction(nameof(ObtenerPorId), new { id }, equipo);
    }
}
