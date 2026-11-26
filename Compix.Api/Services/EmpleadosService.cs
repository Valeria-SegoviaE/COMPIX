using Compix.Api.Contracts.Empleados;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class EmpleadosService(IMySqlConnectionFactory connectionFactory) : IEmpleadosService
{
    public async Task<IReadOnlyList<EmpleadoResponse>> ListarAsync(
        string? nombre,
        int? idDepartamento,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                emp.id_empleado AS IdEmpleado,
                emp.numero_nomina AS NumeroNomina,
                emp.nombre_completo AS NombreCompleto,
                emp.correo_corporativo AS CorreoCorporativo,
                emp.puesto AS Puesto,
                emp.id_departamento AS IdDepartamento,
                dep.nombre AS Departamento,
                emp.activo AS Activo
            FROM Empleados emp
            LEFT JOIN Departamentos dep ON dep.id_departamento = emp.id_departamento
            WHERE (@Nombre IS NULL OR emp.nombre_completo LIKE CONCAT('%', @Nombre, '%'))
              AND (@IdDepartamento IS NULL OR emp.id_departamento = @IdDepartamento)
            ORDER BY emp.nombre_completo
            """;

        await using var connection = connectionFactory.CreateConnection();
        var employees = await connection.QueryAsync<EmpleadoResponse>(new CommandDefinition(
            sql,
            new { Nombre = string.IsNullOrWhiteSpace(nombre) ? null : nombre.Trim(), IdDepartamento = idDepartamento },
            cancellationToken: cancellationToken));
        return employees.AsList();
    }

    public async Task<EmpleadoDetalleResponse?> ObtenerPorIdAsync(
        int idEmpleado,
        CancellationToken cancellationToken)
    {
        const string employeeSql = """
            SELECT
                emp.id_empleado AS IdEmpleado,
                emp.numero_nomina AS NumeroNomina,
                emp.nombre_completo AS NombreCompleto,
                emp.correo_corporativo AS CorreoCorporativo,
                emp.puesto AS Puesto,
                emp.id_departamento AS IdDepartamento,
                dep.nombre AS Departamento,
                emp.activo AS Activo
            FROM Empleados emp
            LEFT JOIN Departamentos dep ON dep.id_departamento = emp.id_departamento
            WHERE emp.id_empleado = @IdEmpleado
            LIMIT 1
            """;
        const string equipmentSql = """
            SELECT
                eq.id_equipo AS IdEquipo,
                eq.numero_serie AS NumeroSerie,
                eq.codigo_inventario AS CodigoInventario,
                eq.tipo_equipo AS TipoEquipo,
                eq.marca AS Marca,
                eq.modelo AS Modelo,
                eq.estado_operativo AS EstadoOperativo,
                asig.fecha_asignacion AS FechaAsignacion
            FROM Asignaciones asig
            INNER JOIN Equipos eq ON eq.id_equipo = asig.id_equipo
            WHERE asig.id_empleado = @IdEmpleado
              AND asig.fecha_devolucion IS NULL
            ORDER BY asig.fecha_asignacion DESC
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(
            employeeSql,
            new { IdEmpleado = idEmpleado },
            cancellationToken: cancellationToken);
        var employee = await connection.QuerySingleOrDefaultAsync<EmpleadoResponse>(command);
        if (employee is null)
        {
            return null;
        }

        var equipment = await connection.QueryAsync<EquipoAsignadoResponse>(new CommandDefinition(
            equipmentSql,
            new { IdEmpleado = idEmpleado },
            cancellationToken: cancellationToken));

        return new EmpleadoDetalleResponse(
            employee.IdEmpleado,
            employee.NumeroNomina,
            employee.NombreCompleto,
            employee.CorreoCorporativo,
            employee.Puesto,
            employee.IdDepartamento,
            employee.Departamento,
            employee.Activo,
            equipment.AsList());
    }

    public async Task<int> CrearAsync(
        EmpleadoRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO Empleados (
                numero_nomina,
                nombre_completo,
                correo_corporativo,
                puesto,
                id_departamento
            )
            VALUES (
                @NumeroNomina,
                @NombreCompleto,
                @CorreoCorporativo,
                @Puesto,
                @IdDepartamento
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            request,
            cancellationToken: cancellationToken));
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition("SELECT LAST_INSERT_ID()", cancellationToken: cancellationToken));
    }

    public async Task<bool> ActualizarAsync(
        int idEmpleado,
        EmpleadoRequest request,
        CancellationToken cancellationToken)
    {
        const string updateSql = """
            UPDATE Empleados
            SET numero_nomina = @NumeroNomina,
                nombre_completo = @NombreCompleto,
                correo_corporativo = @CorreoCorporativo,
                puesto = @Puesto,
                id_departamento = @IdDepartamento
            WHERE id_empleado = @IdEmpleado
            """;
        const string existsSql = """
            SELECT EXISTS(
                SELECT 1 FROM Empleados WHERE id_empleado = @IdEmpleado
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var changed = await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new
            {
                IdEmpleado = idEmpleado,
                request.NumeroNomina,
                request.NombreCompleto,
                request.CorreoCorporativo,
                request.Puesto,
                request.IdDepartamento
            },
            cancellationToken: cancellationToken));

        if (changed > 0)
        {
            return true;
        }

        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            existsSql,
            new { IdEmpleado = idEmpleado },
            cancellationToken: cancellationToken));
    }

    public async Task<bool> DarDeBajaAsync(
        int idEmpleado,
        CancellationToken cancellationToken)
    {
        const string updateSql = """
            UPDATE Empleados
            SET activo = FALSE
            WHERE id_empleado = @IdEmpleado
            """;
        const string existsSql = """
            SELECT EXISTS(
                SELECT 1 FROM Empleados WHERE id_empleado = @IdEmpleado
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var changed = await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new { IdEmpleado = idEmpleado },
            cancellationToken: cancellationToken));

        if (changed > 0)
        {
            return true;
        }

        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            existsSql,
            new { IdEmpleado = idEmpleado },
            cancellationToken: cancellationToken));
    }
}
