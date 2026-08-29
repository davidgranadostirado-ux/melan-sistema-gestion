import type { EstadoProceso } from '@/types'

interface StatusBadgeProps {
  estado: EstadoProceso | string
  className?: string
}

/**
 * Insignias en clave Melan.
 * Verde = ganado · naranja = en curso · rojo = perdido · azules = estados
 * informativos (tres azules distinguibles: corporativo, medio y grisáceo).
 * "A Presentar" va en naranja sólido porque es lo único que exige una acción.
 */
const ESTADO_CONFIG: Record<string, { label: string; variant: string }> = {
  'Adjudicado':           { label: 'Adjudicado',          variant: 'ganado' },
  'En Evaluación':        { label: 'En Evaluación',       variant: 'curso' },
  'A Presentar':          { label: 'A Presentar',         variant: 'accion' },
  'Pendiente':            { label: 'Pendiente',           variant: 'info' },
  'Estudio de Mercado':   { label: 'Estudio de Mercado',  variant: 'estudio' },
  'Borrador':             { label: 'Borrador',            variant: 'borrador' },
  'Cancelado':            { label: 'Cancelado',           variant: 'perdido' },
  'Desierto':             { label: 'Desierto',            variant: 'neutro' },
}

const VARIANTES: Record<string, string> = {
  ganado:   'bg-green-50 text-green-800 border-green-200',
  curso:    'bg-orange-50 text-orange-800 border-orange-200',
  accion:   'bg-brand text-navy-deep border-brand-dark',
  info:     'bg-blue-50 text-blue-800 border-blue-200',
  estudio:  'bg-cyan-50 text-cyan-800 border-cyan-200',
  borrador: 'bg-purple-50 text-purple-800 border-purple-200',
  perdido:  'bg-red-50 text-red-800 border-red-200',
  neutro:   'bg-gray-100 text-gray-700 border-gray-200',
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: 'neutro' }
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${VARIANTES[config.variant]} ${className ?? ''}`}
    >
      {config.label}
    </span>
  )
}

// Mismos colores que el donut "Distribución por Sector"
export function SectorBadge({ sector }: { sector: string }) {
  const clase =
    sector === 'Público' ? 'bg-brand text-navy-deep'
    : sector === 'Privado' ? 'bg-navy-mid text-white'
    : sector === 'Comercial' ? 'bg-navy text-white'
    : 'bg-gray-200 text-gray-700'
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${clase}`}>
      {sector}
    </span>
  )
}

export function SumicorpBadge({ cumple }: { cumple?: string }) {
  if (!cumple) return <span className="text-gray-400 text-xs">-</span>
  const config = {
    'SI':        'bg-green-100 text-green-800',
    'NO':        'bg-red-100 text-red-800',
    'PENDIENTE': 'bg-orange-100 text-orange-800',
  }[cumple] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config}`}>
      {cumple}
    </span>
  )
}

// "No participó" en gris, no en rojo: no participar es una decisión, no una pérdida.
export function ParticipaBadge({ participa }: { participa?: string }) {
  if (!participa) return <span className="text-gray-400 text-xs">—</span>
  const isYes = participa === 'SI'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        isYes
          ? 'bg-green-50 text-green-800 border-green-200'
          : 'bg-gray-100 text-gray-600 border-gray-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isYes ? 'bg-green-600' : 'bg-gris-dark'}`} />
      {isYes ? 'Participó' : 'No participó'}
    </span>
  )
}
