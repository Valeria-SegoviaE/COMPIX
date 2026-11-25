using System.ComponentModel.DataAnnotations;
using Compix.Api.Authentication;

namespace Compix.Api.Contracts.Usuarios;

/// <summary>Datos para crear un usuario administrador o de soporte.</summary>
public sealed record CrearUsuarioRequest
{
    [Required, StringLength(100)]
    public required string NombreCompleto { get; init; }

    [Required, EmailAddress, StringLength(100)]
    public required string Correo { get; init; }

    [Required, MinLength(8)]
    public required string Contrasena { get; init; }

    [Required, RegularExpression("^(Admin|Soporte)$")]
    public required string Rol { get; init; }
}
