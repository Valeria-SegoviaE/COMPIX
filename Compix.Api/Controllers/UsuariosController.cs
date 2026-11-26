using Compix.Api.Authentication;
using Compix.Api.Contracts.Usuarios;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/usuarios")]
[Authorize(Roles = Roles.Admin)]
public sealed class UsuariosController(IUsuariosService usuariosService) : ControllerBase
{
    /// <summary>Lista los usuarios de TI, incluidos los accesos desactivados.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<UsuarioResponse>>(StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UsuarioResponse>>> Listar(
        CancellationToken cancellationToken)
    {
        return Ok(await usuariosService.ListarAsync(cancellationToken));
    }

    /// <summary>Crea un usuario Admin o Soporte y almacena su contraseña con hash seguro.</summary>
    [HttpPost]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<ActionResult<UsuarioResponse>> Crear(
        CrearUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        var user = await usuariosService.CrearAsync(request, cancellationToken);
        return CreatedAtAction(nameof(Listar), user);
    }

    /// <summary>Activa o desactiva el acceso de un usuario.</summary>
    [HttpPut("{id:int}/estado")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CambiarEstado(
        int id,
        CambiarEstadoUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        var exists = await usuariosService.CambiarEstadoAsync(id, request.Activo, cancellationToken);
        return exists ? NoContent() : NotFound();
    }
}
