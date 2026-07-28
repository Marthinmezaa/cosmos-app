import type { Rol } from "./types";

// A dónde mandar a cada rol al loguearse o al toparse con una ruta que no le corresponde
// (evita loops de redirección: nunca apunta a una ruta que el propio rol no pueda ver).
export function defaultPathForRol(rol: Rol): string {
  switch (rol) {
    case "admin":
      return "/";
    case "vendedor":
      return "/clientes/nuevo";
    case "cliente":
      return "/mi-cuenta";
  }
}
