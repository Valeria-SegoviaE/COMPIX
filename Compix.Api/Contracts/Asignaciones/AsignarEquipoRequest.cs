using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Asignaciones;

/// <summary>Equipo y empleado para crear una asignación.</summary>
public sealed record AsignarEquipoRequest
{
    [Range(1, int.MaxValue)]
    public required int IdEquipo { get; init; }

    [Range(1, int.MaxValue)]
    public required int IdEmpleado { get; init; }

    public string? ObservacionesEntrega { get; init; }
}
