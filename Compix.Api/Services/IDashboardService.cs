using Compix.Api.Contracts.Dashboard;

namespace Compix.Api.Services;

public interface IDashboardService
{
    Task<DashboardResumenResponse> ObtenerResumenAsync(CancellationToken cancellationToken);
}
