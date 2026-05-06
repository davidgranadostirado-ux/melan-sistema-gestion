import { createClient } from '@/lib/supabase/server'
import { formatCurrency, ganadoPorMelan } from '@/lib/utils'
import { Award, DollarSign, TrendingUp, Trophy } from 'lucide-react'
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
  const ganadosMelan = list.filter((p) => ganadoPorMelan(p.proponente_ganador)).length
  const ganadosOtros = total - ganadosMelan
  const montoTotalMelan = list
    .filter((p) => ganadoPorMelan(p.proponente_ganador))
    .reduce((sum, p) => sum + (p.cuantia_proceso ?? 0), 0)
  const valorOfertadoMelan = list
    .filter((p) => ganadoPorMelan(p.proponente_ganador))
    .reduce((sum, p) => sum + (p.valor_ofertado_sumicorp ?? 0), 0)
  const tasaAdj = (allProcesos ?? []).length > 0
    ? Math.round((total / (allProcesos ?? []).length) * 100)
    : 0
  const tasaMelan = total > 0 ? Math.round((ganadosMelan / total) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-emerald-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-emerald-600 rounded-xl">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ganados por Melan</p>
            <p className="text-2xl font-bold text-emerald-700">{ganadosMelan}</p>
            <p className="text-xs text-emerald-600">{tasaMelan}% de los adjudicados</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-rose-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-rose-500 rounded-xl">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Ganados por Otros</p>
            <p className="text-2xl font-bold text-gray-900">{ganadosOtros}</p>
            <p className="text-xs text-gray-400">{total} adjudicados totales · {tasaAdj}% del global</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-blue-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-blue-600 rounded-xl">
            <DollarSign className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Cuantía Ganada (Melan)</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(montoTotalMelan)}</p>
            <p className="text-xs text-gray-400">Suma de cuantías ganadas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-purple-100 p-5 flex items-center gap-4 shadow-sm">
          <div className="p-3 bg-purple-600 rounded-xl">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-sm text-gray-500">Valor Ofertado (Melan)</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(valorOfertadoMelan)}</p>
            <p className="text-xs text-gray-400">Solo procesos ganados</p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <AdjudicadosClient procesos={list} />
    </div>
  )
}
