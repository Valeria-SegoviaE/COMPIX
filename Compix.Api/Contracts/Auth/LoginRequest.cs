using System.ComponentModel.DataAnnotations;

namespace Compix.Api.Contracts.Auth;

/// <summary>Credenciales para iniciar sesión.</summary>
public sealed record LoginRequest
{
    [Required, EmailAddress]
    public required string Correo { get; init; }

    [Required]
    public required string Contrasena { get; init; }
}
