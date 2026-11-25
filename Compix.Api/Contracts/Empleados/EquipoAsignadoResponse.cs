namespace Compix.Api.Contracts.Empleados;

/// <summary>Equipo actualmente asignado a un empleado.</summary>
public sealed record EquipoAsignadoResponse(
    int IdEquipo,
    string NumeroSerie,
    string CodigoInventario,
    string TipoEquipo,
    string Marca,
    string Modelo,
    string EstadoOperativo,
    DateTime FechaAsignacion);
