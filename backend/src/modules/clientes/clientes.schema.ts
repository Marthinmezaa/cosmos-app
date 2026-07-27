import { z } from "zod";

const requerido = (campo: string) => ({ required_error: `${campo} es obligatorio` });

const clienteDatosSchema = z.object({
  cedula: z.string(requerido("La cédula")).trim().min(5, "Cédula inválida").max(20),
  nombre: z.string(requerido("El nombre")).trim().min(2, "El nombre es muy corto"),
  apellido: z.string(requerido("El apellido")).trim().min(2, "El apellido es muy corto"),
  telefono: z.string(requerido("El teléfono")).trim().min(6, "Teléfono inválido").max(20),
  // Sección "fechas" del formulario: si no se manda, la base usa CURRENT_DATE.
  fechaAlta: z.string().date("Fecha inválida (usar YYYY-MM-DD)").optional(),
});

const vehiculoDatosSchema = z.object({
  tipo: z.string(requerido("El tipo de vehículo")).trim().min(2, "El tipo de vehículo es obligatorio"),
  marca: z.string(requerido("La marca")).trim().min(1, "La marca es obligatoria"),
  modelo: z.string(requerido("El modelo")).trim().min(1, "El modelo es obligatorio"),
  anio: z.number(requerido("El año")).int().min(1900).max(2100),
  color: z.string().trim().min(1).optional(),
  chapa: z.string().trim().min(1).optional(),
  chasis: z.string().trim().min(1).optional(),
  kilometraje: z.number().int().min(0).optional().default(0),
});

const equipoDatosSchema = z.object({
  marcaEquipo: z.string(requerido("La marca del equipo")).trim().min(1, "La marca del equipo es obligatoria"),
  imei: z.string(requerido("El IMEI")).trim().min(6, "IMEI inválido"),
  numeroChip: z.string(requerido("El número de chip")).trim().min(6, "Número de chip inválido"),
  operadora: z.string(requerido("La operadora")).trim().min(2, "La operadora es obligatoria"),
});

const fotoSchema = z.object({
  urlR2: z.string(requerido("La URL de la foto")).url("URL de foto inválida"),
});

export const crearClienteSchema = z.object({
  cliente: clienteDatosSchema,
  vehiculo: vehiculoDatosSchema,
  equipo: equipoDatosSchema,
  fotos: z.array(fotoSchema).default([]),
});

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;

export const listarClientesQuerySchema = z.object({
  estado: z.enum(["activo", "suspendido"]).optional(),
  busqueda: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListarClientesQuery = z.infer<typeof listarClientesQuerySchema>;

export const actualizarClienteSchema = z
  .object({
    nombre: z.string().trim().min(2).optional(),
    apellido: z.string().trim().min(2).optional(),
    telefono: z.string().trim().min(6).max(20).optional(),
    estado: z.enum(["activo", "suspendido"]).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Enviá al menos un campo para actualizar",
  });

export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;

export const actualizarVehiculoSchema = z
  .object({
    tipo: z.string().trim().min(2).optional(),
    marca: z.string().trim().min(1).optional(),
    modelo: z.string().trim().min(1).optional(),
    anio: z.number().int().min(1900).max(2100).optional(),
    color: z.string().trim().min(1).optional(),
    chapa: z.string().trim().min(1).optional(),
    chasis: z.string().trim().min(1).optional(),
    kilometraje: z.number().int().min(0).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Enviá al menos un campo para actualizar",
  });

export type ActualizarVehiculoInput = z.infer<typeof actualizarVehiculoSchema>;

export const actualizarEquipoSchema = z
  .object({
    marcaEquipo: z.string().trim().min(1).optional(),
    imei: z.string().trim().min(6).optional(),
    numeroChip: z.string().trim().min(6).optional(),
    operadora: z.string().trim().min(2).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: "Enviá al menos un campo para actualizar",
  });

export type ActualizarEquipoInput = z.infer<typeof actualizarEquipoSchema>;
