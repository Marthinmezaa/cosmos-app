import { Pool, types } from "pg";
import { env } from "./env";

// El parser default de pg convierte DATE (oid 1082) a un objeto Date de JS a medianoche
// UTC, lo que corre la fecha un día según el timezone del server al serializarla. Como
// el resto del código ya trata estas columnas como texto "YYYY-MM-DD", se desactiva ese
// parseo para que pg devuelva el string tal cual sale de Postgres.
types.setTypeParser(1082, (value: string) => value);

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err);
});

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("No se pudo conectar a la base de datos:", err);
    return false;
  }
}
