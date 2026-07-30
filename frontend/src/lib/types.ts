export type Rol = "admin" | "vendedor" | "cliente";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  clienteId: number | null;
  activo: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  usuario: Usuario;
}

export type EstadoCliente = "activo" | "suspendido";

export interface Cliente {
  id: number;
  cedula: string;
  nombre: string;
  apellido: string;
  telefono: string;
  idClienteCode: string;
  fechaAlta: string;
  estado: EstadoCliente;
  trakzeeUsuario: string | null;
  trakzeePassword: string | null;
}

export interface Vehiculo {
  id: number;
  tipo: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string | null;
  chapa: string | null;
  chasis: string | null;
  kilometraje: number;
}

export interface Equipo {
  id: number;
  marcaEquipo: string;
  imei: string;
  numeroChip: string;
  operadora: string;
}

export interface Foto {
  id: number;
  urlR2: string;
}

export interface ClienteCompleto {
  cliente: Cliente;
  vehiculo: Vehiculo | null;
  equipo: Equipo | null;
  fotos: Foto[];
}

export interface ListarClientesResponse {
  data: Cliente[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CrearClienteInput {
  cliente: {
    cedula: string;
    nombre: string;
    apellido: string;
    telefono: string;
    fechaAlta?: string;
    trakzeeUsuario?: string;
    trakzeePassword?: string;
  };
  vehiculo: {
    tipo: string;
    marca: string;
    modelo: string;
    anio: number;
    color?: string;
    chapa?: string;
    chasis?: string;
    kilometraje?: number;
  };
  equipo: {
    marcaEquipo: string;
    imei: string;
    numeroChip: string;
    operadora: string;
  };
  fotos: { urlR2: string }[];
}

export interface Contrato {
  id: number;
  clienteId: number;
  vendedorId: number;
  instalador: string | null;
  precioNormal: string;
  precioPromocional: string;
  fechaInicio: string;
  tipoVenta: string;
}

export type EstadoCuota = "pendiente" | "pagada";

export interface Cuota {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string;
  fechaPago: string | null;
  montoPagado: string | null;
  montoACobrar: string;
  estado: EstadoCuota;
  cobrador: string | null;
}

export interface ContratoConCuotas {
  contrato: Contrato;
  cuotas: Cuota[];
}

export interface CrearContratoInput {
  clienteId: number;
  instalador?: string;
  precioNormal: number;
  precioPromocional: number;
  fechaInicio?: string;
  tipoVenta: string;
}

export interface CrearContratoResponse {
  contrato: Contrato;
  primeraCuota: Cuota;
}

export interface PagarCuotasInput {
  cantidadMeses?: number;
  fechaPago?: string;
  cobrador?: string;
}

export interface PagarCuotasResponse {
  cuotasPagadas: Cuota[];
  siguienteCuota: Cuota;
}

export interface CuotaProxima {
  cuotaId: number;
  contratoId: number;
  clienteId: number;
  clienteNombre: string;
  numeroCuota: number;
  fechaVencimiento: string;
  montoACobrar: string;
}

export interface ClienteEnMora {
  clienteId: number;
  clienteNombre: string;
  contratoId: number;
  cuotaId: number;
  numeroCuota: number;
  fechaVencimiento: string;
  mesesMora: number;
  alerta: boolean;
}

export interface CuotasDelMes {
  total: number;
  pagadas: number;
  vencidas: number;
  vigentes: number;
  porcentajeAtraso: number;
  porcentajePago: number;
}

export interface MetaDelMes {
  metaVentas: number;
  instalado: number;
  superada: boolean;
}

export interface AvanceAnual {
  anio: number;
  valores: number[];
}

export interface DashboardResumen {
  periodo: { mes: number; anio: number };
  cuotasDelMes: CuotasDelMes;
  clientesActivos: number;
  facturacionDelMes: string;
  caja: { ingresosDelMes: string; egresosDelMes: string; saldoEnCaja: string };
  instalacionesDelMesPorTipo: { tipo: string; cantidad: number }[];
  avanceAnual: AvanceAnual[];
  meta: MetaDelMes | null;
  cuotasHoy: CuotaProxima[];
  cuotasSemana: CuotaProxima[];
  clientesEnMora: ClienteEnMora[];
}

export type TipoMovimientoCaja = "ingreso" | "egreso";

export interface MovimientoCaja {
  id: number;
  tipo: TipoMovimientoCaja;
  categoria: string;
  monto: string;
  fecha: string;
  concepto: string | null;
  receptor: string | null;
  emisor: string | null;
}

export interface ListarMovimientosCajaResponse {
  data: MovimientoCaja[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EstadoCuentaContrato {
  contrato: Contrato;
  cuotas: Cuota[];
}

export interface EstadoCuenta {
  cliente: Cliente;
  contratos: EstadoCuentaContrato[];
}

export interface MetaMensual {
  id: number;
  mes: number;
  anio: number;
  metaVentas: number;
}
