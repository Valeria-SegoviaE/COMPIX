namespace Compix.Api.Contracts.Usuarios;

/// <summary>Estado de acceso que se asignará a un usuario.</summary>
public sealed record CambiarEstadoUsuarioRequest(bool Activo);
