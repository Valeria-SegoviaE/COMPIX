using Compix.Api.Contracts.Dashboard;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Compix.Api.Controllers;

[ApiController]
[Route("api/dashboard")]
[Authorize]
public sealed class DashboardController(IDashboardService dashboardService) : ControllerBase
{
    /// <summary>Obtiene los contadores principales del inventario.</summary>
    [HttpGet("resumen")]
    [ProducesResponseType<DashboardResumenResponse>(StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardResumenResponse>> ObtenerResumen(
        CancellationToken cancellationToken) =>
        Ok(await dashboardService.ObtenerResumenAsync(cancellationToken));
}
