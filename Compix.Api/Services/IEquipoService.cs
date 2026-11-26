using Compix.Api.Contracts.Equipos;

namespace Compix.Api.Services;

public interface IEquipoService
{
    Task<IReadOnlyList<EquipoResponse>> ObtenerTodosAsync(
        string? estado,
        string? tipo,
        string? marca,
        string? busqueda,
        CancellationToken cancellationToken);
    Task<EquipoResponse?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<EquipoResponse?> ObtenerPorCodigoAsync(string codigo, CancellationToken cancellationToken);
    Task<int> CrearAsync(
        EquipoRequest request,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
    Task<EquipoResponse?> ActualizarAsync(
        int idEquipo,
        EquipoRequest request,
        CancellationToken cancellationToken);
    Task<bool> CambiarEstadoAsync(
        int idEquipo,
        string estadoOperativo,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
    Task<bool> DarDeBajaAsync(
        int idEquipo,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
}
