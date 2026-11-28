using Compix.Api.Contracts.Historial;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/historial")]
[Authorize]
public sealed class HistorialController(IHistorialService historialService) : ControllerBase
{
    /// <summary>Lista los movimientos de todos los equipos, del más reciente al más antiguo.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<HistorialMovimientoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<HistorialMovimientoResponse>>> Listar(
        CancellationToken cancellationToken) =>
        Ok(await historialService.ListarAsync(cancellationToken));

    /// <summary>Consulta la trazabilidad completa de un equipo.</summary>
    [HttpGet("equipo/{id:int}")]
    [ProducesResponseType<IReadOnlyList<HistorialMovimientoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IReadOnlyList<HistorialMovimientoResponse>>> ListarPorEquipo(
        int id,
        CancellationToken cancellationToken)
    {
        var result = await historialService.ListarPorEquipoAsync(id, cancellationToken);
        return result.ExisteEquipo ? Ok(result.Movimientos) : NotFound();
    }
}
