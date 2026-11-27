using Compix.Api.Contracts.Asignaciones;

namespace Compix.Api.Services;

public interface IAsignacionesService
{
    Task<IReadOnlyList<AsignacionResponse>> ListarActivasAsync(CancellationToken cancellationToken);
    Task<IReadOnlyList<AsignacionResponse>> ListarHistorialAsync(CancellationToken cancellationToken);
    Task<(ResultadoOperacion Resultado, int? Id)> AsignarAsync(
        AsignarEquipoRequest request,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
    Task<(ResultadoOperacion Resultado, int? Id)> ReasignarAsync(
        ReasignarEquipoRequest request,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
    Task<ResultadoOperacion> DevolverAsync(
        int idAsignacion,
        string? observacionesDevolucion,
        int idUsuarioResponsable,
        CancellationToken cancellationToken);
}
