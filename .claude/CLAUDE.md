# Cosmostrak — Sistema Administrativo

Sistema web que reemplaza la planilla Excel (`migration/CLIENTES.xlsm`) de Cosmostrak,
una empresa de rastreo GPS vehicular en Paraguay.

## Stack

- **Backend**: Node.js + Express + TypeScript, PostgreSQL vía `pg`, migraciones con
  `node-pg-migrate` (SQL plano, sin ORM). Desplegado en Railway.
- **Frontend**: React + Vite + TypeScript, responsive (PC / tablet / celular).
- **Fotos**: Cloudflare R2.
- **Email**: SMTP con `info@cosmostrak.com.py`.
- **Monorepo**: npm workspaces (`backend/`, `frontend/`).

## Filosofía de código

- Clean Code: funciones chicas de un solo propósito, nombres descriptivos, sin duplicación.
- Ponytail: antes de escribir código nuevo, evaluar si hace falta, si ya existe en el
  proyecto, o si lo resuelve la librería estándar o una dependencia ya instalada.
- Nunca sacrificar seguridad, validaciones ni manejo de errores por escribir menos código.
- Contraseñas siempre con `bcryptjs` (nunca `bcrypt` nativo — evita dependencias de
  compilación nativa y su cadena de `node-pre-gyp`/`tar` vulnerable).

## Roles

- **admin**: acceso total.
- **vendedor**: solo puede dar de alta clientes (datos personales, vehículo, equipo, fotos
  opcionales). No ve caja, stock, comisiones ni otros clientes.
- **cliente**: portal de solo lectura de su propio estado de cuenta (cuotas, vencimientos).

## Reglas de negocio clave

1. Ventana de descuento por cuota: desde la fecha de vencimiento hasta +5 días se cobra
   `precio_promocional` del contrato; pasada esa ventana, `precio_normal` como multa.
2. Pago de varios meses adelantados: todas esas cuotas quedan pagadas al precio
   promocional, y se genera una alerta de renovación al llegar el mes siguiente sin pago.
3. 3+ meses de mora → alerta visual. La desactivación del servicio es siempre manual
   (admin), nunca automática.
4. Contraseñas nunca en texto plano. El admin puede resetear la contraseña de un cliente
   (genera una nueva; nunca visualiza la actual).
5. El campo "vendedor" en el alta de cliente se completa automáticamente con el usuario
   logueado — nunca se escribe a mano.
6. Dashboard (cuotas que vencen hoy/semana, ingresos/egresos del mes, instalaciones por
   tipo de vehículo, clientes en mora) se calcula en tiempo real vía queries, sin tablas
   redundantes tipo "moras" separadas.

## Flujo de Git

- `main` protegida: nunca se commitea directo ahí.
- Cada cambio → rama nueva → Pull Request → pasa `devsecops.yml` → recién ahí se mergea.
- Versionado y changelog automático vía `release-please.yml` (paquetes `backend` y
  `frontend` versionados independientemente, ver `release-please-config.json`).

## Estado del proyecto

Ver el chat/PRs para el estado actual. En bootstrap inicial (estructura + conexión DB)
al `2026-07-27`. Los siguientes pasos planeados: migraciones del esquema completo,
autenticación con roles, CRUD de clientes (accesible para vendedor), generación
automática de cuotas al crear un contrato.
