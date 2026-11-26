using MySqlConnector;

namespace Compix.Api.Data;

public interface IMySqlConnectionFactory
{
    MySqlConnection CreateConnection();
}
