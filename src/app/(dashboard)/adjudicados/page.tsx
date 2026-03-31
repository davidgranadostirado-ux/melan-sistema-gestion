import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Award, DollarSign, TrendingUp, Search } from 'lucide-react'
import type { Proceso } from '@/types'
import { AdjudicadosClient } from '@/components/adjudicados/AdjudicadosClient'

export const dynamic = 'force-dynamic'

export default async function AdjudicadosPage() {
  const supabase = createClient()

  const { data: adjudicados = [] } = await supabase
    .from('procesos')
    .select('*')
    .eq('estado_proceso', 'Adjudicado')
    .order('fecha_publicacion', { ascending: false })

  const { data: allProcesos = [] } = await supabase
    .from('procesos')
    .select('id, estado_proceso')

  const list = (adjudicados ?? []) as Proceso[]
  const total = list.length
  const montoTotal = list.reduce((sum, p) => sum + (p.cuantia_proceso ?? 0), 0)
  const sumicorpTotal = list.reduce((sum, p) => sum + (p.valor_ofertado_sumicorp ?? 0), 0)
  const tasaAdj = (allProcesos ?? []).length > 0
    ? Math.round((total / (allProcesos ?? []).length) * 100)
    : 0

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-green-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-green-600 rounded-xl">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Adjudicados</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
            <p className="text-xs text-green-600">{tasaAdj}% del total de procesos</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-600 rounded-xl">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monto Total Adjudicado</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(montoTotal)}</p>
            <p className="text-xs text-gray-400">Cuantía total de procesos adjudicados</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-600 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor SUMICORP</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(sumicorpTotal)}</p>
            <p className="text-xs text-gray-400">Total ofertado por SUMICORP</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <AdjudicadosClient procesos={list} />
    </div>
  )
}
