using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Mantenimientos;

/// <summary>Datos para ingresar un equipo a mantenimiento.</summary>
public sealed record CrearMantenimientoRequest
{
    [Range(1, int.MaxValue)]
    public required int IdEquipo { get; init; }

    [Required, RegularExpression("^(Preventivo|Correctivo)$")]
    public required string TipoMantenimiento { get; init; }

    [Required]
    public required string DescripcionProblema { get; init; }
}
