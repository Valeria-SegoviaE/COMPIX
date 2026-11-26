namespace Compix.Api.Authentication;

public interface IJwtTokenService
{
    DateTime CrearToken(UsuarioAutenticado usuario, out string token);
}
