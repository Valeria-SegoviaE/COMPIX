using Microsoft.AspNetCore.WebUtilities;
using MySqlConnector;

namespace Compix.Api.Data;

public sealed class MySqlConnectionFactory(IConfiguration configuration) : IMySqlConnectionFactory
{
    private readonly string? _connectionString = configuration.GetConnectionString("DefaultConnection");

    public MySqlConnection CreateConnection()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            throw new InvalidOperationException(
                "Falta configurar la cadena de conexión 'ConnectionStrings:DefaultConnection'.");
        }

        if (!Uri.TryCreate(_connectionString, UriKind.Absolute, out var uri)
            || !uri.Scheme.Equals("mysql", StringComparison.OrdinalIgnoreCase))
        {
            return new MySqlConnection(_connectionString);
        }

        var separator = uri.UserInfo.IndexOf(':');
        if (separator <= 0 || separator == uri.UserInfo.Length - 1)
        {
            throw new InvalidOperationException("La URI MySQL debe incluir usuario y contraseña.");
        }

        var query = QueryHelpers.ParseQuery(uri.Query);
        var sslModeValue = query.TryGetValue("ssl-mode", out var configuredSslMode)
            ? configuredSslMode.ToString()
            : nameof(MySqlSslMode.Required);

        if (!Enum.TryParse<MySqlSslMode>(sslModeValue, true, out var sslMode))
        {
            throw new InvalidOperationException("La URI MySQL contiene un valor ssl-mode no válido.");
        }

        return new MySqlConnection(new MySqlConnectionStringBuilder
        {
            Server = uri.Host,
            Port = (uint)(uri.IsDefaultPort ? 3306 : uri.Port),
            UserID = Uri.UnescapeDataString(uri.UserInfo[..separator]),
            Password = Uri.UnescapeDataString(uri.UserInfo[(separator + 1)..]),
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            SslMode = sslMode
        }.ConnectionString);
    }
}
