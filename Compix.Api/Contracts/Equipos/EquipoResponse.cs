namespace Compix.Api.Contracts.Equipos;

/// <summary>Información básica de un equipo de cómputo en el inventario.</summary>
public sealed record EquipoResponse(
    int IdEquipo,
    string? NumeroSerie,
    string? CodigoInventario,
    string? TipoEquipo,
    string? Marca,
    string? Modelo,
    string? Procesador,
    int? MemoriaRamGb,
    string? Almacenamiento,
    string? SistemaOperativo,
    string? EstadoOperativo,
    DateOnly? FechaAdquisicion,
    string? NotasGenerales,
    int? IdEmpleadoAsignado,
    string? EmpleadoAsignado,
    string? DepartamentoAsignado);
