namespace Compix.Api.Contracts.Departamentos;

/// <summary>Información de un departamento.</summary>
public sealed record DepartamentoResponse(
    int IdDepartamento,
    string Nombre,
    string? UbicacionFisica);
