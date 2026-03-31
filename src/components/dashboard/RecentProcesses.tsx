import { StatusBadge, SectorBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Proceso } from '@/types'

interface RecentProcessesProps {
  procesos: Proceso[]
}

export function RecentProcesses({ procesos }: RecentProcessesProps) {
  const recent = procesos.slice(0, 8)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h3 className="text-base font-semibold text-gray-800">Últimos Procesos Registrados</h3>
        <p className="text-xs text-gray-500 mt-0.5">Los {recent.length} registros más recientes</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Entidad</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Objeto</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Sector</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuantía</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {recent.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                  <div className="text-4xl mb-2">📋</div>
                  <p>No hay procesos registrados</p>
                </td>
              </tr>
            ) : (
              recent.map((proceso) => (
                <tr key={proceso.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 max-w-[180px] truncate">{proceso.entidad}</p>
                    {proceso.numero_proceso && (
                      <p className="text-xs text-gray-500">{proceso.numero_proceso}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-700 max-w-[200px] truncate">{proceso.objeto_proceso}</p>
                  </td>
                  <td className="px-4 py-3">
                    <SectorBadge sector={proceso.sector} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge estado={proceso.estado_proceso} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-medium text-gray-900">{formatCurrency(proceso.cuantia_proceso)}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {formatDate(proceso.fecha_publicacion)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
