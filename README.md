# COMPIX

Sistema de Gestión de Inventario de Equipos de Cómputo.

## Integrantes
- Valeria Segovia Espinoza
- Julio Gael Gonzalez Maldonado

## Descripción
Aplicación web para registrar, consultar y administrar equipos de cómputo.

## API

La API ASP.NET Core se encuentra en `Compix.Api`. Los endpoints protegidos requieren
un token Bearer obtenido con `POST /api/auth/login`.

Además de usuarios TI, departamentos, empleados y equipos, incluye:

- `api/asignaciones`: consulta de asignaciones activas e históricas, asignación,
  reasignación y devolución de equipos.
- `api/mantenimientos`: consulta de mantenimientos abiertos e históricos,
  ingreso de equipos al taller y cierre con la solución aplicada.
- `api/historial`: bitácora general y trazabilidad individual por equipo.
- `api/dashboard/resumen`: contadores de equipos totales, activos, en mantenimiento
  y disponibles.

Las operaciones de asignación, devolución y mantenimiento actualizan el estado del
equipo y registran el movimiento correspondiente en una transacción. Los ejemplos
de solicitudes y respuestas están en `Compix.Api/Compix.Api.http`.
