using Compix.Api.Contracts.Mantenimientos;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class MantenimientosService(IMySqlConnectionFactory connectionFactory)
    : IMantenimientosService
{
    private const string MantenimientoSelectSql = """
        SELECT
            m.id_mantenimiento AS IdMantenimiento,
            m.id_equipo AS IdEquipo,
            e.codigo_inventario AS CodigoInventario,
            e.numero_serie AS NumeroSerie,
            e.marca AS Marca,
            e.modelo AS Modelo,
            m.id_usuario_tecnico AS IdUsuarioTecnico,
            u.nombre_completo AS NombreTecnico,
            m.tipo_mantenimiento AS TipoMantenimiento,
            m.descripcion_problema AS DescripcionProblema,
            m.solucion_aplicada AS SolucionAplicada,
            m.fecha_ingreso AS FechaIngreso,
            m.fecha_salida AS FechaSalida
        FROM Mantenimientos m
        INNER JOIN Equipos e ON e.id_equipo = m.id_equipo
        INNER JOIN Usuarios_Sistema u ON u.id_usuario = m.id_usuario_tecnico
        """;

    public async Task<IReadOnlyList<MantenimientoResponse>> ListarAbiertosAsync(
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<MantenimientoResponse>(new CommandDefinition(
            $"{MantenimientoSelectSql} WHERE m.fecha_salida IS NULL ORDER BY m.fecha_ingreso DESC",
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<(bool ExisteEquipo, IReadOnlyList<MantenimientoResponse> Mantenimientos)>
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

        var rows = await connection.QueryAsync<MantenimientoResponse>(new CommandDefinition(
            $"{MantenimientoSelectSql} WHERE m.id_equipo = @IdEquipo ORDER BY m.fecha_ingreso DESC",
            new { IdEquipo = idEquipo },
            cancellationToken: cancellationToken));
        return (true, rows.AsList());
    }

    public async Task<(ResultadoOperacion Resultado, int? Id)> CrearAsync(
        CrearMantenimientoRequest request,
        int idUsuarioTecnico,
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var state = await connection.QuerySingleOrDefaultAsync<string?>(new CommandDefinition(
            "SELECT estado_operativo FROM Equipos WHERE id_equipo = @IdEquipo FOR UPDATE",
            new { request.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        if (state is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.NoEncontrado, null);
        }

        if (state is "En Mantenimiento" or "Dado de Baja")
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.Conflicto, null);
        }

        await connection.ExecuteAsync(new CommandDefinition(
            """
            UPDATE Asignaciones
            SET fecha_devolucion = CURRENT_TIMESTAMP,
                observaciones_devolucion = 'Equipo enviado a mantenimiento.'
            WHERE id_equipo = @IdEquipo AND fecha_devolucion IS NULL
            """,
            new { request.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO Mantenimientos (
                id_equipo, id_usuario_tecnico, tipo_mantenimiento, descripcion_problema
            )
            VALUES (@IdEquipo, @IdUsuarioTecnico, @TipoMantenimiento, @DescripcionProblema)
            """,
            new
            {
                request.IdEquipo,
                IdUsuarioTecnico = idUsuarioTecnico,
                request.TipoMantenimiento,
                request.DescripcionProblema
            },
            transaction,
            cancellationToken: cancellationToken));
        var idMantenimiento = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            "SELECT LAST_INSERT_ID()",
            transaction: transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE Equipos SET estado_operativo = 'En Mantenimiento' WHERE id_equipo = @IdEquipo",
            new { request.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        await RegistrarMovimientoAsync(
            connection,
            transaction,
            request.IdEquipo,
            idUsuarioTecnico,
            "Mantenimiento",
            state,
            "En Mantenimiento",
            $"Ingreso a mantenimiento {request.TipoMantenimiento}: {request.DescripcionProblema}",
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return (ResultadoOperacion.Exito, idMantenimiento);
    }

    public async Task<ResultadoOperacion> CerrarAsync(
        int idMantenimiento,
        string solucionAplicada,
        int idUsuarioTecnico,
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var maintenance = await connection.QuerySingleOrDefaultAsync<MantenimientoActual?>(
            new CommandDefinition(
                """
                SELECT id_equipo AS IdEquipo
                FROM Mantenimientos
                WHERE id_mantenimiento = @IdMantenimiento
                """,
                new { IdMantenimiento = idMantenimiento },
                transaction,
                cancellationToken: cancellationToken));
        if (maintenance is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.NoEncontrado;
        }

        var state = await connection.QuerySingleOrDefaultAsync<string?>(new CommandDefinition(
            "SELECT estado_operativo FROM Equipos WHERE id_equipo = @IdEquipo FOR UPDATE",
            new { maintenance.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        var isOpen = await connection.QuerySingleOrDefaultAsync<bool?>(new CommandDefinition(
            """
            SELECT fecha_salida IS NULL
            FROM Mantenimientos
            WHERE id_mantenimiento = @IdMantenimiento
            FOR UPDATE
            """,
            new { IdMantenimiento = idMantenimiento },
            transaction,
            cancellationToken: cancellationToken));
        if (isOpen is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.NoEncontrado;
        }

        if (!isOpen.Value || state != "En Mantenimiento")
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.Conflicto;
        }

        await connection.ExecuteAsync(new CommandDefinition(
            """
            UPDATE Mantenimientos
            SET solucion_aplicada = @SolucionAplicada,
                fecha_salida = CURRENT_TIMESTAMP
            WHERE id_mantenimiento = @IdMantenimiento
            """,
            new { IdMantenimiento = idMantenimiento, SolucionAplicada = solucionAplicada },
            transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE Equipos SET estado_operativo = 'Disponible' WHERE id_equipo = @IdEquipo",
            new { maintenance.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        await RegistrarMovimientoAsync(
            connection,
            transaction,
            maintenance.IdEquipo,
            idUsuarioTecnico,
            "Cambio Estado",
            "En Mantenimiento",
            "Disponible",
            $"Mantenimiento {idMantenimiento} finalizado. Solución: {solucionAplicada}",
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return ResultadoOperacion.Exito;
    }

    private static Task RegistrarMovimientoAsync(
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction transaction,
        int idEquipo,
        int idUsuario,
        string tipo,
        string estadoAnterior,
        string estadoNuevo,
        string descripcion,
        CancellationToken cancellationToken) =>
        connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO Historial_Movimientos (
                id_equipo, id_usuario_responsable, tipo_movimiento,
                estado_anterior, estado_nuevo, descripcion_detalle
            )
            VALUES (
                @IdEquipo, @IdUsuario, @Tipo, @EstadoAnterior, @EstadoNuevo, @Descripcion
            )
            """,
            new
            {
                IdEquipo = idEquipo,
                IdUsuario = idUsuario,
                Tipo = tipo,
                EstadoAnterior = estadoAnterior,
                EstadoNuevo = estadoNuevo,
                Descripcion = descripcion
            },
            transaction,
            cancellationToken: cancellationToken));

    private sealed record MantenimientoActual(int IdEquipo);
}
