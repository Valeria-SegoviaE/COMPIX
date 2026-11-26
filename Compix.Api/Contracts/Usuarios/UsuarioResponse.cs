namespace Compix.Api.Contracts.Usuarios;

/// <summary>Datos públicos de un usuario del sistema.</summary>
public sealed record UsuarioResponse(
    int IdUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    bool Activo,
    DateTime FechaCreacion);
