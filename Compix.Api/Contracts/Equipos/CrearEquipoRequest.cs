namespace Compix.Api.Contracts.Equipos;

/// <summary>Datos para registrar un equipo de cómputo.</summary>
public sealed record CrearEquipoRequest
{
    public string? NumeroSerie { get; init; }
    public string? CodigoInventario { get; init; }
    public string? TipoEquipo { get; init; }
    public string? Marca { get; init; }
    public string? Modelo { get; init; }
    public string? Procesador { get; init; }
    public int? MemoriaRamGb { get; init; }
    public string? Almacenamiento { get; init; }
    public string? SistemaOperativo { get; init; }
    public DateOnly? FechaAdquisicion { get; init; }
    public string? NotasGenerales { get; init; }
    public int IdUsuarioResponsable { get; init; }
}
