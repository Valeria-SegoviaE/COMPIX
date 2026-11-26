namespace Compix.Api.Authentication;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; init; } = "Compix.Api";
    public string Audience { get; init; } = "Compix.Client";
    public string SigningKey { get; init; } = string.Empty;
    public int ExpirationMinutes { get; init; } = 5;
}
