using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Mantenimientos;

/// <summary>Solución aplicada al finalizar un mantenimiento.</summary>
public sealed record CerrarMantenimientoRequest
{
    [Required]
    public required string SolucionAplicada { get; init; }
}
