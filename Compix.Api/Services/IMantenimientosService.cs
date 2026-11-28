using Compix.Api.Contracts.Mantenimientos;

namespace Compix.Api.Services;

public interface IMantenimientosService
{
    Task<IReadOnlyList<MantenimientoResponse>> ListarAbiertosAsync(CancellationToken cancellationToken);
    Task<(bool ExisteEquipo, IReadOnlyList<MantenimientoResponse> Mantenimientos)> ListarPorEquipoAsync(
        int idEquipo,
        CancellationToken cancellationToken);
    Task<(ResultadoOperacion Resultado, int? Id)> CrearAsync(
        CrearMantenimientoRequest request,
        int idUsuarioTecnico,
        CancellationToken cancellationToken);
    Task<ResultadoOperacion> CerrarAsync(
        int idMantenimiento,
        string solucionAplicada,
        int idUsuarioTecnico,
        CancellationToken cancellationToken);
}
