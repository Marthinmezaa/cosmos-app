# Cosmostrak — Sistema Administrativo

Sistema web que reemplaza la planilla Excel (`migration/CLIENTES.xlsm`) de Cosmostrak,
una empresa de rastreo GPS vehicular en Paraguay.

## Stack

- **Backend**: Node.js + Express + TypeScript, PostgreSQL vía `pg`, migraciones con
  `node-pg-migrate` (SQL plano, sin ORM). Base de datos en Railway; el backend en sí
  **todavía no está desplegado** (ver `## Despliegue`) — hoy corre solo local con
  `npm run dev`, apuntando a la base real de Railway.
- **Frontend**: React + Vite + TypeScript, responsive (PC / tablet / celular). Tampoco
  desplegado todavía.
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

## Despliegue

**Estado actual (`2026-07-28`): nada desplegado todavía.** Solo la base de datos
Postgres vive en Railway. El backend y el frontend corren nada más cuando alguien los
prende a mano (`npm run dev`) en su propia máquina — no hay URL fija, no hay HTTPS, y
si se cierra la terminal se corta. Esto es suficiente para desarrollo, pero no para
que el cliente lo use día a día.

Pendiente para cuando se decida pasar a producción (no hacer nada de esto todavía,
son los pasos para esa instancia futura):

1. **Backend → Railway** (ya está ahí la base, mismo proyecto): crear un servicio
   Railway conectado a este repo (carpeta `backend/`), con build `npm run build`
   (`tsc -b`) y start `npm start` (`node dist/index.js`, ya definido en
   `package.json`). Variables de entorno que exige `src/config/env.ts`:
   - `DATABASE_URL` — ya existe en el proyecto Railway, se referencia sola si el
     servicio queda en el mismo proyecto que la base.
   - `JWT_SECRET` — mínimo 32 caracteres, **generar uno nuevo para producción**,
     nunca reusar el de `.env` local.
   - `CORS_ORIGIN` — la URL pública del frontend en producción (paso 2).
   - `NODE_ENV=production`.
   - `PORT` — Railway la inyecta sola, no hace falta setearla a mano.
   Antes de recibir tráfico real: correr `npm run migrate` contra la base de
   producción, y crear el admin real con `npm run seed:admin -- "Nombre" email
   password` (nunca dejar la contraseña temporal `DevTemp123!` de las pruebas de
   desarrollo — esa es solo de esta sesión de trabajo local).

2. **Frontend → decidir plataforma**: Railway (servicio estático aparte) o un host
   estático dedicado (Vercel / Netlify / Cloudflare Pages — cualquiera tiene un free
   tier de sobra para un panel administrativo de bajo tráfico). Build: `npm run
   build` (Vite). Variable de entorno en build time: `VITE_API_URL` apuntando a la
   URL pública del backend del paso 1.

3. **Dominio**: hoy no hay uno propio conectado. Cuando se elija (ej.
   `app.cosmostrak.com.py` para el frontend, `api.cosmostrak.com.py` para el
   backend), apuntar el DNS al proveedor elegido en cada paso — ambas plataformas
   dan HTTPS automático sobre dominio propio.

4. **Deploy automático (opcional)**: Railway y los hosts de frontend soportan
   conectar el repo de GitHub para redeployar solo con cada merge a `main` — evita
   tener que desplegar a mano después de cada release de `release-please`.

Ninguno de estos 4 pasos requiere tocar código de la aplicación — son configuración
de infraestructura en los dashboards de cada plataforma (necesita que el dueño del
proyecto cree/conecte esas cuentas).

## Estado del proyecto

Al `2026-07-28`: además de los 5 puntos iniciales (estructura del monorepo,
migración del esquema, autenticación con roles, CRUD de clientes, contratos con
generación automática de cuotas), están completos y verificados end-to-end contra
Postgres real en Railway:

- **Frontend completo** (React + Vite + Tailwind + react-router-dom): login, rutas
  protegidas por rol, layout con nav condicional, alta/listado/detalle+edición de
  clientes, alta/detalle+pago de contratos.
- **Dashboard con selector de mes/año** (`GET /api/dashboard?mes=&anio=`): cuotas del
  mes (total/pagada/vencida/vigente + %atraso + %pago), clientes activos,
  facturación, instalaciones del mes por tipo, y los widgets "de ahora mismo" (cuotas
  que vencen hoy/semana, clientes en mora) sin filtro de período. Reconstruido con
  gráficos reales (barras, meters, línea multi-año "avance anual" con tooltip)
  replicando el estilo de la hoja `DASH` del Excel original, siguiendo el skill
  interno de dataviz (paleta validada contra daltonismo).
- **Módulo caja** (`POST`/`GET /api/caja`, admin): carga manual de movimientos de
  ingreso/egreso — no se generan solos al pagar una cuota, es a propósito (igual que
  la hoja CAJA del Excel).
- **Módulo metas** (`POST`/`PATCH`/`GET /api/metas`, admin): meta de ventas mensual
  cargada directamente por el admin, en vez del cálculo de crecimiento interanual del
  Excel original.

Pendiente, fuera de alcance a propósito hasta que se pida explícitamente: portal de
cliente (solo placeholder), integración con Cloudflare R2 para fotos, envío de email
por SMTP, gestión de usuarios admin/vendedor desde el frontend (la API ya existe,
`POST /api/usuarios`), y el despliegue a producción (ver `## Despliegue` arriba).
