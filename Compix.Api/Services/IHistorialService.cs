using Compix.Api.Contracts.Historial;

namespace Compix.Api.Services;

public interface IHistorialService
{
    Task<IReadOnlyList<HistorialMovimientoResponse>> ListarAsync(CancellationToken cancellationToken);
    Task<(bool ExisteEquipo, IReadOnlyList<HistorialMovimientoResponse> Movimientos)> ListarPorEquipoAsync(
        int idEquipo,
        CancellationToken cancellationToken);
}
