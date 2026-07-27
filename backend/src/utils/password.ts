import { randomInt } from "crypto";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Hash válido pero de una contraseña que nadie usa: se compara contra él cuando el
// email no existe, para que el login tarde lo mismo con o sin cuenta real y no se
// pueda enumerar usuarios midiendo el tiempo de respuesta.
export const DUMMY_PASSWORD_HASH = "$2a$12$5/SQUVmMsori4poXpphWTOAtpZOrcZhizSDh29ntHLLUy26qREyym";

export function hashPassword(plainPassword: string): Promise<string> {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, passwordHash);
}

// No es un secreto: es el alfabeto para generar contraseñas temporales al azar.
const TEMP_PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"; // gitleaks:allow

export function generateTemporaryPassword(length = 12): string {
  let password = "";
  for (let i = 0; i < length; i++) {
    password += TEMP_PASSWORD_ALPHABET[randomInt(TEMP_PASSWORD_ALPHABET.length)];
  }
  return password;
}
