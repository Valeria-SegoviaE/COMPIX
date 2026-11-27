using Compix.Api.Contracts.Historial;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class HistorialService(IMySqlConnectionFactory connectionFactory) : IHistorialService
{
    private const string HistorialSelectSql = """
        SELECT
            h.id_movimiento AS IdMovimiento,
            h.id_equipo AS IdEquipo,
            e.codigo_inventario AS CodigoInventario,
            e.numero_serie AS NumeroSerie,
            h.id_usuario_responsable AS IdUsuarioResponsable,
            u.nombre_completo AS NombreUsuarioResponsable,
            h.tipo_movimiento AS TipoMovimiento,
            h.estado_anterior AS EstadoAnterior,
            h.estado_nuevo AS EstadoNuevo,
            h.descripcion_detalle AS DescripcionDetalle,
            h.fecha_movimiento AS FechaMovimiento
        FROM Historial_Movimientos h
        INNER JOIN Equipos e ON e.id_equipo = h.id_equipo
        INNER JOIN Usuarios_Sistema u ON u.id_usuario = h.id_usuario_responsable
        """;

    public async Task<IReadOnlyList<HistorialMovimientoResponse>> ListarAsync(
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<HistorialMovimientoResponse>(new CommandDefinition(
            $"{HistorialSelectSql} ORDER BY h.fecha_movimiento DESC, h.id_movimiento DESC",
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<(bool ExisteEquipo, IReadOnlyList<HistorialMovimientoResponse> Movimientos)>
        ListarPorEquipoAsync(int idEquipo, CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        var existe = await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            "SELECT EXISTS(SELECT 1 FROM Equipos WHERE id_equipo = @IdEquipo)",
            new { IdEquipo = idEquipo },
            cancellationToken: cancellationToken));
        if (!existe)
        {
            return (false, []);
        }

        var rows = await connection.QueryAsync<HistorialMovimientoResponse>(new CommandDefinition(
            $"{HistorialSelectSql} WHERE h.id_equipo = @IdEquipo ORDER BY h.fecha_movimiento DESC, h.id_movimiento DESC",
            new { IdEquipo = idEquipo },
            cancellationToken: cancellationToken));
        return (true, rows.AsList());
    }
}
