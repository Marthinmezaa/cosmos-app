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

## Modelo de datos

Migración inicial en `backend/migrations/..._initial-schema.sql` (`node-pg-migrate`,
SQL plano). Decisiones no explícitas en el pedido original, agregadas por necesidad:

- `usuarios.cliente_id` (nullable, UNIQUE): vincula la cuenta de login de un cliente
  con su registro en `clientes`. Constraint `chk_usuarios_cliente_rol` obliga a que
  esté seteado si y solo si `rol = 'cliente'`.
- `cuotas.estado` solo admite `pendiente`/`pagada` (hechos verificables). La mora o el
  vencimiento NO se almacenan — se calculan en cada consulta comparando
  `fecha_vencimiento` con `CURRENT_DATE` (regla de negocio 6, sin tablas redundantes).
- `clientes.id_cliente_code` y `costos_cliente.costo_total` son columnas `GENERATED
  ALWAYS AS ... STORED`: Postgres las calcula solas, nunca hay que sincronizarlas
  desde el código de aplicación.
- `costos_cliente.saldo` sí es una columna libre (no generada), porque depende de
  pagos en otras tablas (`cuotas`/`caja`) — la mantiene la lógica de aplicación.

## Estado del proyecto

Al `2026-07-27`: estructura del monorepo y conexión a Postgres en Railway (punto 1)
y migración inicial del esquema completo (punto 2) completados y verificados contra
la base real de Railway. Siguientes pasos planeados: autenticación con roles, CRUD de
clientes (accesible para vendedor), generación automática de cuotas al crear un
contrato.
