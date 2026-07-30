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
  **En la práctica nadie usa este rol** (ver `## Portal de cliente`): el cliente real
  nunca entra a cosmos-app, entra a Trakzee (plataforma externa de rastreo) desde el
  link de cosmostrak.com.

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

Las fotos se reciben como URLs ya subidas (`url_r2`), obtenidas subiendo el
archivo a Cloudflare R2 con URL prefirmada (ver `## Fotos en Cloudflare R2`).

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

Pendiente, fuera de alcance a propósito hasta que se pida explícitamente:
envío de email por SMTP, gestión de usuarios admin/vendedor desde el frontend
(la API ya existe, `POST /api/usuarios`), y el despliegue a producción (ver
`## Despliegue` arriba).

## Fotos en Cloudflare R2

Hecho el `2026-07-30`: reemplaza el campo de "pegar URL ya subida" del alta
de cliente por una subida real. R2 es compatible con la API de S3, así que
se usa el SDK oficial de AWS (`@aws-sdk/client-s3` +
`@aws-sdk/s3-request-presigner`) apuntando al endpoint de Cloudflare.

- `POST /api/uploads/presign` (admin o vendedor, mismos roles que el alta de
  cliente): recibe `contentType` (solo `image/jpeg`/`png`/`webp`) y devuelve
  `{ uploadUrl, publicUrl }`. `uploadUrl` es una URL prefirmada de `PUT`
  válida 5 minutos; `publicUrl` es la URL final del archivo. La `key` del
  objeto siempre es un UUID generado en el backend (`clientes/<uuid>.<ext>`),
  nunca el nombre de archivo del usuario — evita colisiones y nombres que
  rompan la URL.
- El navegador sube el archivo **directo a R2** con ese `uploadUrl` (`fetch`
  con `method: "PUT"`), sin pasar por nuestro servidor — más rápido y no le
  carga tráfico/almacenamiento temporal a Railway.
  `frontend/src/api/uploads.ts` (`subirFoto`) encapsula las dos llamadas
  (pedir la URL prefirmada + subir el archivo). `ClienteAltaPage.tsx` sube
  cada foto apenas se selecciona (no espera al submit del formulario) y
  bloquea el botón de "Registrar cliente" mientras haya alguna subida en
  curso.
- Variables de entorno nuevas en `src/config/env.ts` (obligatorias, sin
  default — el server no arranca sin ellas): `R2_ACCOUNT_ID`,
  `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`,
  `R2_PUBLIC_URL_BASE`. Se generan desde el dashboard de Cloudflare, sección
  **R2 Object Storage → Manage R2 API Tokens** (ojo: **no** sirve un token
  creado desde "Manage Account" / API Tokens general de la cuenta — R2 tiene
  su propio sistema de tokens con credenciales estilo S3
  Access Key/Secret Key; el token general de Cloudflare no es compatible con
  este flujo y devuelve 403 Access Denied). El bucket real de producción se
  llama `cosmostrak-fotos` (nombrado así en el dashboard; el token de acceso
  se llama `cosmos-token-r2` — son cosas distintas, no confundir el nombre
  del token con el nombre del bucket al configurar `R2_BUCKET_NAME`).
- El bucket tiene acceso público habilitado vía subdominio `r2.dev`
  (`R2_PUBLIC_URL_BASE`); para producción real convendría un dominio propio
  conectado al bucket en vez de depender del subdominio `r2.dev`
  (no resuelto en esta sesión).
- Verificado de punta a punta contra el bucket real: presign, `PUT` del
  archivo, `GET` público del resultado (200, `image/png`), y borrado del
  objeto de prueba.

## Portal de cliente (infraestructura sin uso activo)

Hecho el `2026-07-30`, y **corregido el mismo día** tras aclarar con el usuario
cómo funciona realmente el acceso de clientes: los clientes de Cosmostrak
**nunca entran a cosmos-app**. El link "acceso a clientes" de cosmostrak.com
los manda a Trakzee (`https://trakzee.uffizio.com`), una plataforma externa de
rastreo GPS ajena a este sistema, donde ven su vehículo/flota con credenciales
de esa plataforma — no de acá. La columna CONTRASEÑA del Excel migrado (nunca
importada, ver `## Migración de datos históricos del Excel`) guardaba esas
credenciales de Trakzee para que el staff las consultara si el cliente se las
olvidaba, no contraseñas de un login propio.

