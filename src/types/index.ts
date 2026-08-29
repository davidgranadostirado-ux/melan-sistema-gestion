export type UserRole = 'admin' | 'editor' | 'viewer'

export interface Profile {
  ver_credenciales?: boolean
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Sector = 'Público' | 'Privado' | 'Comercial'
export type Fuente = 'Secop II' | 'Secop I' | 'Privado' | 'Otro'
export type EstadoProceso =
  | 'En Evaluación'
  | 'Adjudicado'
  | 'Cancelado'
  | 'Desierto'
  | 'Borrador'
  | 'Pendiente'
  | 'Estudio de Mercado'
  | 'A Presentar'
export type SumicorpCumple = 'SI' | 'NO' | 'PENDIENTE'
export type Participa = 'SI' | 'NO'

export interface Proceso {
  id: string
  sector: Sector
  fuente: Fuente
  año_publicacion?: number
  fecha_publicacion: string
  mes_publicacion?: string
  fecha_presentacion?: string
  entidad: string
  estado_proceso: EstadoProceso
  departamento_ejecucion?: string
  municipio_ejecucion?: string
  cuantia_proceso: number
  objeto_proceso: string
  tipo_proceso?: string
  numero_proceso?: string
  correo_entrega?: string
  contacto_proceso?: string
  fecha_inicio?: string
  fecha_terminacion?: string
  duracion_dias?: number
  proponente_ganador?: string
  valor_ofertado_ganador?: number
  valor_ofertado_sumicorp?: number
  sumicorp_cumple?: SumicorpCumple
  gestion_realizar?: string
  participa?: Participa
  observaciones?: string
  categoria?: string
  fecha_cargue?: string
  created_at: string
  updated_at: string
  created_by?: string
  created_by_name?: string   // nombre del usuario que lo cargó (join con profiles)
  cantidad_participantes?: number
  posicion?: number
  tiempo_ejecucion?: string
}

export type ProcesoFormData = Omit<Proceso, 'id' | 'created_at' | 'updated_at'>

export interface DashboardMetrics {
  total_procesos: number
  adjudicados: number
  en_evaluacion: number
  cuantia_total: number
  cancelados: number
  desiertos: number
  tasa_adjudicacion: number
}

export interface ChartDataPoint {
  name: string
  value: number
  fill?: string
}

export interface MonthlyDataPoint {
  mes: string
  procesos: number
  adjudicados: number
}

// ============================================================
// MÓDULO: Ingresos y Gastos
// ============================================================

export interface CategoriaGasto {
  id: string
  nombre: string
  activo: boolean
  created_at: string
  created_by?: string
}

export interface Gasto {
  id: string
  fecha: string
  proveedor: string
  categoria: string
  descripcion?: string
  valor: number
  iva_pct: number
  iva: number
  total: number
  proceso_id?: string | null
  observaciones?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export interface Venta {
  id: string
  fecha: string
  cliente: string
  descripcion: string
  numero_factura?: string
  valor: number
  iva_pct: number
  iva: number
  total: number
  proceso_id?: string | null
  observaciones?: string
  created_by?: string
  created_at: string
  updated_at: string
}

export type GastoFormData = Omit<Gasto, 'id' | 'total' | 'created_at' | 'updated_at' | 'created_by'>
export type VentaFormData = Omit<Venta, 'id' | 'total' | 'created_at' | 'updated_at' | 'created_by'>

// ============================================================
// MÓDULO: Perfil Documental
// ============================================================

export interface PerfilDocumento {
  id: string
  documento: string
  aplica: boolean
  no_aplica: boolean
  lo_tiene: boolean
  no_lo_tiene: boolean
  fecha_documento?: string | null
  fecha_vencimiento?: string | null
  archivo_path?: string | null
  archivo_nombre?: string | null
  orden: number
  created_by?: string | null
  created_at: string
  updated_at: string
}

export interface DocumentoArchivo {
  id: string
  documento_id: string
  storage_path: string
  nombre?: string | null
  uploaded_by?: string | null
  uploaded_at: string
}

// ============================================================
// MÓDULO: Homologación de Plataformas
// ============================================================

export interface HomologacionEstado {
  id: string
  nombre: string
  orden: number
  activo: boolean
  created_at?: string
}

export interface HomologacionPlataforma {
  id: string
  plataforma: string
  acceso?: string | null
  estado?: string | null
  orden: number
  created_by?: string | null
  created_at: string
  updated_at: string
  // Solo presentes si el usuario tiene permiso para ver credenciales
  usuario?: string | null
  contrasena?: string | null
}

/** Fila unificada para la tabla de movimientos */
export type TipoMovimiento = 'Ingreso' | 'Gasto'

export interface Movimiento {
  id: string
  tipo: TipoMovimiento
  fecha: string
  tercero: string          // proveedor (gasto) o cliente (venta)
  concepto: string         // categoría (gasto) o descripción (venta)
  valor: number
  iva: number
  total: number
  observaciones?: string
}
