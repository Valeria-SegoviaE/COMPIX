using Compix.Api.Authentication;
using Compix.Api.Contracts.Auth;
using Compix.Api.Contracts.Usuarios;
using Compix.Api.Data;
using Dapper;
using Microsoft.AspNetCore.Identity;

namespace Compix.Api.Services;

public sealed class AuthService(
    IMySqlConnectionFactory connectionFactory,
    IPasswordHasher<UsuarioAutenticado> passwordHasher,
    IJwtTokenService tokenService) : IAuthService
{
    private static readonly UsuarioAutenticado UsuarioFicticio =
        new(0, "Invalid user", "invalid@example.invalid", Roles.Soporte, false, DateTime.UnixEpoch);
    private static readonly string HashFicticio =
        new PasswordHasher<UsuarioAutenticado>().HashPassword(UsuarioFicticio, Guid.NewGuid().ToString());

    public async Task<LoginResponse?> IniciarSesionAsync(
        LoginRequest request,
        CancellationToken cancellationToken)
    {
        const string sql = """
            SELECT
                id_usuario AS IdUsuario,
                nombre_completo AS NombreCompleto,
                correo AS Correo,
                password_hash AS PasswordHash,
                rol AS Rol,
                activo AS Activo,
                fecha_creacion AS FechaCreacion
            FROM Usuarios_Sistema
            WHERE correo = @Correo
            LIMIT 1
            """;

        await using var connection = connectionFactory.CreateConnection();
        await connection.OpenAsync(cancellationToken);
        var command = new CommandDefinition(
            sql,
            new { Correo = request.Correo.Trim() },
            cancellationToken: cancellationToken);
        var row = await connection.QuerySingleOrDefaultAsync<UsuarioAuthRow>(command);

        if (row is null)
        {
            passwordHasher.VerifyHashedPassword(UsuarioFicticio, HashFicticio, request.Contrasena);
            return null;
        }

        var user = new UsuarioAutenticado(
            row.IdUsuario,
            row.NombreCompleto,
            row.Correo,
            row.Rol,
            row.Activo,
            row.FechaCreacion);
        var verification = passwordHasher.VerifyHashedPassword(user, row.PasswordHash, request.Contrasena);

        if (!row.Activo || verification == PasswordVerificationResult.Failed)
        {
            return null;
        }

        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
        {
            var updatedHash = passwordHasher.HashPassword(user, request.Contrasena);
            await connection.ExecuteAsync(new CommandDefinition(
                "UPDATE Usuarios_Sistema SET password_hash = @PasswordHash WHERE id_usuario = @IdUsuario",
                new { PasswordHash = updatedHash, row.IdUsuario },
                cancellationToken: cancellationToken));
        }

        var expiresAt = tokenService.CrearToken(user, out var token);
        var response = new UsuarioResponse(
            user.IdUsuario,
            user.NombreCompleto,
            user.Correo,
            user.Rol,
            user.Activo,
            user.FechaCreacion);
        return new LoginResponse(token, expiresAt, response);
    }

    public async Task<UsuarioResponse?> ObtenerPerfilAsync(
        int idUsuario,
        CancellationToken cancellationToken)
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
            WHERE id_usuario = @IdUsuario AND activo = TRUE
            LIMIT 1
            """;

        await using var connection = connectionFactory.CreateConnection();
        return await connection.QuerySingleOrDefaultAsync<UsuarioResponse>(new CommandDefinition(
            sql,
            new { IdUsuario = idUsuario },
            cancellationToken: cancellationToken));
    }

    private sealed class UsuarioAuthRow
    {
        public int IdUsuario { get; set; }
        public string NombreCompleto { get; set; } = string.Empty;
        public string Correo { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string Rol { get; set; } = string.Empty;
        public bool Activo { get; set; }
        public DateTime FechaCreacion { get; set; }
    }
}
