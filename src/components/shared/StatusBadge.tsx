import { Badge } from '@/components/ui/badge'
import type { EstadoProceso } from '@/types'

interface StatusBadgeProps {
  estado: EstadoProceso | string
  className?: string
}

const ESTADO_CONFIG: Record<string, { label: string; variant: 'success' | 'warning' | 'destructive' | 'info' | 'gray' | 'secondary' | 'cyan' | 'orange' }> = {
  'Adjudicado':           { label: 'Adjudicado',          variant: 'success' },
  'En Evaluación':        { label: 'En Evaluación',       variant: 'warning' },
  'Cancelado':            { label: 'Cancelado',           variant: 'destructive' },
  'Desierto':             { label: 'Desierto',            variant: 'gray' },
  'Borrador':             { label: 'Borrador',            variant: 'secondary' },
  'Pendiente':            { label: 'Pendiente',           variant: 'info' },
  'Estudio de Mercado':   { label: 'Estudio de Mercado',  variant: 'cyan' },
  'A Presentar':          { label: 'A Presentar',         variant: 'orange' },
}

export function StatusBadge({ estado, className }: StatusBadgeProps) {
  const config = ESTADO_CONFIG[estado] ?? { label: estado, variant: 'gray' as const }

  const variantClasses: Record<string, string> = {
    success:     'bg-green-100 text-green-800 border-green-200',
    warning:     'bg-yellow-100 text-yellow-800 border-yellow-200',
    destructive: 'bg-red-100 text-red-800 border-red-200',
    info:        'bg-blue-100 text-blue-800 border-blue-200',
    gray:        'bg-gray-100 text-gray-700 border-gray-200',
    secondary:   'bg-purple-100 text-purple-800 border-purple-200',
    cyan:        'bg-cyan-100 text-cyan-800 border-cyan-200',
    orange:      'bg-orange-100 text-orange-800 border-orange-200',
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantClasses[config.variant]} ${className ?? ''}`}
    >
      {config.label}
    </span>
  )
}

export function SectorBadge({ sector }: { sector: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
      sector === 'Público' ? 'bg-indigo-100 text-indigo-800'
      : sector === 'Comercial' ? 'bg-teal-100 text-teal-800'
      : 'bg-orange-100 text-orange-800'
    }`}>
      {sector}
    </span>
  )
}

export function SumicorpBadge({ cumple }: { cumple?: string }) {
  if (!cumple) return <span className="text-gray-400 text-xs">-</span>
  const config = {
    'SI':       'bg-green-100 text-green-800',
    'NO':       'bg-red-100 text-red-800',
    'PENDIENTE':'bg-yellow-100 text-yellow-800',
  }[cumple] ?? 'bg-gray-100 text-gray-700'

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config}`}>
      {cumple}
    </span>
  )
}

export function ParticipaBadge({ participa }: { participa?: string }) {
  if (!participa) return <span className="text-gray-400 text-xs">—</span>
  const isYes = participa === 'SI'
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${
        isYes
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-rose-50 text-rose-700 border-rose-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isYes ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {isYes ? 'Participó' : 'No participó'}
    </span>
  )
}
