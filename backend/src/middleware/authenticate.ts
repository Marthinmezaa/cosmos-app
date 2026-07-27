import { findUsuarioById } from "../modules/usuarios/usuarios.repository";
import { asyncHandler } from "../utils/async-handler";
import { unauthorized } from "../utils/errors";
import { verifyAccessToken } from "../utils/jwt";

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    throw unauthorized("Falta el token de autenticación");
  }

  const token = header.slice("Bearer ".length);

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    throw unauthorized("Token inválido o expirado");
  }

  // Se vuelve a consultar la base en cada request (en vez de confiar solo en el JWT)
  // para que una desactivación de cuenta tenga efecto inmediato, no recién cuando expire el token.
  const usuario = await findUsuarioById(payload.sub);
  if (!usuario || !usuario.activo) {
    throw unauthorized("La cuenta ya no está activa");
  }

  req.user = {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    clienteId: usuario.cliente_id,
    activo: usuario.activo,
  };

  next();
});
