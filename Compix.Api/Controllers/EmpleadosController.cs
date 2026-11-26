using Compix.Api.Contracts.Empleados;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/empleados")]
[Authorize]
public sealed class EmpleadosController(IEmpleadosService empleadosService) : ControllerBase
{
    /// <summary>Lista empleados y permite filtrar por nombre y departamento.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<EmpleadoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<EmpleadoResponse>>> Listar(
        [FromQuery] string? nombre,
        [FromQuery] int? idDepartamento,
        CancellationToken cancellationToken)
    {
        return Ok(await empleadosService.ListarAsync(nombre, idDepartamento, cancellationToken));
    }

    /// <summary>Obtiene un empleado y sus equipos con asignación vigente.</summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType<EmpleadoDetalleResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmpleadoDetalleResponse>> ObtenerPorId(
        int id,
        CancellationToken cancellationToken)
    {
        var employee = await empleadosService.ObtenerPorIdAsync(id, cancellationToken);
        return employee is null ? NotFound() : Ok(employee);
    }

    /// <summary>Registra un empleado.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Crear(
        EmpleadoRequest request,
        CancellationToken cancellationToken)
    {
        var id = await empleadosService.CrearAsync(request, cancellationToken);
        var employee = await empleadosService.ObtenerPorIdAsync(id, cancellationToken);
        if (employee is null)
        {
            throw new InvalidOperationException($"No se encontró el empleado {id} después de registrarlo.");
        }

        return CreatedAtAction(nameof(ObtenerPorId), new { id }, employee);
    }

    /// <summary>Actualiza los datos de un empleado.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Actualizar(
        int id,
        EmpleadoRequest request,
        CancellationToken cancellationToken)
    {
        var exists = await empleadosService.ActualizarAsync(id, request, cancellationToken);
        return exists ? NoContent() : NotFound();
    }

    /// <summary>Da de baja lógica a un empleado.</summary>
    [HttpPatch("{id:int}/baja")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DarDeBaja(
        int id,
        CancellationToken cancellationToken)
    {
        var exists = await empleadosService.DarDeBajaAsync(id, cancellationToken);
        return exists ? NoContent() : NotFound();
    }
}
