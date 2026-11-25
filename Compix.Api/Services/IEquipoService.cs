using Compix.Api.Contracts.Equipos;

namespace Compix.Api.Services;

public interface IEquipoService
{
    Task<IReadOnlyList<EquipoResponse>> ObtenerTodosAsync(
        string? estado,
        string? tipo,
        string? busqueda,
        CancellationToken cancellationToken);

    Task<EquipoResponse?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken);
    Task<int> CrearAsync(CrearEquipoRequest request, CancellationToken cancellationToken);
}
