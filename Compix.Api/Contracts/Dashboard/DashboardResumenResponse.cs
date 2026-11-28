namespace Compix.Api.Contracts.Dashboard;

/// <summary>Contadores principales del inventario.</summary>
public sealed record DashboardResumenResponse(
    long TotalEquipos,
    long Activos,
    long EnMantenimiento,
    long Disponibles);
