using System.Security.Claims;
using Compix.Api.Contracts.Auth;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService authService) : ControllerBase
{
    /// <summary>Inicia sesión y emite un token JWT para un usuario activo.</summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> IniciarSesion(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        var response = await authService.IniciarSesionAsync(request, cancellationToken);
        return response is null ? Unauthorized() : Ok(response);
    }

    /// <summary>Obtiene el perfil asociado al token JWT actual.</summary>
    [HttpGet("perfil")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult> ObtenerPerfil(CancellationToken cancellationToken)
    {
        if (!int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var idUsuario))
        {
            return Unauthorized();
        }

        var profile = await authService.ObtenerPerfilAsync(idUsuario, cancellationToken);
        return profile is null ? Unauthorized() : Ok(profile);
    }
}
