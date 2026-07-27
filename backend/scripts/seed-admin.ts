import "dotenv/config";
import { z } from "zod";
import { pool } from "../src/config/db";
import { hashPassword } from "../src/utils/password";

const argsSchema = z.tuple([
  z.string().trim().min(2, "El nombre es muy corto"),
  z
    .string()
    .email("Email inválido")
    .transform((email) => email.trim().toLowerCase()),
  z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
]);

async function main() {
  const parsed = argsSchema.safeParse(process.argv.slice(2));
  if (!parsed.success) {
    console.error('Uso: npm run seed:admin -- "Nombre Admin" admin@cosmostrak.com.py \'ContraseñaSegura123!\'');
    console.error(parsed.error.issues.map((issue) => issue.message).join("\n"));
    process.exitCode = 1;
    return;
  }

  const [nombre, email, password] = parsed.data;

  const existente = await pool.query("SELECT id FROM usuarios WHERE email = $1", [email]);
  if (existente.rows.length > 0) {
    console.error(`Ya existe un usuario con el email ${email}`);
    process.exitCode = 1;
    return;
  }

  const passwordHash = await hashPassword(password);
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES ($1, $2, $3, 'admin') RETURNING id, email`,
    [nombre, email, passwordHash],
  );

  console.log("Admin creado:", rows[0]);
}

main()
  .catch((err) => {
    console.error("Error al crear el admin:", err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
