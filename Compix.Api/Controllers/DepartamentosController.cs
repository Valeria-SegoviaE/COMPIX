using Compix.Api.Contracts.Departamentos;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/departamentos")]
[Authorize]
public sealed class DepartamentosController(IDepartamentosService departamentosService) : ControllerBase
{
    /// <summary>Obtiene los departamentos registrados.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<DepartamentoResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DepartamentoResponse>>> Listar(
        CancellationToken cancellationToken)
    {
        return Ok(await departamentosService.ListarAsync(cancellationToken));
    }

    /// <summary>Registra un departamento.</summary>
    [HttpPost]
    [ProducesResponseType(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult> Crear(
        DepartamentoRequest request,
        CancellationToken cancellationToken)
    {
        var id = await departamentosService.CrearAsync(request, cancellationToken);
        var response = new DepartamentoResponse(id, request.Nombre, request.UbicacionFisica);
        return CreatedAtAction(nameof(Listar), response);
    }

    /// <summary>Actualiza el nombre y la ubicación física de un departamento.</summary>
    [HttpPut("{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Actualizar(
        int id,
        DepartamentoRequest request,
        CancellationToken cancellationToken)
    {
        var exists = await departamentosService.ActualizarAsync(id, request, cancellationToken);
        return exists ? NoContent() : NotFound();
    }
}
