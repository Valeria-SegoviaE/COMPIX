using Compix.Api.Contracts.Equipos;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class EquipoService(IMySqlConnectionFactory connectionFactory) : IEquipoService
{
    private const string EquipoSelectSql = """
        SELECT
            eq.id_equipo AS IdEquipo,
            eq.numero_serie AS NumeroSerie,
            eq.codigo_inventario AS CodigoInventario,
            eq.tipo_equipo AS TipoEquipo,
            eq.marca AS Marca,
            eq.modelo AS Modelo,
            eq.procesador AS Procesador,
            eq.memoria_ram_gb AS MemoriaRamGb,
            eq.almacenamiento AS Almacenamiento,
            eq.sistema_operativo AS SistemaOperativo,
            eq.estado_operativo AS EstadoOperativo,
            eq.fecha_adquisicion AS FechaAdquisicion,
            eq.notas_generales AS NotasGenerales,
            emp.id_empleado AS IdEmpleadoAsignado,
            emp.nombre_completo AS EmpleadoAsignado,
            dep.nombre AS DepartamentoAsignado
        FROM Equipos eq
        LEFT JOIN Asignaciones asig
            ON eq.id_equipo = asig.id_equipo AND asig.fecha_devolucion IS NULL
        LEFT JOIN Empleados emp ON asig.id_empleado = emp.id_empleado
        LEFT JOIN Departamentos dep ON emp.id_departamento = dep.id_departamento
        """;

    public async Task<IReadOnlyList<EquipoResponse>> ObtenerTodosAsync(
        string? estado,
        string? tipo,
        string? marca,
        string? busqueda,
        CancellationToken cancellationToken)
    {
        var sql = $"""
            {EquipoSelectSql}
            WHERE (@Estado IS NULL OR eq.estado_operativo = @Estado)
              AND (@Tipo IS NULL OR eq.tipo_equipo = @Tipo)
              AND (@Marca IS NULL OR eq.marca LIKE CONCAT('%', @Marca, '%'))
              AND (
                    @Busqueda IS NULL
                    OR eq.numero_serie LIKE CONCAT('%', @Busqueda, '%')
                    OR eq.codigo_inventario LIKE CONCAT('%', @Busqueda, '%')
                    OR eq.marca LIKE CONCAT('%', @Busqueda, '%')
                    OR eq.modelo LIKE CONCAT('%', @Busqueda, '%')
                  )
            ORDER BY eq.id_equipo DESC
            """;

        await using var connection = connectionFactory.CreateConnection();
        var command = new CommandDefinition(
            sql,
            new
            {
                Estado = NullIfWhiteSpace(estado),
                Tipo = NullIfWhiteSpace(tipo),
                Marca = NullIfWhiteSpace(marca),
                Busqueda = NullIfWhiteSpace(busqueda)
            },
            cancellationToken: cancellationToken);
        var equipos = await connection.QueryAsync<EquipoResponse>(command);
        return equipos.AsList();
    }

    public async Task<EquipoResponse?> ObtenerPorIdAsync(
        int id,
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<EquipoResponse>(new CommandDefinition(
            $"{EquipoSelectSql} WHERE eq.id_equipo = @Id LIMIT 1",
            new { Id = id },
            cancellationToken: cancellationToken));
    }

    public async Task<EquipoResponse?> ObtenerPorCodigoAsync(
        string codigo,
        CancellationToken cancellationToken)
    {
        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<EquipoResponse>(new CommandDefinition(
            $"""
            {EquipoSelectSql}
            WHERE eq.numero_serie = @Codigo OR eq.codigo_inventario = @Codigo
            LIMIT 1
            """,
            new { Codigo = codigo },
            cancellationToken: cancellationToken));
    }

    public async Task<int> CrearAsync(
        EquipoRequest request,
        int idUsuarioResponsable,
        CancellationToken cancellationToken)
    {
        const string insertSql = """
            INSERT INTO Equipos (
                numero_serie,
                codigo_inventario,
                tipo_equipo,
                marca,
                modelo,
                procesador,
                memoria_ram_gb,
                almacenamiento,
                sistema_operativo,
                estado_operativo,
                fecha_adquisicion,
                notas_generales
            )
            VALUES (
                @NumeroSerie,
                @CodigoInventario,
                @TipoEquipo,
                @Marca,
                @Modelo,
                @Procesador,
                @MemoriaRamGb,
                @Almacenamiento,
                @SistemaOperativo,
                'Disponible',
                @FechaAdquisicion,
                @NotasGenerales
            )
            """;
        const string historySql = """
            INSERT INTO Historial_Movimientos (
                id_equipo,
                id_usuario_responsable,
                tipo_movimiento,
                estado_anterior,
                estado_nuevo,
                descripcion_detalle
            )
            VALUES (
                @IdEquipo,
                @IdUsuarioResponsable,
                'Registro',
                NULL,
                'Disponible',
                'Registro inicial del equipo en el inventario.'
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            insertSql,
            request,
            transaction,
            cancellationToken: cancellationToken));
        var id = await connection.ExecuteScalarAsync<int>(new CommandDefinition(
            "SELECT LAST_INSERT_ID()",
            transaction: transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            historySql,
            new { IdEquipo = id, IdUsuarioResponsable = idUsuarioResponsable },
            transaction,
            cancellationToken: cancellationToken));
        await transaction.CommitAsync(cancellationToken);
        return id;
    }

    public async Task<EquipoResponse?> ActualizarAsync(
        int idEquipo,
        EquipoRequest request,
        CancellationToken cancellationToken)
    {
        const string updateSql = """
            UPDATE Equipos
            SET numero_serie = @NumeroSerie,
                codigo_inventario = @CodigoInventario,
                tipo_equipo = @TipoEquipo,
                marca = @Marca,
                modelo = @Modelo,
                procesador = @Procesador,
                memoria_ram_gb = @MemoriaRamGb,
                almacenamiento = @Almacenamiento,
                sistema_operativo = @SistemaOperativo,
                fecha_adquisicion = @FechaAdquisicion,
                notas_generales = @NotasGenerales
            WHERE id_equipo = @IdEquipo
            """;
        const string existsSql = """
            SELECT EXISTS(SELECT 1 FROM Equipos WHERE id_equipo = @IdEquipo)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(
            updateSql,
            new
            {
                IdEquipo = idEquipo,
                request.NumeroSerie,
                request.CodigoInventario,
                request.TipoEquipo,
                request.Marca,
                request.Modelo,
                request.Procesador,
                request.MemoriaRamGb,
                request.Almacenamiento,
                request.SistemaOperativo,
                request.FechaAdquisicion,
                request.NotasGenerales
            },
            cancellationToken: cancellationToken);
        var changed = await connection.ExecuteAsync(command);

        if (changed == 0 && !await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
                existsSql,
                new { IdEquipo = idEquipo },
                cancellationToken: cancellationToken)))
        {
            return null;
        }

        return await connection.QuerySingleOrDefaultAsync<EquipoResponse>(new CommandDefinition(
            $"{EquipoSelectSql} WHERE eq.id_equipo = @IdEquipo LIMIT 1",
            new { IdEquipo = idEquipo },
            cancellationToken: cancellationToken));
    }

    public async Task<bool> CambiarEstadoAsync(
        int idEquipo,
        string estadoOperativo,
        int idUsuarioResponsable,
        CancellationToken cancellationToken)
    {
        const string getStateSql = """
            SELECT estado_operativo
            FROM Equipos
            WHERE id_equipo = @IdEquipo
            FOR UPDATE
            """;
        const string updateSql = """
            UPDATE Equipos
            SET estado_operativo = @EstadoOperativo
            WHERE id_equipo = @IdEquipo
            """;
        const string historySql = """
            INSERT INTO Historial_Movimientos (
                id_equipo,
                id_usuario_responsable,
                tipo_movimiento,
                estado_anterior,
                estado_nuevo,
                descripcion_detalle
            )
            VALUES (
                @IdEquipo,
                @IdUsuarioResponsable,
                @TipoMovimiento,
                @EstadoAnterior,
                @EstadoNuevo,
                @Descripcion
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await using var transaction = await connection.BeginTransactionAsync(cancellationToken);
        var oldState = await connection.QuerySingleOrDefaultAsync<string?>(new CommandDefinition(
            getStateSql,
            new { IdEquipo = idEquipo },
            transaction,
            cancellationToken: cancellationToken));

        if (oldState is null)
        {
            await transaction.RollbackAsync(cancellationToken);
            return false;
        }

        if (oldState == estadoOperativo)
        {
            await transaction.CommitAsync(cancellationToken);
            return true;
        }

        await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new { IdEquipo = idEquipo, EstadoOperativo = estadoOperativo },
            transaction,
            cancellationToken: cancellationToken));
        await connection.ExecuteAsync(new CommandDefinition(
            historySql,
            new
            {
                IdEquipo = idEquipo,
                IdUsuarioResponsable = idUsuarioResponsable,
                TipoMovimiento = TipoMovimiento(estadoOperativo),
                EstadoAnterior = oldState,
                EstadoNuevo = estadoOperativo,
                Descripcion = $"Cambio de estado de '{oldState}' a '{estadoOperativo}'."
            },
            transaction,
            cancellationToken: cancellationToken));
        await transaction.CommitAsync(cancellationToken);
        return true;
    }

    public Task<bool> DarDeBajaAsync(
        int idEquipo,
        int idUsuarioResponsable,
        CancellationToken cancellationToken) =>
        CambiarEstadoAsync(idEquipo, "Dado de Baja", idUsuarioResponsable, cancellationToken);

    private static string TipoMovimiento(string estadoOperativo) =>
        estadoOperativo switch
        {
            "En Mantenimiento" => "Mantenimiento",
            "Dado de Baja" => "Baja",
            _ => "Cambio Estado"
        };

    private static string? NullIfWhiteSpace(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