Dado esto, el rol `cliente` (JWT, `usuarios.cliente_id`,
`GET /api/portal/estado-cuenta` en `backend/src/modules/portal/`, la página
`/mi-cuenta`) se **mantiene tal cual está construido, pero es infraestructura
sin uso activo**: nadie va a loguearse con ese rol en el uso real de la
aplicación, y a propósito no existe ningún flujo que cree cuentas `cliente`
(ni el alta de cliente, ni la migración del Excel crean una). No es un bug ni
un hueco pendiente — es la decisión confirmada con el usuario. Si en el futuro
se decide dar acceso directo a clientes, ahí sí habría que construir el flujo
de creación de esas cuentas; hasta entonces, no tocar.

## Credenciales de Trakzee por cliente

Hecho el `2026-07-30`, para reemplazar la columna CONTRASEÑA (y USUARIO) del
Excel: `clientes.trakzee_usuario` / `clientes.trakzee_password`
(`backend/migrations/..._clientes-credenciales-trakzee.sql`), dos columnas de
texto libre, nullable, editables por admin o vendedor en el alta
(`POST /api/clientes`) y por admin en la edición (`PATCH /api/clientes/:id`).

- **Se guardan en texto plano a propósito**: no son un secreto que cosmos-app
  deba proteger (no es la contraseña de ningún usuario de este sistema), son
  un dato de referencia de una plataforma externa — el staff necesita poder
  leerlas tal cual para pasárselas al cliente si se las olvida, igual que las
  tenían en el Excel. Por eso no pasan por `bcryptjs` ni por el flujo de
  `usuarios`/`authenticate`.
- Ambos campos son opcionales: no todo cliente tiene Trakzee cargado todavía
  (y los 177 clientes migrados del Excel no tienen estos datos — quedaron sin
  importar cuando se hizo la migración histórica, antes de que existieran
  estas columnas; cargarlos es una tarea de datos aparte, no resuelta acá).
- Verificado contra la base real de Railway: alta con credenciales, edición
  parcial (solo password), y borrado del registro de prueba.

## Migración de datos históricos del Excel

Hecha el `2026-07-28`: los datos reales de `migration/CLIENTES.xlsm` ya están
importados en la base de Railway — 177 clientes, 216 vehículos/equipos/contratos,
1.870 cuotas históricas, 203 registros de costos y 1.587 movimientos de caja. El
script vivió fuera del repo (scratchpad de la sesión, nunca commiteado) porque el
paquete `xlsx` de npm tiene vulnerabilidades altas sin fix disponible — no vale la
pena sumarlo como dependencia permanente para algo que corre una sola vez.

Decisiones tomadas durante la importación:

- Clientes con cédula/IMEI/número de chip faltante en el Excel se importaron con un
  placeholder único (`SIN-CEDULA-0042`, `SIN-IMEI-0042`, etc.) para completar a mano
  después.
- Clientes con flota real (mismo cliente, varios vehículos — ej. RH Transport S.A.
  con 9, otro cliente con 14) se importaron como un solo `cliente` con varios
  `vehiculos`/`equipos`/`contratos`. La base ya soporta esto a nivel de tabla; la
  UI del detalle de cliente todavía solo muestra un vehículo/equipo por cliente
  (pendiente si hace falta una vista de flota más adelante).
- 25 filas del Excel quedaron **afuera** de esta importación por tener datos
  físicamente imposibles (misma chapa o IMEI en dos personas distintas). Hay que
  cargarlas a mano una vez que se confirme cuál dato es el correcto en cada caso.
- Se creó una cuenta de usuario (rol vendedor) por cada valor distinto de la columna
  VENDEDOR del Excel, incluyendo canales de venta (Instagram, Facebook, WhatsApp,
  Demo, Cliente/referido) además de las 7 personas reales — para no perder el
  registro de cómo entró cada venta. Todas con contraseña aleatoria; si alguna
  persona real necesita loguearse, el admin le resetea la contraseña desde la app.
- Cuotas "Exonerado" del Excel → `pagada` con monto 0. "Desinstalado" → sin cuota
  pendiente (contrato cerrado). De las cuotas sin pagar, solo se importó la más
  antigua como la cuota "en juego" de cada contrato — el resto eran los 12 meses
  pre-generados del Excel que nuestro modelo de suscripción indefinida no replica.
- Las contraseñas en texto plano que tenía el Excel (columna CONTRASEÑA) **nunca se
  importaron**.
- `costos_cliente` (desde la hoja DATOS ADM) quedó con una limitación menor: para
  los clientes con flota, solo se guardó el costo de uno de sus vehículos, no la
  suma de todos (la tabla es una fila por cliente, no por vehículo). No es
  incorrecto, pero está incompleto para esos ~9 clientes puntuales.

La importación reveló y corrigió un bug real preexistente en el dashboard
(`listInstalacionesDelMesPorTipo` contaba de más para clientes con flota por un
JOIN sin distinct — invisible hasta que hubo un cliente real con varios vehículos
y varios contratos a la vez).
