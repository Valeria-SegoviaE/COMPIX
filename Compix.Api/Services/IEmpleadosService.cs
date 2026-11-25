using Compix.Api.Contracts.Empleados;

namespace Compix.Api.Services;

public interface IEmpleadosService
{
    Task<IReadOnlyList<EmpleadoResponse>> ListarAsync(
        string? nombre,
        int? idDepartamento,
        CancellationToken cancellationToken);
    Task<EmpleadoDetalleResponse?> ObtenerPorIdAsync(
        int idEmpleado,
        CancellationToken cancellationToken);
    Task<int> CrearAsync(EmpleadoRequest request, CancellationToken cancellationToken);
    Task<bool> ActualizarAsync(
        int idEmpleado,
        EmpleadoRequest request,
        CancellationToken cancellationToken);
    Task<bool> DarDeBajaAsync(int idEmpleado, CancellationToken cancellationToken);
}
