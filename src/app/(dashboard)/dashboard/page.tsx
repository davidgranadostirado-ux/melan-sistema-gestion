import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { RecentProcesses } from '@/components/dashboard/RecentProcesses'
import { formatCurrency } from '@/lib/utils'
import { FileText, Award, Clock, DollarSign } from 'lucide-react'
import type { Proceso } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('created_at', { ascending: false })

  const list = (procesos ?? []) as Proceso[]

  const total = list.length
  const adjudicados = list.filter((p) => p.estado_proceso === 'Adjudicado').length
  const enEvaluacion = list.filter((p) => p.estado_proceso === 'En Evaluación').length
  const cuantiaTotal = list.reduce((sum, p) => sum + (p.cuantia_proceso ?? 0), 0)
  const tasaAdj = total > 0 ? Math.round((adjudicados / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Procesos"
          value={total}
          subtitle="Todos los procesos registrados"
          icon={FileText}
          color="blue"
        />
        <MetricCard
          title="Adjudicados"
          value={adjudicados}
          subtitle={`${tasaAdj}% tasa de adjudicación`}
          icon={Award}
          color="green"
        />
        <MetricCard
          title="En Evaluación"
          value={enEvaluacion}
          subtitle="Procesos activos en evaluación"
          icon={Clock}
          color="yellow"
        />
        <MetricCard
          title="Cuantía Total"
          value={formatCurrency(cuantiaTotal)}
          subtitle="Suma de todos los procesos"
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Gráficos */}
      <ChartsSection procesos={list} />

      {/* Últimos procesos */}
      <RecentProcesses procesos={list} />
    </div>
  )
}
