using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Equipos;

/// <summary>Nuevo estado operativo de un equipo.</summary>
public sealed record CambiarEstadoEquipoRequest
{
    [Required, RegularExpression("^(Activo|En Mantenimiento|Disponible|Dado de Baja)$")]
    public required string EstadoOperativo { get; init; }
}
