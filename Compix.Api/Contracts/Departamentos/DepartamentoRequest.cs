using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Departamentos;

/// <summary>Datos para registrar o actualizar un departamento.</summary>
public sealed record DepartamentoRequest
{
    [Required, StringLength(80)]
    public required string Nombre { get; init; }

    [StringLength(100)]
    public string? UbicacionFisica { get; init; }
}
