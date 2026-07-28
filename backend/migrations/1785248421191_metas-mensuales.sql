-- Up Migration

-- Meta de ventas (instalaciones) por mes/anio, cargada a mano por el admin. Reemplaza el
-- calculo de crecimiento interanual del Excel original (METAS 2026) por una meta directa:
-- mas simple de mantener y no depende de un historico 2024/2025 que no existe en la base.
CREATE TABLE metas_mensuales (
  id SERIAL PRIMARY KEY,
  mes INTEGER NOT NULL CHECK (mes BETWEEN 1 AND 12),
  anio INTEGER NOT NULL CHECK (anio >= 2000),
  meta_ventas INTEGER NOT NULL CHECK (meta_ventas >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_metas_mensuales_mes_anio UNIQUE (mes, anio)
);

CREATE TRIGGER trg_metas_mensuales_updated_at
BEFORE UPDATE ON metas_mensuales
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Down Migration

DROP TABLE IF EXISTS metas_mensuales;
