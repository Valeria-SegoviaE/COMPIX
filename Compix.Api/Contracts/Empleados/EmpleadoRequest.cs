using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Empleados;

/// <summary>Datos para registrar o actualizar un empleado.</summary>
public sealed record EmpleadoRequest
{
    [Required, StringLength(20)]
    public required string NumeroNomina { get; init; }

    [Required, StringLength(100)]
    public required string NombreCompleto { get; init; }

    [Required, EmailAddress, StringLength(100)]
    public required string CorreoCorporativo { get; init; }

    [StringLength(80)]
    public string? Puesto { get; init; }

    public int? IdDepartamento { get; init; }
}
