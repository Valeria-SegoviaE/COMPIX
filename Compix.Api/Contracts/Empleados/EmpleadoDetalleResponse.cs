namespace Compix.Api.Contracts.Empleados;

/// <summary>Detalle de empleado, incluidos sus equipos asignados actualmente.</summary>
public sealed record EmpleadoDetalleResponse(
    int IdEmpleado,
    string NumeroNomina,
    string NombreCompleto,
    string CorreoCorporativo,
    string? Puesto,
    int? IdDepartamento,
    string? Departamento,
    bool Activo,
    IReadOnlyList<EquipoAsignadoResponse> EquiposActuales);
