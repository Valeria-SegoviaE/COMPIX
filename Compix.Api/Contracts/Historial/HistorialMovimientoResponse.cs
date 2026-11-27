namespace Compix.Api.Contracts.Historial;

/// <summary>Movimiento asociado a un equipo y al usuario responsable.</summary>
public sealed record HistorialMovimientoResponse(
    int IdMovimiento,
    int IdEquipo,
    string CodigoInventario,
    string NumeroSerie,
    int IdUsuarioResponsable,
    string NombreUsuarioResponsable,
    string TipoMovimiento,
    string? EstadoAnterior,
    string? EstadoNuevo,
    string DescripcionDetalle,
    DateTime FechaMovimiento);
