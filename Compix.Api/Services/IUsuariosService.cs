using Compix.Api.Contracts.Usuarios;

namespace Compix.Api.Services;

public interface IUsuariosService
{
    Task<IReadOnlyList<UsuarioResponse>> ListarAsync(CancellationToken cancellationToken);
    Task<UsuarioResponse> CrearAsync(CrearUsuarioRequest request, CancellationToken cancellationToken);
    Task<bool> CambiarEstadoAsync(
        int idUsuario,
        bool activo,
        CancellationToken cancellationToken);
    Task<bool> PuedeAccederAsync(
        int idUsuario,
        string rol,
        CancellationToken cancellationToken);
}
