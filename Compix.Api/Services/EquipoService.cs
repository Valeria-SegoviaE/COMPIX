using System.Data;
using Compix.Api.Contracts.Equipos;
using Dapper;
using MySqlConnector;
using Microsoft.AspNetCore.WebUtilities;

namespace Compix.Api.Services;

public sealed class EquipoService(IConfiguration configuration) : IEquipoService
{
    private const string ObtenerPorIdSql = """
        SELECT
            eq.id_equipo,
            eq.numero_serie,
            eq.codigo_inventario,
            eq.tipo_equipo,
            eq.marca,
            eq.modelo,
            eq.procesador,
            eq.memoria_ram_gb,
            eq.almacenamiento,
            eq.sistema_operativo,
            eq.estado_operativo,
            eq.fecha_adquisicion,
            eq.notas_generales,
            emp.id_empleado AS id_empleado_asignado,
            emp.nombre_completo AS empleado_asignado,
            dep.nombre AS departamento_asignado
        FROM Equipos eq
        LEFT JOIN Asignaciones asig
            ON eq.id_equipo = asig.id_equipo AND asig.fecha_devolucion IS NULL
        LEFT JOIN Empleados emp ON asig.id_empleado = emp.id_empleado
        LEFT JOIN Departamentos dep ON emp.id_departamento = dep.id_departamento
        WHERE eq.id_equipo = @Id
        LIMIT 1
        """;

    private readonly string? _connectionString = configuration.GetConnectionString("DefaultConnection");

    public async Task<IReadOnlyList<EquipoResponse>> ObtenerTodosAsync(
        string? estado,
        string? tipo,
        string? busqueda,
        CancellationToken cancellationToken)
    {
        await using var connection = CrearConexion();
        await connection.OpenAsync(cancellationToken);

        var command = new CommandDefinition(
            "sp_ConsultarEquipos",
            new { p_estado = estado, p_tipo = tipo, p_busqueda = busqueda },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        var equipos = await connection.QueryAsync<EquipoRow>(command);
        return equipos.Select(Convertir).ToArray();
    }

    public async Task<EquipoResponse?> ObtenerPorIdAsync(int id, CancellationToken cancellationToken)
    {
        await using var connection = CrearConexion();
        await connection.OpenAsync(cancellationToken);

        var command = new CommandDefinition(
            ObtenerPorIdSql,
            new { Id = id },
            cancellationToken: cancellationToken);

        var equipo = await connection.QuerySingleOrDefaultAsync<EquipoRow>(command);
        return equipo is null ? null : Convertir(equipo);
    }

    public async Task<int> CrearAsync(CrearEquipoRequest request, CancellationToken cancellationToken)
    {
        await using var connection = CrearConexion();
        await connection.OpenAsync(cancellationToken);

        var command = new CommandDefinition(
            "sp_RegistrarEquipo",
            new
            {
                p_numero_serie = request.NumeroSerie,
                p_codigo_inventario = request.CodigoInventario,
                p_tipo_equipo = request.TipoEquipo,
                p_marca = request.Marca,
                p_modelo = request.Modelo,
                p_procesador = request.Procesador,
                p_memoria_ram_gb = request.MemoriaRamGb,
                p_almacenamiento = request.Almacenamiento,
                p_sistema_operativo = request.SistemaOperativo,
                p_fecha_adquisicion = request.FechaAdquisicion,
                p_notas_generales = request.NotasGenerales,
                p_id_usuario_responsable = request.IdUsuarioResponsable
            },
            commandType: CommandType.StoredProcedure,
            cancellationToken: cancellationToken);

        return await connection.QuerySingleAsync<int>(command);
    }

    private MySqlConnection CrearConexion()
    {
        if (string.IsNullOrWhiteSpace(_connectionString))
        {
            throw new InvalidOperationException(
                "Falta configurar la cadena de conexión 'ConnectionStrings:DefaultConnection'.");
        }

        var connectionString = _connectionString;
        if (Uri.TryCreate(connectionString, UriKind.Absolute, out var uri)
            && uri.Scheme.Equals("mysql", StringComparison.OrdinalIgnoreCase))
        {
            connectionString = ConvertirUriMySql(uri);
        }

        return new MySqlConnection(connectionString);
    }

    private static string ConvertirUriMySql(Uri uri)
    {
        var separator = uri.UserInfo.IndexOf(':');
        if (separator <= 0 || separator == uri.UserInfo.Length - 1)
        {
            throw new InvalidOperationException(
                "La URI MySQL debe incluir usuario y contraseña.");
        }

        var query = QueryHelpers.ParseQuery(uri.Query);
        var sslModeValue = query.TryGetValue("ssl-mode", out var configuredSslMode)
            ? configuredSslMode.ToString()
            : nameof(MySqlSslMode.Required);

        if (!Enum.TryParse<MySqlSslMode>(sslModeValue, true, out var sslMode))
        {
            throw new InvalidOperationException("La URI MySQL contiene un valor ssl-mode no válido.");
        }

        var builder = new MySqlConnectionStringBuilder
        {
            Server = uri.Host,
            Port = (uint)uri.Port,
            UserID = Uri.UnescapeDataString(uri.UserInfo[..separator]),
            Password = Uri.UnescapeDataString(uri.UserInfo[(separator + 1)..]),
            Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/')),
            SslMode = sslMode
        };

        return builder.ConnectionString;
    }

    private static EquipoResponse Convertir(EquipoRow row) =>
        new(
            row.IdEquipo,
            row.NumeroSerie,
            row.CodigoInventario,
            row.TipoEquipo,
            row.Marca,
            row.Modelo,
            row.Procesador,
            row.MemoriaRamGb,
            row.Almacenamiento,
            row.SistemaOperativo,
            row.EstadoOperativo,
            row.FechaAdquisicion is null ? null : DateOnly.FromDateTime(row.FechaAdquisicion.Value),
            row.NotasGenerales,
            row.IdEmpleadoAsignado,
            row.EmpleadoAsignado,
            row.DepartamentoAsignado);

    private sealed class EquipoRow
    {
        public int IdEquipo { get; set; }
        public string? NumeroSerie { get; set; }
        public string? CodigoInventario { get; set; }
        public string? TipoEquipo { get; set; }
        public string? Marca { get; set; }
        public string? Modelo { get; set; }
        public string? Procesador { get; set; }
        public int? MemoriaRamGb { get; set; }
        public string? Almacenamiento { get; set; }
        public string? SistemaOperativo { get; set; }
        public string? EstadoOperativo { get; set; }
        public DateTime? FechaAdquisicion { get; set; }
        public string? NotasGenerales { get; set; }
        public int? IdEmpleadoAsignado { get; set; }
        public string? EmpleadoAsignado { get; set; }
        public string? DepartamentoAsignado { get; set; }
    }
}
