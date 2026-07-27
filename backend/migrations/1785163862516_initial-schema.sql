-- Up Migration

-- Función reutilizable para mantener "updated_at" al día en cada UPDATE.
CREATE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- clientes
-- ============================================================
CREATE TABLE clientes (
  id SERIAL PRIMARY KEY,
  cedula TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  telefono TEXT NOT NULL,
  -- Código legible derivado del id, ej. "CLI-000042". Se calcula solo, nunca se escribe a mano.
  id_cliente_code TEXT GENERATED ALWAYS AS ('CLI-' || lpad(id::text, 6, '0')) STORED,
  fecha_alta DATE NOT NULL DEFAULT CURRENT_DATE,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'suspendido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clientes_estado ON clientes (estado);

CREATE TRIGGER trg_clientes_updated_at
BEFORE UPDATE ON clientes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- usuarios
-- ============================================================
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK (rol IN ('admin', 'vendedor', 'cliente')),
  -- Solo se completa cuando rol = 'cliente': vincula la cuenta de login con su registro en clientes.
  cliente_id INTEGER REFERENCES clientes (id) ON DELETE CASCADE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_usuarios_cliente_rol CHECK ((rol = 'cliente') = (cliente_id IS NOT NULL)),
  CONSTRAINT uq_usuarios_cliente_id UNIQUE (cliente_id)
);

CREATE INDEX idx_usuarios_rol ON usuarios (rol);

CREATE TRIGGER trg_usuarios_updated_at
BEFORE UPDATE ON usuarios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- vehiculos
-- ============================================================
CREATE TABLE vehiculos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  marca TEXT NOT NULL,
  modelo TEXT NOT NULL,
  anio INTEGER NOT NULL CHECK (anio BETWEEN 1900 AND 2100),
  color TEXT,
  chapa TEXT UNIQUE,
  chasis TEXT UNIQUE,
  kilometraje INTEGER NOT NULL DEFAULT 0 CHECK (kilometraje >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vehiculos_cliente_id ON vehiculos (cliente_id);

CREATE TRIGGER trg_vehiculos_updated_at
BEFORE UPDATE ON vehiculos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- equipos
-- ============================================================
CREATE TABLE equipos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  marca_equipo TEXT NOT NULL,
  imei TEXT NOT NULL UNIQUE,
  numero_chip TEXT NOT NULL UNIQUE,
  operadora TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_equipos_cliente_id ON equipos (cliente_id);

CREATE TRIGGER trg_equipos_updated_at
BEFORE UPDATE ON equipos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- fotos
-- ============================================================
CREATE TABLE fotos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id) ON DELETE CASCADE,
  url_r2 TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_fotos_cliente_id ON fotos (cliente_id);

