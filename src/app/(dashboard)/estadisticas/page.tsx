import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import type { Proceso } from '@/types'
import { EstadisticasClient } from '@/components/estadisticas/EstadisticasClient'

export const dynamic = 'force-dynamic'

export default async function EstadisticasPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('fecha_publicacion', { ascending: true })

  const list = (procesos ?? []) as Proceso[]

  const total = list.length
  const adjudicados = list.filter((p) => p.estado_proceso === 'Adjudicado').length
  const cancelados = list.filter((p) => p.estado_proceso === 'Cancelado').length
  const desiertos = list.filter((p) => p.estado_proceso === 'Desierto').length
  const cuantiaTotal = list.reduce((sum, p) => sum + (p.cuantia_proceso ?? 0), 0)
  const tasaAdj = total > 0 ? ((adjudicados / total) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      {/* Métricas históricas */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Procesos"
          value={total}
          color="blue"
          sub="Histórico total"
        />
        <StatCard
          label="Tasa de Adjudicación"
          value={`${tasaAdj}%`}
          color="green"
          sub={`${adjudicados} adjudicados`}
        />
        <StatCard
          label="Cuantía Total"
          value={formatCurrency(cuantiaTotal)}
          color="purple"
          sub="Todos los procesos"
          small
        />
        <StatCard
          label="Cancelados / Desiertos"
          value={`${cancelados + desiertos}`}
          color="red"
          sub={`${cancelados} cancel. · ${desiertos} desiert.`}
        />
      </div>

      {/* Gráficos detallados */}
      <EstadisticasClient procesos={list} />
    </div>
  )
}

function StatCard({ label, value, color, sub, small }: {
  label: string; value: string | number; color: string; sub?: string; small?: boolean
}) {
  const colorClasses: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-100 text-blue-900',
    green:  'bg-green-50 border-green-100 text-green-900',
    purple: 'bg-purple-50 border-purple-100 text-purple-900',
    red:    'bg-red-50 border-red-100 text-red-900',
  }

  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className={`font-bold mt-1 ${small ? 'text-lg' : 'text-3xl'}`}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}
