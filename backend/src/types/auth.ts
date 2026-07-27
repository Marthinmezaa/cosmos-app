export type Rol = "admin" | "vendedor" | "cliente";

export interface AuthenticatedUser {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  clienteId: number | null;
  activo: boolean;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- forma oficial de extender los tipos de Express
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
