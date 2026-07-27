import { findUsuarioByEmail } from "../usuarios/usuarios.repository";
import { toPublicUsuario } from "../usuarios/usuarios.service";
import { unauthorized } from "../../utils/errors";
import { signAccessToken } from "../../utils/jwt";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "../../utils/password";
import type { LoginInput } from "./auth.schema";

export async function login({ email, password }: LoginInput) {
  const usuario = await findUsuarioByEmail(email);

  // Se compara siempre contra un hash (real o "dummy") para que el tiempo de respuesta
  // no delate si el email existe o no.
  const passwordValida = await verifyPassword(password, usuario?.password_hash ?? DUMMY_PASSWORD_HASH);

  if (!usuario || !usuario.activo || !passwordValida) {
    throw unauthorized("Email o contraseña incorrectos");
  }

  const token = signAccessToken({
    sub: usuario.id,
    rol: usuario.rol,
    clienteId: usuario.cliente_id,
  });

  return { token, usuario: toPublicUsuario(usuario) };
}
