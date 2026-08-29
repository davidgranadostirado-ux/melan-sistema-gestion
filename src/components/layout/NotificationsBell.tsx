'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell, CalendarClock, TrendingDown, Activity, CheckCheck, X, FileCheck2,
} from 'lucide-react'
import type { Notificacion, NotificacionGrupo } from '@/lib/notificaciones'
import { cn } from '@/lib/utils'

interface NotificationsBellProps {
  notificaciones: Notificacion[]
}

const FILTROS: { key: NotificacionGrupo | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'fechas', label: 'Fechas' },
  { key: 'documental', label: 'Documentos' },
  { key: 'financiero', label: 'Finanzas' },
  { key: 'actividad', label: 'Actividad' },
]

const ICONOS: Record<NotificacionGrupo, typeof CalendarClock> = {
  fechas: CalendarClock,
  documental: FileCheck2,
  financiero: TrendingDown,
  actividad: Activity,
}

const ESTILO_NIVEL = {
  urgente: {
    icono: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
    punto: 'bg-red-500',
  },
  aviso: {
    icono: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
    punto: 'bg-amber-500',
  },
  info: {
    icono: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
    punto: 'bg-transparent',
  },
}

const CLAVE_LEIDAS = 'melan-notif-leidas'

export function NotificationsBell({ notificaciones }: NotificationsBellProps) {
  const [abierto, setAbierto] = useState(false)
  const [filtro, setFiltro] = useState<NotificacionGrupo | 'todas'>('todas')
  const [leidas, setLeidas] = useState<string[]>([])
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    try {
      const guardadas = localStorage.getItem(CLAVE_LEIDAS)
      if (guardadas) setLeidas(JSON.parse(guardadas))
    } catch {
      // sin localStorage disponible
    }
    setMontado(true)
  }, [])

  const guardarLeidas = (ids: string[]) => {
    setLeidas(ids)
    try {
      localStorage.setItem(CLAVE_LEIDAS, JSON.stringify(ids))
    } catch {
      // sin localStorage disponible
    }
  }

  const sinLeer = useMemo(
    () => notificaciones.filter((n) => !leidas.includes(n.id)),
    [notificaciones, leidas]
  )

  const visibles = useMemo(
    () => (filtro === 'todas' ? notificaciones : notificaciones.filter((n) => n.grupo === filtro)),
    [notificaciones, filtro]
  )

  const conteos = useMemo(() => ({
    todas: notificaciones.length,
    fechas: notificaciones.filter((n) => n.grupo === 'fechas').length,
    documental: notificaciones.filter((n) => n.grupo === 'documental').length,
    financiero: notificaciones.filter((n) => n.grupo === 'financiero').length,
    actividad: notificaciones.filter((n) => n.grupo === 'actividad').length,
  }), [notificaciones])

  const marcarTodasLeidas = () => guardarLeidas(notificaciones.map((n) => n.id))

  const urgentesSinLeer = sinLeer.filter((n) => n.nivel === 'urgente').length
  const badge = montado ? sinLeer.length : 0

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto((v) => !v)}
        title="Notificaciones"
        aria-label={`Notificaciones${badge ? `: ${badge} sin leer` : ''}`}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
      >
        <Bell className="h-5 w-5" />
        {badge > 0 && (
          <span
            className={cn(
              'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold text-white',
              urgentesSinLeer > 0 ? 'bg-red-600' : 'bg-amber-500'
            )}
          >
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </button>

      {abierto && (
        <>
          {/* Capa para cerrar al hacer clic afuera */}
          <div className="fixed inset-0 z-40" onClick={() => setAbierto(false)} />

          <div className="absolute right-0 mt-2 w-[min(24rem,calc(100vw-2rem))] z-50 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800">
            {/* Encabezado */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Notificaciones</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {badge > 0 ? `${badge} sin leer` : 'Todo al día'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {badge > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    title="Marcar todas como leídas"
                    className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={() => setAbierto(false)}
                  className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:text-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="flex gap-1 px-3 py-2 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
              {FILTROS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFiltro(key)}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors',
                    filtro === key
                      ? 'bg-navy text-white'
                      : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  )}
                >
                  {label} {conteos[key] > 0 && <span className="opacity-70">({conteos[key]})</span>}
                </button>
              ))}
            </div>

            {/* Lista */}
            <div className="max-h-[26rem] overflow-y-auto">
              {visibles.length === 0 ? (
                <div className="px-4 py-10 text-center">
                  <Bell className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-600" />
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    No hay notificaciones en esta categoría
                  </p>
                </div>
              ) : (
                visibles.map((n) => {
                  const Icono = ICONOS[n.grupo]
                  const estilo = ESTILO_NIVEL[n.nivel]
                  const noLeida = !leidas.includes(n.id)
                  return (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => {
                        if (noLeida) guardarLeidas([...leidas, n.id])
                        setAbierto(false)
                      }}
                      className={cn(
                        'flex gap-3 px-4 py-3 border-b border-gray-100 last:border-0 transition-colors dark:border-gray-700/60',
                        'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                        noLeida && 'bg-red-50/40 dark:bg-red-500/5'
                      )}
                    >
                      <div className={cn('flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center', estilo.icono)}>
                        <Icono className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-snug">
                          {n.titulo}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {n.detalle}
                        </p>
                      </div>
                      {noLeida && n.nivel !== 'info' && (
                        <span className={cn('flex-shrink-0 mt-1.5 h-2 w-2 rounded-full', estilo.punto)} />
                      )}
                    </Link>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
