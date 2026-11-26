using Compix.Api.Authentication;
using Compix.Api.Contracts.Usuarios;
using Compix.Api.Data;
using Dapper;
using Microsoft.AspNetCore.Identity;

namespace Compix.Api.Services;

public sealed class UsuariosService(
    IMySqlConnectionFactory connectionFactory,
    IPasswordHasher<UsuarioAutenticado> passwordHasher) : IUsuariosService
{
    public async Task<IReadOnlyList<UsuarioResponse>> ListarAsync(CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id_usuario AS IdUsuario,
                nombre_completo AS NombreCompleto,
                correo AS Correo,
                rol AS Rol,
                activo AS Activo,
                fecha_creacion AS FechaCreacion
            FROM Usuarios_Sistema
            ORDER BY nombre_completo
            """;

        await using var connection = connectionFactory.CreateConnection();
        var users = await connection.QueryAsync<UsuarioResponse>(new CommandDefinition(
            sql,
            cancellationToken: cancellationToken));
        return users.AsList();
    }

    public async Task<UsuarioResponse> CrearAsync(
        CrearUsuarioRequest request,
        CancellationToken cancellationToken)
    {
        var user = new UsuarioAutenticado(
            0,
            request.NombreCompleto,
            request.Correo,
            request.Rol,
            true,
            DateTime.UtcNow);
        var passwordHash = passwordHasher.HashPassword(user, request.Contrasena);
        const string insertSql = """
            INSERT INTO Usuarios_Sistema (nombre_completo, correo, password_hash, rol, activo)
            VALUES (@NombreCompleto, @Correo, @PasswordHash, @Rol, TRUE)
            """;
        const string selectSql = """
            SELECT
                id_usuario AS IdUsuario,
                nombre_completo AS NombreCompleto,
                correo AS Correo,
                rol AS Rol,
                activo AS Activo,
                fecha_creacion AS FechaCreacion
            FROM Usuarios_Sistema
            WHERE id_usuario = @IdUsuario
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        await connection.ExecuteAsync(new CommandDefinition(
            insertSql,
            new
            {
                request.NombreCompleto,
                Correo = request.Correo.Trim(),
                PasswordHash = passwordHash,
                request.Rol
            },
            cancellationToken: cancellationToken));
        var id = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition("SELECT LAST_INSERT_ID()", cancellationToken: cancellationToken));
        return await connection.QuerySingleAsync<UsuarioResponse>(new CommandDefinition(
            selectSql,
            new { IdUsuario = id },
            cancellationToken: cancellationToken));
    }

    public async Task<bool> CambiarEstadoAsync(
        int idUsuario,
        bool activo,
        CancellationToken cancellationToken)
    {
        const string updateSql = """
            UPDATE Usuarios_Sistema
            SET activo = @Activo
            WHERE id_usuario = @IdUsuario
            """;
        const string existsSql = """
            SELECT EXISTS(
                SELECT 1 FROM Usuarios_Sistema WHERE id_usuario = @IdUsuario
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var changed = await connection.ExecuteAsync(new CommandDefinition(
            updateSql,
            new { IdUsuario = idUsuario, Activo = activo },
            cancellationToken: cancellationToken));

        if (changed > 0)
        {
            return true;
        }

        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            existsSql,
            new { IdUsuario = idUsuario },
            cancellationToken: cancellationToken));
    }

    public async Task<bool> PuedeAccederAsync(
        int idUsuario,
        string rol,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT EXISTS(
                SELECT 1
                FROM Usuarios_Sistema
                WHERE id_usuario = @IdUsuario
                  AND rol = @Rol
                  AND activo = TRUE
            )
            """;

        await using var connection = connectionFactory.CreateConnection();
        return await connection.ExecuteScalarAsync<bool>(new CommandDefinition(
            sql,
            new { IdUsuario = idUsuario, Rol = rol },
            cancellationToken: cancellationToken));
    }
}