-- ============================================================
-- config_precios
-- ============================================================
CREATE TABLE config_precios (
  id SERIAL PRIMARY KEY,
  tipo_vehiculo TEXT NOT NULL UNIQUE,
  precio NUMERIC(12, 2) NOT NULL CHECK (precio >= 0),
  pct_comision NUMERIC(5, 2) NOT NULL CHECK (pct_comision BETWEEN 0 AND 100),
  plataforma NUMERIC(12, 2) NOT NULL CHECK (plataforma >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_config_precios_updated_at
BEFORE UPDATE ON config_precios
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- contratos
-- ============================================================
CREATE TABLE contratos (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes (id) ON DELETE RESTRICT,
  -- El vendedor se completa automáticamente con el usuario logueado (regla de negocio, no se edita a mano).
  vendedor_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
  instalador TEXT,
  precio_normal NUMERIC(12, 2) NOT NULL CHECK (precio_normal >= 0),
  precio_promocional NUMERIC(12, 2) NOT NULL CHECK (precio_promocional >= 0 AND precio_promocional <= precio_normal),
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  tipo_venta TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contratos_cliente_id ON contratos (cliente_id);
CREATE INDEX idx_contratos_vendedor_id ON contratos (vendedor_id);

CREATE TRIGGER trg_contratos_updated_at
BEFORE UPDATE ON contratos
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- cuotas
-- ============================================================
CREATE TABLE cuotas (
  id SERIAL PRIMARY KEY,
  contrato_id INTEGER NOT NULL REFERENCES contratos (id) ON DELETE CASCADE,
  numero_cuota INTEGER NOT NULL CHECK (numero_cuota > 0),
  fecha_vencimiento DATE NOT NULL,
  fecha_pago DATE,
  monto_pagado NUMERIC(12, 2) CHECK (monto_pagado IS NULL OR monto_pagado >= 0),
  monto_a_cobrar NUMERIC(12, 2) NOT NULL CHECK (monto_a_cobrar >= 0),
  -- Solo se almacenan los estados verificables por un hecho concreto (¿se pagó o no?).
  -- La mora/vencimiento se calcula en tiempo real a partir de fecha_vencimiento (ver regla de negocio 6).
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada')),
  cobrador TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cuotas_contrato_numero UNIQUE (contrato_id, numero_cuota),
  CONSTRAINT chk_cuotas_pago_consistente CHECK ((estado = 'pagada') = (fecha_pago IS NOT NULL))
);

CREATE INDEX idx_cuotas_contrato_id ON cuotas (contrato_id);
CREATE INDEX idx_cuotas_fecha_vencimiento ON cuotas (fecha_vencimiento);
CREATE INDEX idx_cuotas_estado_vencimiento ON cuotas (estado, fecha_vencimiento);

CREATE TRIGGER trg_cuotas_updated_at
BEFORE UPDATE ON cuotas
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- caja
-- ============================================================
CREATE TABLE caja (
  id SERIAL PRIMARY KEY,
  cuota_id INTEGER REFERENCES cuotas (id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  categoria TEXT NOT NULL,
  monto NUMERIC(12, 2) NOT NULL CHECK (monto > 0),
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  concepto TEXT,
  receptor TEXT,
  emisor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_caja_cuota_id ON caja (cuota_id);
CREATE INDEX idx_caja_fecha ON caja (fecha);
CREATE INDEX idx_caja_tipo ON caja (tipo);

CREATE TRIGGER trg_caja_updated_at
BEFORE UPDATE ON caja
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- costos_cliente
-- ============================================================
CREATE TABLE costos_cliente (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL UNIQUE REFERENCES clientes (id) ON DELETE CASCADE,
  equipo NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (equipo >= 0),
  chip_mes NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (chip_mes >= 0),
  plataforma_mes NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (plataforma_mes >= 0),
  comision_venta NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (comision_venta >= 0),
  instalacion NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (instalacion >= 0),
  marketing NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (marketing >= 0),
  gastos_adm NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (gastos_adm >= 0),
  cobranza_mes NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (cobranza_mes >= 0),
  -- Suma de los costos de la misma fila: la calcula Postgres, nunca hay que sincronizarla a mano.
  costo_total NUMERIC(12, 2) GENERATED ALWAYS AS (
    equipo + chip_mes + plataforma_mes + comision_venta + instalacion + marketing + gastos_adm + cobranza_mes
  ) STORED,
  -- A diferencia de costo_total, saldo depende de pagos en otras tablas (cuotas/caja) y lo mantiene la
  -- lógica de aplicación, no la base de datos.
  saldo NUMERIC(12, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_costos_cliente_updated_at
BEFORE UPDATE ON costos_cliente
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- cierres_comision
-- ============================================================
CREATE TABLE cierres_comision (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios (id) ON DELETE RESTRICT,
  periodo TEXT NOT NULL CHECK (periodo ~ '^\d{4}-(0[1-9]|1[0-2])$'),
  monto NUMERIC(12, 2) NOT NULL CHECK (monto >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_cierres_comision_usuario_periodo UNIQUE (usuario_id, periodo)
);

CREATE TRIGGER trg_cierres_comision_updated_at
BEFORE UPDATE ON cierres_comision
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE IF EXISTS cierres_comision;
DROP TABLE IF EXISTS costos_cliente;
DROP TABLE IF EXISTS caja;
DROP TABLE IF EXISTS cuotas;
DROP TABLE IF EXISTS contratos;
DROP TABLE IF EXISTS config_precios;
DROP TABLE IF EXISTS fotos;
DROP TABLE IF EXISTS equipos;
DROP TABLE IF EXISTS vehiculos;
DROP TABLE IF EXISTS usuarios;
DROP TABLE IF EXISTS clientes;
DROP FUNCTION IF EXISTS set_updated_at();
