namespace Compix.Api.Authentication;

public sealed record UsuarioAutenticado(
    int IdUsuario,
    string NombreCompleto,
    string Correo,
    string Rol,
    bool Activo,
    DateTime FechaCreacion);
