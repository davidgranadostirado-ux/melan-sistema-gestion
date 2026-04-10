'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { SumicorpBadge } from '@/components/shared/StatusBadge'
import { ProcesoDetailModal } from '@/components/procesos/ProcesoDetailModal'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Proceso } from '@/types'
import { Search, Eye } from 'lucide-react'

interface AdjudicadosClientProps {
  procesos: Proceso[]
}

export function AdjudicadosClient({ procesos }: AdjudicadosClientProps) {
  const [search, setSearch] = useState('')
  const [viewProceso, setViewProceso] = useState<Proceso | null>(null)

  const filtered = useMemo(() => {
    if (!search) return procesos
    return procesos.filter(
      (p) =>
        p.entidad.toLowerCase().includes(search.toLowerCase()) ||
        p.objeto_proceso.toLowerCase().includes(search.toLowerCase()) ||
        (p.proponente_ganador ?? '').toLowerCase().includes(search.toLowerCase())
    )
  }, [procesos, search])

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Búsqueda */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar adjudicados..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100">
          <span className="text-sm text-gray-600">
            <span className="font-semibold text-gray-900">{filtered.length}</span> procesos adjudicados
          </span>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Entidad</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Objeto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Proponente Ganador</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuantía</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Valor</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Cumple</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="text-5xl mb-3">🏆</div>
                    <p className="text-gray-500">No hay procesos adjudicados{search ? ' con esa búsqueda' : ''}</p>
                  </td>
                </tr>
              ) : (
                filtered.map((proceso) => (
                  <tr key={proceso.id} className="hover:bg-green-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-[160px] truncate">{proceso.entidad}</p>
                      <p className="text-xs text-gray-500">{proceso.departamento_ejecucion}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-[200px] truncate">{proceso.objeto_proceso}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-[150px] truncate">{proceso.proponente_ganador ?? '-'}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(proceso.cuantia_proceso)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-medium text-purple-700 whitespace-nowrap">{proceso.valor_ofertado_sumicorp ? formatCurrency(proceso.valor_ofertado_sumicorp) : '-'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <SumicorpBadge cumple={proceso.sumicorp_cumple} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(proceso.fecha_publicacion)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setViewProceso(proceso)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProcesoDetailModal
        open={!!viewProceso}
        onClose={() => setViewProceso(null)}
        proceso={viewProceso}
      />
    </>
  )
}
