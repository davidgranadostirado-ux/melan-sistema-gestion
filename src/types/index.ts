export type UserRole = 'admin' | 'editor' | 'viewer'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  avatar_url?: string
  created_at: string
  updated_at: string
}

export type Sector = 'Público' | 'Privado'
export type Fuente = 'Secop II' | 'Secop I' | 'Privado' | 'Otro'
export type EstadoProceso =
  | 'En Evaluación'
  | 'Adjudicado'
  | 'Cancelado'
  | 'Desierto'
  | 'Borrador'
  | 'Pendiente'
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
