import { AppError, conflict } from "./errors";

interface PostgresError extends Error {
  code?: string;
  constraint?: string;
}

const UNIQUE_VIOLATION_MESSAGES: Record<string, string> = {
  clientes_cedula_key: "Ya existe un cliente con esa cédula",
  vehiculos_chapa_key: "Ya existe un vehículo con esa chapa",
  vehiculos_chasis_key: "Ya existe un vehículo con ese chasis",
  equipos_imei_key: "Ya existe un equipo con ese IMEI",
  equipos_numero_chip_key: "Ya existe un equipo con ese número de chip",
  usuarios_email_key: "Ya existe un usuario con ese email",
};

const POSTGRES_UNIQUE_VIOLATION = "23505";

/** Traduce una violación de constraint UNIQUE de Postgres a un error legible para el cliente HTTP. */
export function translatePgError(err: unknown): AppError | null {
  if (!(err instanceof Error)) return null;

  const pgError = err as PostgresError;
  if (pgError.code !== POSTGRES_UNIQUE_VIOLATION) return null;

  const message = (pgError.constraint && UNIQUE_VIOLATION_MESSAGES[pgError.constraint]) ?? "El registro ya existe";
  return conflict(message);
}
