using Compix.Api.Contracts.Departamentos;

namespace Compix.Api.Services;

public interface IDepartamentosService
{
    Task<IReadOnlyList<DepartamentoResponse>> ListarAsync(CancellationToken cancellationToken);
    Task<int> CrearAsync(DepartamentoRequest request, CancellationToken cancellationToken);
    Task<bool> ActualizarAsync(
        int idDepartamento,
        DepartamentoRequest request,
        CancellationToken cancellationToken);
}
