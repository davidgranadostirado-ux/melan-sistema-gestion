'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { StatusBadge, SectorBadge, SumicorpBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Proceso } from '@/types'
import { Building2, Calendar, MapPin, DollarSign, FileText, User, Mail, Clock, Award } from 'lucide-react'

interface ProcesoDetailModalProps {
  open: boolean
  onClose: () => void
  proceso: Proceso | null
}

export function ProcesoDetailModal({ open, onClose, proceso }: ProcesoDetailModalProps) {
  if (!proceso) return null

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-6 py-5 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-8">
              <div className="flex items-center gap-2 mb-2">
                <SectorBadge sector={proceso.sector} />
                <span className="text-blue-200 text-xs">{proceso.fuente}</span>
                {proceso.numero_proceso && (
                  <span className="text-blue-200 text-xs font-mono">{proceso.numero_proceso}</span>
                )}
              </div>
              <h2 className="text-white font-bold text-lg leading-snug">{proceso.entidad}</h2>
              <p className="text-blue-100 text-sm mt-1 line-clamp-2">{proceso.objeto_proceso}</p>
            </div>
            <StatusBadge estado={proceso.estado_proceso} className="flex-shrink-0" />
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Cuantía destacada */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Cuantía del Proceso</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(proceso.cuantia_proceso)}</p>
            </div>
            <DollarSign className="h-10 w-10 text-blue-300" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Información General */}
            <InfoSection title="Información General" icon={<FileText className="h-4 w-4" />}>
              <InfoRow label="Categoría" value={proceso.categoria} />
              <InfoRow label="Tipo" value={proceso.tipo_proceso} />
              <InfoRow label="Año" value={proceso.año_publicacion} />
              <InfoRow label="Fuente" value={proceso.fuente} />
              <InfoRow label="Sector" value={proceso.sector} />
              <InfoRow label="Participa" value={proceso.participa} />
            </InfoSection>

            {/* Fechas */}
            <InfoSection title="Fechas" icon={<Calendar className="h-4 w-4" />}>
              <InfoRow label="Publicación" value={formatDate(proceso.fecha_publicacion)} />
              <InfoRow label="Presentación" value={formatDate(proceso.fecha_presentacion)} />
              <InfoRow label="Inicio" value={formatDate(proceso.fecha_inicio)} />
              <InfoRow label="Terminación" value={formatDate(proceso.fecha_terminacion)} />
              <InfoRow label="Duración" value={proceso.duracion_dias ? `${proceso.duracion_dias} días` : undefined} />
              <InfoRow label="Cargue al CRM" value={formatDate(proceso.fecha_cargue)} />
            </InfoSection>

            {/* Localización */}
            <InfoSection title="Localización" icon={<MapPin className="h-4 w-4" />}>
              <InfoRow label="Departamento" value={proceso.departamento_ejecucion} />
              <InfoRow label="Municipio" value={proceso.municipio_ejecucion} />
            </InfoSection>

            {/* Contacto */}
            <InfoSection title="Contacto" icon={<User className="h-4 w-4" />}>
              <InfoRow label="Responsable" value={proceso.contacto_proceso} />
              <InfoRow label="Correo" value={proceso.correo_entrega} />
            </InfoSection>
          </div>

          {/* Adjudicación */}
          {(proceso.proponente_ganador || proceso.valor_ofertado_ganador || proceso.valor_ofertado_sumicorp) && (
            <InfoSection title="Adjudicación" icon={<Award className="h-4 w-4" />} fullWidth>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium">Proponente Ganador</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{proceso.proponente_ganador ?? '-'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium">Valor Ganador</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(proceso.valor_ofertado_ganador)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 font-medium">Valor</p>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(proceso.valor_ofertado_sumicorp)}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <p className="text-xs text-gray-500 font-medium">Cumple:</p>
                <SumicorpBadge cumple={proceso.sumicorp_cumple} />
              </div>
            </InfoSection>
          )}

          {/* Gestión y Observaciones */}
          {(proceso.gestion_realizar || proceso.observaciones) && (
            <div className="space-y-3">
              {proceso.gestion_realizar && (
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                  <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide mb-1">Gestión a Realizar</p>
                  <p className="text-sm text-yellow-900">{proceso.gestion_realizar}</p>
                </div>
              )}
              {proceso.observaciones && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">Observaciones</p>
                  <p className="text-sm text-gray-700">{proceso.observaciones}</p>
                </div>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-1 text-xs text-gray-400 pt-2 border-t border-gray-100">
            <Clock className="h-3 w-3" />
            <span>Registrado: {formatDate(proceso.created_at?.split('T')[0])}</span>
            {proceso.updated_at && proceso.updated_at !== proceso.created_at && (
              <span className="ml-2">· Actualizado: {formatDate(proceso.updated_at?.split('T')[0])}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function InfoSection({ title, icon, children, fullWidth }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; fullWidth?: boolean
}) {
  return (
    <div className={fullWidth ? 'sm:col-span-2' : ''}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-blue-600">{icon}</span>
        <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">{children}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}:</span>
      <span className="text-xs font-medium text-gray-900 text-right">{String(value)}</span>
    </div>
  )
}
