'use client'

import { useState, useRef } from 'react'
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}` }

interface Props {
  value?: string | null
  onChange: (v: string) => void
  placeholder?: string
}

// Nota: el calendario se renderiza ANCLADO al campo (position: absolute),
// no en un portal a <body>. Dentro de un Dialog de Radix (modal), todo lo
// portaleado fuera del contenido queda bloqueado (pointer-events: none),
// que era la causa de que no se pudieran seleccionar fechas.
export function DatePicker({ value, onChange, placeholder = 'Seleccionar fecha' }: Props) {
  const [open, setOpen] = useState(false)
  const [arriba, setArriba] = useState(false)
  const [derecha, setDerecha] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)

  const base = value ? new Date(value + 'T00:00:00') : new Date()
  const [viewYear, setViewYear] = useState(base.getFullYear())
  const [viewMonth, setViewMonth] = useState(base.getMonth())

  const abrir = () => {
    if (!open) {
      // sincronizar el mes mostrado con el valor actual
      const d = value ? new Date(value + 'T00:00:00') : new Date()
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
      // decidir hacia dónde desplegar según el espacio disponible
      if (btnRef.current) {
        const r = btnRef.current.getBoundingClientRect()
        setArriba(window.innerHeight - r.bottom < 340 && r.top > 340)
        setDerecha(r.left + 288 > window.innerWidth - 8)
      }
    }
    setOpen((v) => !v)
  }

  const startWeekday = (new Date(viewYear, viewMonth, 1).getDay() + 6) % 7
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const now = new Date()
  const hoyStr = fmt(now.getFullYear(), now.getMonth(), now.getDate())
  const display = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''

  const prevMes = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1) } else setViewMonth((m) => m - 1) }
  const nextMes = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1) } else setViewMonth((m) => m + 1) }

  return (
    <div className="relative">
      <button
        ref={btnRef}
        type="button"
        onClick={abrir}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <span className={cn('truncate', !display && 'text-muted-foreground')}>{display || placeholder}</span>
        <CalIcon className="h-4 w-4 text-primary flex-shrink-0" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div
            className={cn(
              'absolute z-[61] w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-2xl dark:border-gray-700 dark:bg-gray-800',
              arriba ? 'bottom-full mb-1' : 'top-full mt-1',
              derecha ? 'right-0' : 'left-0',
            )}
          >
            <div className="flex items-center justify-between mb-2">
              <button type="button" onClick={prevMes} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">{MESES[viewMonth]} {viewYear}</span>
              <button type="button" onClick={nextMes} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1">
              {DIAS.map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-gray-400">{d}</div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {cells.map((d, i) => {
                if (d === null) return <div key={i} />
                const s = fmt(viewYear, viewMonth, d)
                const sel = s === value
                const esHoy = s === hoyStr
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { onChange(s); setOpen(false) }}
                    className={cn(
                      'h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors',
                      sel
                        ? 'bg-primary text-white font-semibold'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-500/10',
                      !sel && esHoy && 'ring-1 ring-primary text-primary font-semibold',
                    )}
                  >
                    {d}
                  </button>
                )
              })}
            </div>

            <div className="flex justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <button type="button" onClick={() => { onChange(hoyStr); setOpen(false) }} className="text-xs font-medium text-primary hover:underline">
                Hoy
              </button>
              {value && (
                <button type="button" onClick={() => { onChange(''); setOpen(false) }} className="text-xs text-gray-400 hover:underline">
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
