using System.Security.Claims;
using System.Text;
using Dapper;
using Compix.Api.Authentication;
using Compix.Api.Data;
using Compix.Api.Middleware;
using Compix.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);
var jwtSettings = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>()
    ?? new JwtOptions();

if (Encoding.UTF8.GetByteCount(jwtSettings.SigningKey) < 32)
{
    throw new InvalidOperationException(
        "Configura Jwt:SigningKey con una clave secreta de al menos 32 bytes mediante User Secrets o una variable de entorno.");
}

if (jwtSettings.ExpirationMinutes <= 0)
{
    throw new InvalidOperationException("Jwt:ExpirationMinutes debe ser mayor que cero.");
}

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddScoped<IEquipoService, EquipoService>();
builder.Services.AddScoped<IAsignacionesService, AsignacionesService>();
builder.Services.AddScoped<IMantenimientosService, MantenimientosService>();
builder.Services.AddScoped<IHistorialService, HistorialService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<MySqlConflictExceptionHandler>();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes = new Dictionary<string, IOpenApiSecurityScheme>
        {
            ["Bearer"] = new OpenApiSecurityScheme
            {
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                In = ParameterLocation.Header,
                BearerFormat = "JWT"
            }
        };
        return Task.CompletedTask;
    });
    options.AddOperationTransformer((operation, context, _) =>
    {
        var allowsAnonymous = context.Description.ActionDescriptor.EndpointMetadata
            .OfType<Microsoft.AspNetCore.Authorization.IAllowAnonymous>()
            .Any();
        if (!allowsAnonymous)
        {
            operation.Security ??= [];
            operation.Security.Add(new OpenApiSecurityRequirement
            {
                [new OpenApiSecuritySchemeReference("Bearer", context.Document)] = []
            });
        }

        return Task.CompletedTask;
    });
});
builder.Services.Configure<JwtOptions>(builder.Configuration.GetSection(JwtOptions.SectionName));
builder.Services.AddSingleton<IMySqlConnectionFactory, MySqlConnectionFactory>();
builder.Services.AddSingleton<IPasswordHasher<UsuarioAutenticado>, PasswordHasher<UsuarioAutenticado>>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IUsuariosService, UsuariosService>();
builder.Services.AddScoped<IDepartamentosService, DepartamentosService>();
builder.Services.AddScoped<IEmpleadosService, EmpleadosService>();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidateAudience = true,
            ValidAudience = jwtSettings.Audience,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.SigningKey)),
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromSeconds(30),
            NameClaimType = ClaimTypes.Name,
            RoleClaimType = ClaimTypes.Role
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var principal = context.Principal;
                var idValue = principal?.FindFirstValue(ClaimTypes.NameIdentifier);
                var role = principal?.FindFirstValue(ClaimTypes.Role);

                if (!int.TryParse(idValue, out var idUsuario) || string.IsNullOrWhiteSpace(role))
                {
                    context.Fail("El token no contiene identidad o rol válidos.");
                    return;
                }

                var usuariosService = context.HttpContext.RequestServices
                    .GetRequiredService<IUsuariosService>();
                if (!await usuariosService.PuedeAccederAsync(
                        idUsuario,
                        role,
                        context.HttpContext.RequestAborted))
                {
                    context.Fail("La cuenta está inactiva o el rol ya no es válido.");
                }
            }
        };
    });
builder.Services.AddAuthorization();

DefaultTypeMap.MatchNamesWithUnderscores = true;

var app = builder.Build();

// Configure the HTTP request pipeline.
app.UseExceptionHandler();
app.UseStatusCodePages();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUi(settings =>
    {
        settings.Path = "/swagger";
        settings.DocumentTitle = "Compix API";
        settings.SwaggerRoutes.Add(new NSwag.AspNetCore.SwaggerUiRoute(
            "v1",
            "/openapi/v1.json"));
    });
}

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
