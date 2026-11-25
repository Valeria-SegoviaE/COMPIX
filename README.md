# COMPIX

Sistema de Gestión de Inventario de Equipos de Cómputo.

## Integrantes
- Valeria Segovia Espinoza
- Julio Gael Gonzalez Maldonado

## Descripción
Aplicación web para registrar, consultar y administrar equipos de cómputo.

## API

La documentación interactiva se sirve en `/swagger` durante el entorno Development.
El documento OpenAPI está disponible en `/openapi/v1.json`.

### Configuración local

La API requiere las tablas MySQL descritas para `Usuarios_Sistema`, `Departamentos`,
`Empleados`, `Equipos`, `Asignaciones` e `Historial_Movimientos`. La cadena de
conexión se configura como `ConnectionStrings:DefaultConnection`.

Para desarrollo local también puede guardarse fuera del repositorio con User Secrets:

```powershell
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "<cadena-de-conexión-MySQL>" --project Compix.Api
```

Configura la clave JWT fuera del repositorio con User Secrets:

```powershell
dotnet user-secrets set "Jwt:SigningKey" "<secreto aleatorio de al menos 32 bytes>" --project Compix.Api
```

En producción, configura la variable de entorno `Jwt__SigningKey`. La API usa
`Admin` y `Soporte` como valores de rol, de acuerdo con el `ENUM` de la tabla
`Usuarios_Sistema`. Todos los recursos requieren un JWT; `/api/usuarios` requiere
el rol `Admin`. Las cuentas inactivas o con rol cambiado dejan de poder usar
tokens emitidos anteriormente.

Las contraseñas nuevas se guardan usando ASP.NET Core `PasswordHasher`. Debe
existir previamente al menos un usuario Admin con un hash compatible para poder
iniciar sesión y crear más usuarios; no hay registro público de administradores.

### Rutas

| Método | Ruta | Acceso |
|---|---|---|
| POST | `/api/auth/login` | Público |
| GET | `/api/auth/perfil` | JWT |
| GET, POST | `/api/usuarios` | JWT, Admin |
| PUT | `/api/usuarios/{id}/estado` | JWT, Admin |
| GET, POST | `/api/departamentos` | JWT |
| PUT | `/api/departamentos/{id}` | JWT |
| GET, POST | `/api/empleados` | JWT |
| GET, PUT | `/api/empleados/{id}` | JWT |
| PATCH | `/api/empleados/{id}/baja` | JWT |
| GET, POST | `/api/equipos` | JWT |
| GET | `/api/equipos/{id}` | JWT |
| GET | `/api/equipos/codigo/{codigo}` | JWT |
| PUT, DELETE | `/api/equipos/{id}` | JWT |
| PATCH | `/api/equipos/{id}/estado` | JWT |

Para probar rutas protegidas desde Swagger UI, inicia sesión en `/api/auth/login`
y usa **Authorize** con el valor `Bearer <token>`.
