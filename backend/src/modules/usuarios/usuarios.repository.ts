import { pool } from "../../config/db";
import type { Rol } from "../../types/auth";

export interface UsuarioRow {
  id: number;
  nombre: string;
  email: string;
  password_hash: string;
  rol: Rol;
  cliente_id: number | null;
  activo: boolean;
  created_at: Date;
  updated_at: Date;
}

export async function findUsuarioByEmail(email: string): Promise<UsuarioRow | null> {
  const { rows } = await pool.query<UsuarioRow>("SELECT * FROM usuarios WHERE email = $1", [email]);
  return rows[0] ?? null;
}

export async function findUsuarioById(id: number): Promise<UsuarioRow | null> {
  const { rows } = await pool.query<UsuarioRow>("SELECT * FROM usuarios WHERE id = $1", [id]);
  return rows[0] ?? null;
}

export interface CreateUsuarioInput {
  nombre: string;
  email: string;
  passwordHash: string;
  rol: Rol;
  clienteId?: number | null;
}

export async function insertUsuario(input: CreateUsuarioInput): Promise<UsuarioRow> {
  const { rows } = await pool.query<UsuarioRow>(
    `INSERT INTO usuarios (nombre, email, password_hash, rol, cliente_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [input.nombre, input.email, input.passwordHash, input.rol, input.clienteId ?? null],
  );
  return rows[0];
}

export async function updatePasswordHash(id: number, passwordHash: string): Promise<void> {
  await pool.query("UPDATE usuarios SET password_hash = $1 WHERE id = $2", [passwordHash, id]);
}
