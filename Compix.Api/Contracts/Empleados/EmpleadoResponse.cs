namespace Compix.Api.Contracts.Empleados;

/// <summary>Información de un empleado y su departamento.</summary>
public sealed record EmpleadoResponse(
    int IdEmpleado,
    string NumeroNomina,
    string NombreCompleto,
    string CorreoCorporativo,
    string? Puesto,
    int? IdDepartamento,
    string? Departamento,
    bool Activo);
