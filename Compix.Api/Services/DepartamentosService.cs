using Compix.Api.Contracts.Departamentos;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class DepartamentosService(IMySqlConnectionFactory connectionFactory) : IDepartamentosService
{
    public async Task<IReadOnlyList<DepartamentoResponse>> ListarAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id_departamento AS IdDepartamento,
                nombre AS Nombre,
                ubicacion_fisica AS UbicacionFisica
            FROM Departamentos
            ORDER BY nombre
            """;

        await using var connection = connectionFactory.CreateConnection();
        var departments = await connection.QueryAsync<DepartamentoResponse>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));
        return departments.AsList();
    }

    public async Task<int> CrearAsync(
        DepartamentoRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            INSERT INTO Departamentos (nombre, ubicacion_fisica)
            VALUES (@Nombre, @UbicacionFisica)
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            sql,
            new { request.Nombre, request.UbicacionFisica },
            cancellationToken: cancellationToken));
        return await connection.ExecuteScalarAsync<int>(
            new CommandDefinition("SELECT LAST_INSERT_ID()", cancellationToken: cancellationToken));
    }

    public async Task<bool> ActualizarAsync(
        int idDepartamento,
        DepartamentoRequest request,
        CancellationToken cancellationToken)
    {
        const string updateSql = """
            UPDATE Departamentos
            SET nombre = @Nombre,
                ubicacion_fisica = @UbicacionFisica
            WHERE id_departamento = @IdDepartamento
            """;
        const string existsSql = """
            SELECT EXISTS(
                SELECT 1 FROM Departamentos WHERE id_departamento = @IdDepartamento
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var changed = await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new { IdDepartamento = idDepartamento, request.Nombre, request.UbicacionFisica },
            cancellationToken: cancellationToken));

        if (changed > 0)
        {
            return true;
        }

        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            existsSql,
            new { IdDepartamento = idDepartamento },
            cancellationToken: cancellationToken));
    }
}
