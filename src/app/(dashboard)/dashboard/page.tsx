import { createClient } from '@/lib/supabase/server'
import { ChartsSection } from '@/components/dashboard/ChartsSection'
import { RecentProcesses } from '@/components/dashboard/RecentProcesses'
import type { Proceso } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('created_at', { ascending: false })

  const list = (procesos ?? []) as Proceso[]

  return (
    <div className="space-y-6">
      {/* Gráficos + tarjetas reactivas a filtros */}
      <ChartsSection procesos={list} />

      {/* Últimos procesos */}
      <RecentProcesses procesos={list} />
    </div>
  )
}
