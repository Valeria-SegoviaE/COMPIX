# COMPIX – Sistema de Inventario de Equipos de Cómputo

Estructura del proyecto:

- `frontend/` React 19 + TypeScript + Vite + Tailwind 4 (responsabilidad de Val)
- `backend/` API (responsabilidad de Julio, aún no creada)
- `docs/` diagramas C4 y documentación
- `.github/workflows/` automatización de pruebas y compilación

## Ejecutar el frontend

```bash
cd frontend
npm install
npm run dev
```

## Notas

- Los datos son de ejemplo y viven en `frontend/src/services/`. Al conectar la API de Julio solo se reemplazan esas funciones.
- El inicio de sesión es simulado (`services/auth.ts`).
