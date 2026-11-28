namespace Compix.Api.Contracts.Asignaciones;

/// <summary>Asignación de equipo, activa o histórica.</summary>
public sealed record AsignacionResponse(
    int IdAsignacion,
    int IdEquipo,
    string CodigoInventario,
    string NumeroSerie,
    string Marca,
    string Modelo,
    int IdEmpleado,
    string NombreEmpleado,
    string NumeroNomina,
    int IdUsuarioAsigna,
    string NombreUsuarioAsigna,
    DateTime FechaAsignacion,
    DateTime? FechaDevolucion,
    string? ObservacionesEntrega,
    string? ObservacionesDevolucion);
