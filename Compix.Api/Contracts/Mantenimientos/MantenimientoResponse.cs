namespace Compix.Api.Contracts.Mantenimientos;

/// <summary>Información de un mantenimiento en curso o finalizado.</summary>
public sealed record MantenimientoResponse(
    int IdMantenimiento,
    int IdEquipo,
    string CodigoInventario,
    string NumeroSerie,
    string Marca,
    string Modelo,
    int IdUsuarioTecnico,
    string NombreTecnico,
    string TipoMantenimiento,
    string DescripcionProblema,
    string? SolucionAplicada,
    DateTime FechaIngreso,
    DateTime? FechaSalida);
