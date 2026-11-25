using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Equipos;

/// <summary>Datos técnicos para registrar o actualizar un equipo.</summary>
public sealed record EquipoRequest
{
    [Required, StringLength(100)]
    public required string NumeroSerie { get; init; }

    [Required, StringLength(50)]
    public required string CodigoInventario { get; init; }

    [Required, RegularExpression("^(Laptop|Desktop|Workstation|All-in-One)$")]
    public required string TipoEquipo { get; init; }

    [Required, StringLength(50)]
    public required string Marca { get; init; }

    [Required, StringLength(80)]
    public required string Modelo { get; init; }

    [Required, StringLength(100)]
    public required string Procesador { get; init; }

    [Range(1, 1024)]
    public required int MemoriaRamGb { get; init; }

    [Required, StringLength(80)]
    public required string Almacenamiento { get; init; }

    [StringLength(80)]
    public string? SistemaOperativo { get; init; }

    public DateOnly? FechaAdquisicion { get; init; }

    public string? NotasGenerales { get; init; }
}
