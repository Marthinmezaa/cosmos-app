-- Up Migration

-- Credenciales del cliente en Trakzee (plataforma externa de rastreo GPS que usan
-- para ver su vehiculo/flota, ver https://trakzee.uffizio.com). No son credenciales
-- de cosmos-app: el cliente nunca entra a este sistema, solo el staff (admin/vendedor)
-- las consulta aca para pasarselas al cliente si se las olvida. Por eso van en texto
-- plano, igual que en la columna CONTRASEÑA del Excel original: no es un secreto que
-- cosmos-app deba proteger con hash, es un dato de referencia de un sistema ajeno.
ALTER TABLE clientes
  ADD COLUMN trakzee_usuario TEXT,
  ADD COLUMN trakzee_password TEXT;

-- Down Migration

ALTER TABLE clientes
  DROP COLUMN trakzee_usuario,
  DROP COLUMN trakzee_password;
