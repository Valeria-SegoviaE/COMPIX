using Compix.Api.Contracts.Usuarios;

namespace Compix.Api.Contracts.Auth;

/// <summary>Token JWT y datos públicos del usuario autenticado.</summary>
public sealed record LoginResponse(
    string Token,
    DateTime ExpiraEnUtc,
    UsuarioResponse Usuario);
