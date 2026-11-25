using Compix.Api.Contracts.Auth;
using Compix.Api.Contracts.Usuarios;

namespace Compix.Api.Services;

public interface IAuthService
{
    Task<LoginResponse?> IniciarSesionAsync(LoginRequest request, CancellationToken cancellationToken);
    Task<UsuarioResponse?> ObtenerPerfilAsync(int idUsuario, CancellationToken cancellationToken);
}
