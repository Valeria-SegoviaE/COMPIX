using Compix.Api.Contracts.Dashboard;
using Compix.Api.Data;
using Dapper;

namespace Compix.Api.Services;

public sealed class DashboardService(IMySqlConnectionFactory connectionFactory) : IDashboardService
{
    public async Task<DashboardResumenResponse> ObtenerResumenAsync(
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                COUNT(*) AS TotalEquipos,
                CAST(COALESCE(SUM(estado_operativo = 'Activo'), 0) AS SIGNED) AS Activos,
                CAST(COALESCE(SUM(estado_operativo = 'En Mantenimiento'), 0) AS SIGNED) AS EnMantenimiento,
                CAST(COALESCE(SUM(estado_operativo = 'Disponible'), 0) AS SIGNED) AS Disponibles
            FROM Equipos
            """;

        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleAsync<DashboardResumenResponse>(
            new CommandDefinition(sql, cancellationToken: cancellationToken));
    }
}
