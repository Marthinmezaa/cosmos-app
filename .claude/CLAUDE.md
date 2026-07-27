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

## Autenticación

JWT en `Authorization: Bearer <token>` (no cookies), expiración 8h. Middlewares en
`src/middleware/`: `authenticate` (valida el JWT y vuelve a consultar `usuarios` en
cada request para que una cuenta desactivada deje de funcionar al instante, no recién
cuando expire el token) y `authorize(...roles)` para RBAC. Login normaliza el email a
minúsculas y compara siempre contra un hash bcrypt (real o "dummy") para no filtrar,
por tiempo de respuesta, si un email existe. Rate limit de 10 intentos/15min en
`/api/auth/login`.

Cuentas `admin`/`vendedor` se crean vía `POST /api/usuarios` (solo admin). Cuentas
`cliente` NO se crean ahí — se generan junto con el alta de cliente (punto 4). El
primer admin se crea con `npm run seed:admin --workspace backend -- "Nombre" email
password`, ya que la API de creación de usuarios requiere ser admin.

`POST /api/usuarios/:id/reset-password` (admin) genera una contraseña temporal nueva
y la devuelve una única vez en la respuesta — nunca se puede leer la contraseña
actual (regla de negocio 4). Envío de esa contraseña por email (SMTP) queda
pendiente para cuando se configure `info@cosmostrak.com.py`.

## CRUD de clientes

`POST /api/clientes` (admin o vendedor) crea cliente + vehículo + equipo + fotos en
una sola transacción (todo o nada). El resto de operaciones (`GET /api/clientes`,
`GET /api/clientes/:id`, `PATCH /api/clientes/:id`, `.../vehiculo`, `.../equipo`) son
solo para admin — el vendedor, por regla de negocio, únicamente da de alta, nunca
lista ni edita clientes existentes.

Decisión de alcance (confirmada con el usuario): el alta de cliente NO crea el
contrato. `contratos.vendedor_id` (autocompletado con el usuario logueado, regla de
negocio 5) y la generación de cuotas se resuelven en un paso aparte (punto 5).

Las fotos se reciben como URLs ya subidas (`url_r2`) — la integración real con
Cloudflare R2 (presigned upload) todavía no está conectada.

Violaciones de UNIQUE (cédula, chapa, chasis, IMEI, número de chip) se traducen a
mensajes en español vía `utils/db-errors.ts` en vez de exponer el error crudo de
Postgres.

## Contratos y generación de cuotas

Confirmado con el usuario: el servicio es una **suscripción mensual indefinida**, no
un plan de N cuotas fijas. Esto define todo el diseño:

- `POST /api/contratos` (admin o vendedor): crea el contrato y su **cuota #1** en la
  misma transacción (`fecha_vencimiento = fecha_inicio`, `monto_a_cobrar =
  precio_promocional`). `vendedor_id` sale siempre de `req.user`, nunca del body
  (regla de negocio 5) — probado enviando un `vendedorId` falso y confirmando que se
  ignora. Rechaza clientes inexistentes (404) o suspendidos (400).
- `POST /api/contratos/:id/pagos` (solo admin, por manejo de dinero): paga
  `cantidadMeses` (default 1) cuotas. Cada pago decide el monto en SQL, no en JS
  (`utils` no interviene, ver `cuotas.repository.ts`): si `fechaPago <=
  fecha_vencimiento + 5 días` cobra `precio_promocional`, si no, `precio_normal`
  como multa (regla 1). **No hace falta lógica aparte para "pago adelantado" (regla
  2)**: pagar una cuota futura antes de su vencimiento siempre cae dentro de la
  ventana con la misma fórmula, así que el precio promocional sale solo.
- Después de cada pago, si no queda ninguna cuota `pendiente` se genera la
  siguiente automáticamente (`numero_cuota + 1`, un mes después). Así siempre hay
  una única cuota "en juego" por contrato — nunca se acumulan cuotas futuras sin
  resolver mientras la actual sigue impaga. La cuota vieja sin pagar seguirá
  apareciendo como mora en el cálculo en tiempo real de la regla 6, sin necesidad de
  un cron ni de una tabla de "renovaciones".
- Fuera de alcance a propósito (no pedido en el plan de 5 puntos original): no se
  crea ninguna fila en `caja` al pagar una cuota todavía. Eso es un feature de
  cobranza/caja aparte, pendiente para cuando se pida explícitamente.

## Estado del proyecto

Al `2026-07-27`: los 5 puntos iniciales están completos y verificados end-to-end
contra Postgres real en Railway — estructura del monorepo (1), migración del esquema
(2), autenticación con roles (3), CRUD de clientes (4), y contratos con generación
automática de cuotas (5).
