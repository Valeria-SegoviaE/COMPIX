using Compix.Api.Contracts.Asignaciones;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class AsignacionesService(IMySqlConnectionFactory connectionFactory)
    : IAsignacionesService
{
    private const string AsignacionSelectSql = """
        SELECT
            a.id_asignacion AS IdAsignacion,
            a.id_equipo AS IdEquipo,
            e.codigo_inventario AS CodigoInventario,
            e.numero_serie AS NumeroSerie,
            e.marca AS Marca,
            e.modelo AS Modelo,
            a.id_empleado AS IdEmpleado,
            emp.nombre_completo AS NombreEmpleado,
            emp.numero_nomina AS NumeroNomina,
            a.id_usuario_asigna AS IdUsuarioAsigna,
            u.nombre_completo AS NombreUsuarioAsigna,
            a.fecha_asignacion AS FechaAsignacion,
            a.fecha_devolucion AS FechaDevolucion,
            a.observaciones_entrega AS ObservacionesEntrega,
            a.observaciones_devolucion AS ObservacionesDevolucion
        FROM Asignaciones a
        INNER JOIN Equipos e ON e.id_equipo = a.id_equipo
        INNER JOIN Empleados emp ON emp.id_empleado = a.id_empleado
        INNER JOIN Usuarios_Sistema u ON u.id_usuario = a.id_usuario_asigna
        """;

    public async Task<IReadOnlyList<AsignacionResponse>> ListarActivasAsync(
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<AsignacionResponse>(new CommandDefinition(
            $"{AsignacionSelectSql} WHERE a.fecha_devolucion IS NULL ORDER BY a.fecha_asignacion DESC",
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<IReadOnlyList<AsignacionResponse>> ListarHistorialAsync(
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        var rows = await connection.QueryAsync<AsignacionResponse>(new CommandDefinition(
            $"{AsignacionSelectSql} ORDER BY a.fecha_asignacion DESC",
            cancellationToken: cancellationToken));
        return rows.AsList();
    }

    public async Task<(ResultadoOperacion Resultado, int? Id)> AsignarAsync(
        AsignarEquipoRequest request,
        int idUsuarioResponsable,
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

        var employeeIsActive = await connection.QuerySingleOrDefaultAsync<bool?>(new CommandDefinition(
            "SELECT activo FROM Empleados WHERE id_empleado = @IdEmpleado",
            new { request.IdEmpleado },
            transaction,
            cancellationToken: cancellationToken));
        if (employeeIsActive is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.NoEncontrado, null);
        }

        var hasActiveAssignment = await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            """
            SELECT EXISTS(
                SELECT 1 FROM Asignaciones
                WHERE id_equipo = @IdEquipo AND fecha_devolucion IS NULL
            )
            """,
            new { request.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        if (state != "Disponible" || hasActiveAssignment || !employeeIsActive.Value)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.Conflicto, null);
        }

        const string insertSql = """
            INSERT INTO Asignaciones (
                id_equipo, id_empleado, id_usuario_asigna, observaciones_entrega
            )
            VALUES (@IdEquipo, @IdEmpleado, @IdUsuarioResponsable, @ObservacionesEntrega)
            """;
        await connection.ExecuteAsync(new CommandDefinition(
            insertSql,
            new
            {
                request.IdEquipo,
                request.IdEmpleado,
                IdUsuarioResponsable = idUsuarioResponsable,
                request.ObservacionesEntrega
            },
            transaction,
            cancellationToken: cancellationToken));
        var idAsignacion = await ObtenerUltimoIdAsync(connection, transaction, cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE Equipos SET estado_operativo = 'Activo' WHERE id_equipo = @IdEquipo",
            new { request.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        await RegistrarMovimientoAsync(
            connection,
            transaction,
            request.IdEquipo,
            idUsuarioResponsable,
            "Asignacion",
            state,
            "Activo",
            $"Equipo asignado al empleado {request.IdEmpleado}.",
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return (ResultadoOperacion.Exito, idAsignacion);
    }

    public async Task<(ResultadoOperacion Resultado, int? Id)> ReasignarAsync(
        ReasignarEquipoRequest request,
        int idUsuarioResponsable,
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

        var currentAssignment = await connection.QuerySingleOrDefaultAsync<AsignacionVigente?>(
            new CommandDefinition(
                """
                SELECT id_asignacion AS IdAsignacion, id_empleado AS IdEmpleado
                FROM Asignaciones
                WHERE id_equipo = @IdEquipo AND fecha_devolucion IS NULL
                FOR UPDATE
                """,
                new { request.IdEquipo },
                transaction,
                cancellationToken: cancellationToken));
        if (currentAssignment is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.Conflicto, null);
        }

        var employeeIsActive = await connection.QuerySingleOrDefaultAsync<bool?>(new CommandDefinition(
            "SELECT activo FROM Empleados WHERE id_empleado = @IdEmpleadoNuevo",
            new { request.IdEmpleadoNuevo },
            transaction,
            cancellationToken: cancellationToken));
        if (employeeIsActive is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.NoEncontrado, null);
        }

        if (state != "Activo"
            || !employeeIsActive.Value
            || currentAssignment.IdEmpleado == request.IdEmpleadoNuevo)
        {
            await transaction.RollbackAsync(cancellationToken);
            return (ResultadoOperacion.Conflicto, null);
        }

        await connection.ExecuteAsync(new CommandDefinition(
            """
            UPDATE Asignaciones
            SET fecha_devolucion = CURRENT_TIMESTAMP,
                observaciones_devolucion = @ObservacionesDevolucion
            WHERE id_asignacion = @IdAsignacion
            """,
            new
            {
                currentAssignment.IdAsignacion,
                request.ObservacionesDevolucion
            },
            transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            """
            INSERT INTO Asignaciones (
                id_equipo, id_empleado, id_usuario_asigna, observaciones_entrega
            )
            VALUES (@IdEquipo, @IdEmpleadoNuevo, @IdUsuarioResponsable, @ObservacionesEntrega)
            """,
            new
            {
                request.IdEquipo,
                request.IdEmpleadoNuevo,
                IdUsuarioResponsable = idUsuarioResponsable,
                request.ObservacionesEntrega
            },
            transaction,
            cancellationToken: cancellationToken));
        var idAsignacion = await ObtenerUltimoIdAsync(connection, transaction, cancellationToken);
        await RegistrarMovimientoAsync(
            connection,
            transaction,
            request.IdEquipo,
            idUsuarioResponsable,
            "Reasignacion",
            "Activo",
            "Activo",
            $"Equipo reasignado del empleado {currentAssignment.IdEmpleado} al empleado {request.IdEmpleadoNuevo}.",
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return (ResultadoOperacion.Exito, idAsignacion);
    }

    public async Task<ResultadoOperacion> DevolverAsync(
        int idAsignacion,
        string? observacionesDevolucion,
        int idUsuarioResponsable,
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var assignment = await connection.QuerySingleOrDefaultAsync<AsignacionParaDevolver?>(new CommandDefinition(
            """
            SELECT id_equipo AS IdEquipo, id_empleado AS IdEmpleado
            FROM Asignaciones
            WHERE id_asignacion = @IdAsignacion
            """,
            new { IdAsignacion = idAsignacion },
            transaction,
            cancellationToken: cancellationToken));
        if (assignment is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.NoEncontrado;
        }

        var state = await connection.QuerySingleOrDefaultAsync<string?>(new CommandDefinition(
            "SELECT estado_operativo FROM Equipos WHERE id_equipo = @IdEquipo FOR UPDATE",
            new { assignment.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        var isActive = await connection.QuerySingleOrDefaultAsync<bool?>(new CommandDefinition(
            "SELECT fecha_devolucion IS NULL FROM Asignaciones WHERE id_asignacion = @IdAsignacion FOR UPDATE",
            new { IdAsignacion = idAsignacion },
            transaction,
            cancellationToken: cancellationToken));
        if (isActive is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.NoEncontrado;
        }

        if (!isActive.Value || state != "Activo")
        {
            await transaction.RollbackAsync(cancellationToken);
            return ResultadoOperacion.Conflicto;
        }

        await connection.ExecuteAsync(new CommandDefinition(
            """
            UPDATE Asignaciones
            SET fecha_devolucion = CURRENT_TIMESTAMP,
                observaciones_devolucion = @ObservacionesDevolucion
            WHERE id_asignacion = @IdAsignacion
            """,
            new { IdAsignacion = idAsignacion, ObservacionesDevolucion = observacionesDevolucion },
            transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            "UPDATE Equipos SET estado_operativo = 'Disponible' WHERE id_equipo = @IdEquipo",
            new { assignment.IdEquipo },
            transaction,
            cancellationToken: cancellationToken));
        await RegistrarMovimientoAsync(
            connection,
            transaction,
            assignment.IdEquipo,
            idUsuarioResponsable,
            "Devolucion",
            "Activo",
            "Disponible",
            $"Equipo devuelto por el empleado {assignment.IdEmpleado}.",
            cancellationToken);
        await transaction.CommitAsync(cancellationToken);
        return ResultadoOperacion.Exito;
    }

    private static Task<int> ObtenerUltimoIdAsync(
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction transaction,
        CancellationToken cancellationToken) =>
        connection.ExecuteScalarAsync<int>(new CommandDefinition(
            "SELECT LAST_INSERT_ID()",
            transaction: transaction,
            cancellationToken: cancellationToken));

    private static Task RegistrarMovimientoAsync(
        System.Data.IDbConnection connection,
        System.Data.IDbTransaction transaction,
        int idEquipo,
        int idUsuario,
        string tipo,
        string? estadoAnterior,
        string? estadoNuevo,
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

    private sealed record AsignacionVigente(int IdAsignacion, int IdEmpleado);

    private sealed record AsignacionParaDevolver(int IdEquipo, int IdEmpleado);
}
