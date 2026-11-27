using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Asignaciones;

/// <summary>Empleado destino y observaciones para reasignar un equipo.</summary>
public sealed record ReasignarEquipoRequest
{
    [Range(1, int.MaxValue)]
    public required int IdEquipo { get; init; }

    [Range(1, int.MaxValue)]
    public required int IdEmpleadoNuevo { get; init; }

    public string? ObservacionesEntrega { get; init; }

    public string? ObservacionesDevolucion { get; init; }
}
