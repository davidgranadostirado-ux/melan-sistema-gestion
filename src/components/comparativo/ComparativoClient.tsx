'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import type { Proceso } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ParticipaBadge, StatusBadge } from '@/components/shared/StatusBadge'
import { ProcesoDetailModal } from '@/components/procesos/ProcesoDetailModal'
import { TrendingUp, Target, Award, AlertCircle, X, Eye } from 'lucide-react'

interface ComparativoClientProps {
  procesos: Proceso[]
}

const MESES_FULL  = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const SECTORES    = ['Público', 'Privado']

const selectClass =
  'h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

export function ComparativoClient({ procesos }: ComparativoClientProps) {
  const [filterAño, setFilterAño]     = useState('Todos')
  const [filterMes, setFilterMes]     = useState('Todos')
  const [filterSector, setFilterSector] = useState('Todos')
  const [view, setView] = useState<Proceso | null>(null)

  const años = useMemo(() => {
    const set = new Set(procesos.map((p) => String(p.año_publicacion)).filter(Boolean))
    return ['Todos', ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [procesos])

  const hasFilters = filterAño !== 'Todos' || filterMes !== 'Todos' || filterSector !== 'Todos'

  const clearFilters = () => {
    setFilterAño('Todos'); setFilterMes('Todos'); setFilterSector('Todos')
  }

  const filtered = useMemo(() => procesos.filter((p) => {
    if (filterAño !== 'Todos' && String(p.año_publicacion) !== filterAño) return false
    if (filterMes !== 'Todos' && (p.mes_publicacion ?? '').toUpperCase() !== filterMes) return false
    if (filterSector !== 'Todos' && p.sector !== filterSector) return false
    return true
  }), [procesos, filterAño, filterMes, filterSector])

  // ─── Métricas globales ─────────────────────────────────
  const total          = filtered.length
  const participados   = filtered.filter((p) => (p.participa ?? 'SI') === 'SI')
  const noParticipados = filtered.filter((p) => (p.participa ?? 'SI') === 'NO')

  const adjudicadosTotal = filtered.filter((p) => p.estado_proceso === 'Adjudicado').length
  const adjudicadosMelan = participados.filter((p) => p.estado_proceso === 'Adjudicado').length
  const perdidos         = participados.filter((p) => p.estado_proceso !== 'Adjudicado' && p.estado_proceso !== 'Pendiente' && p.estado_proceso !== 'Borrador').length

  const tasaParticipacion = total > 0 ? Math.round((participados.length / total) * 100) : 0
  const tasaExito         = participados.length > 0 ? Math.round((adjudicadosMelan / participados.length) * 100) : 0
  const tasaPerdida       = participados.length > 0 ? Math.round((perdidos / participados.length) * 100) : 0

  const cuantiaParticip = participados.reduce((s, p) => s + (p.cuantia_proceso ?? 0), 0)
  const cuantiaAdj      = participados.filter((p) => p.estado_proceso === 'Adjudicado')
    .reduce((s, p) => s + (p.cuantia_proceso ?? 0), 0)
  const valorOfertado   = participados.filter((p) => p.estado_proceso === 'Adjudicado')
    .reduce((s, p) => s + (p.valor_ofertado_sumicorp ?? 0), 0)

  // ─── Datos para gráficos ───────────────────────────────

  // 1. Funnel comparativo
  const funnelData = [
    { name: 'Total Procesos',        value: total,                  fill: '#3b82f6' },
    { name: 'Participados',          value: participados.length,    fill: '#10b981' },
    { name: 'Adjudicados a Melan',   value: adjudicadosMelan,       fill: '#059669' },
  ]

  // 2. Donut Participados vs No
  const participacionData = [
    { name: 'Participó',     value: participados.length,    fill: '#10b981' },
    { name: 'No participó',  value: noParticipados.length,  fill: '#f43f5e' },
  ]

  // 3. Donut Resultado de Participados
  const resultadoParticipData = [
    { name: 'Adjudicado',     value: adjudicadosMelan, fill: '#059669' },
    { name: 'No Adjudicado',  value: perdidos,         fill: '#dc2626' },
    {
      name: 'En Proceso',
      value: participados.length - adjudicadosMelan - perdidos,
      fill: '#d97706',
    },
  ].filter((d) => d.value > 0)

  // 4. Mensual: Participados vs Adjudicados
  const mensualData = MESES_SHORT.map((mes, i) => {
    const part = participados.filter((p) => (p.mes_publicacion ?? '').toUpperCase() === MESES_FULL[i]).length
    const adj  = participados.filter((p) => (p.mes_publicacion ?? '').toUpperCase() === MESES_FULL[i] && p.estado_proceso === 'Adjudicado').length
    const noPart = noParticipados.filter((p) => (p.mes_publicacion ?? '').toUpperCase() === MESES_FULL[i]).length
    return { mes, participados: part, adjudicados: adj, noParticipados: noPart }
  })

  // 5. Por sector
  const sectorComparativo = SECTORES.map((sector) => {
    const procSec = filtered.filter((p) => p.sector === sector)
    const partSec = procSec.filter((p) => (p.participa ?? 'SI') === 'SI')
    const adjSec  = partSec.filter((p) => p.estado_proceso === 'Adjudicado')
    return {
      name: sector,
      Total: procSec.length,
      Participados: partSec.length,
      Adjudicados: adjSec.length,
    }
  })

  // 6. Top entidades con mayor tasa de adjudicación
  const entidadesStats = useMemo(() => {
    const map: Record<string, { total: number; participados: number; adjudicados: number }> = {}
    filtered.forEach((p) => {
      const ent = p.entidad
      if (!map[ent]) map[ent] = { total: 0, participados: 0, adjudicados: 0 }
      map[ent].total++
      if ((p.participa ?? 'SI') === 'SI') {
        map[ent].participados++
        if (p.estado_proceso === 'Adjudicado') map[ent].adjudicados++
      }
    })
    return Object.entries(map)
      .filter(([, v]) => v.participados >= 1)
      .map(([entidad, v]) => ({
        entidad: entidad.length > 32 ? entidad.slice(0, 32) + '…' : entidad,
        full: entidad,
        ...v,
        tasa: v.participados > 0 ? Math.round((v.adjudicados / v.participados) * 100) : 0,
      }))
      .sort((a, b) => b.adjudicados - a.adjudicados || b.participados - a.participados)
      .slice(0, 8)
  }, [filtered])

  // 7. Lista detallada (Participados que NO se adjudicaron)
  const oportunidadesPerdidas = participados
    .filter((p) => ['Cancelado', 'Desierto', 'En Evaluación'].includes(p.estado_proceso))
    .sort((a, b) => (b.cuantia_proceso ?? 0) - (a.cuantia_proceso ?? 0))
    .slice(0, 10)

  return (
    <div className="space-y-6">
      {/* ─── HERO COMPARATIVO ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <HeroCard
          icon={<Target className="h-6 w-6 text-white" />}
          bg="bg-gradient-to-br from-blue-600 to-blue-700"
          label="Participación"
          value={`${participados.length} de ${total}`}
          sub={`${tasaParticipacion}% de los procesos disponibles`}
          progress={tasaParticipacion}
        />
        <HeroCard
          icon={<Award className="h-6 w-6 text-white" />}
          bg="bg-gradient-to-br from-emerald-600 to-emerald-700"
          label="Adjudicados a Melan"
          value={`${adjudicadosMelan} de ${participados.length}`}
          sub={`${tasaExito}% tasa de éxito al participar`}
          progress={tasaExito}
        />
        <HeroCard
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          bg="bg-gradient-to-br from-purple-600 to-purple-700"
          label="Cuantía Adjudicada"
          value={formatCurrency(cuantiaAdj)}
          sub={`${formatCurrency(valorOfertado)} valor ofertado total`}
        />
      </div>

      {/* ─── FILTROS ─── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar:</span>

          <select value={filterAño} onChange={(e) => setFilterAño(e.target.value)} className={selectClass}>
            {años.map((a) => <option key={a} value={a}>{a === 'Todos' ? 'Todos los años' : a}</option>)}
          </select>

          <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className={selectClass}>
            <option value="Todos">Todos los meses</option>
            {MESES_FULL.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
          </select>

          <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className={selectClass}>
            <option value="Todos">Todos los sectores</option>
            {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 h-9 px-3 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> procesos analizados
          </span>
        </div>
      </div>

      {/* ─── KPIs SECUNDARIOS ─── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="No Participados" value={noParticipados.length} sub={`${total - participados.length === 0 ? 0 : Math.round((noParticipados.length / total) * 100)}% del total`} color="rose" />
        <KpiCard label="Perdidos / Cancelados" value={perdidos} sub={`${tasaPerdida}% de los participados`} color="red" />
        <KpiCard label="Cuantía Participada" value={formatCurrency(cuantiaParticip)} sub="Total cuantía donde Melan se presentó" color="blue" small />
        <KpiCard
          label="Conversión Global"
          value={total > 0 ? `${Math.round((adjudicadosMelan / total) * 100)}%` : '0%'}
          sub={`${adjudicadosMelan} adjudicados / ${total} totales`}
          color="indigo"
        />
      </div>

      {/* ─── GRÁFICOS PRINCIPALES ─── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Embudo de Conversión</h3>
          <p className="text-xs text-gray-500 mb-4">Total → Participados → Adjudicados</p>
          {funnelData.every((d) => d.value === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={funnelData} layout="vertical" barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut Participación */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Participación de Melan</h3>
          <p className="text-xs text-gray-500 mb-4">Procesos en los que Melan presentó oferta</p>
          {participados.length + noParticipados.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={participacionData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {participacionData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Donut Resultado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Resultado de Participados</h3>
          <p className="text-xs text-gray-500 mb-4">De los que Melan participó, qué pasó</p>
          {resultadoParticipData.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={resultadoParticipData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {resultadoParticipData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Legend iconType="circle" iconSize={10} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por sector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Comparativa por Sector</h3>
          <p className="text-xs text-gray-500 mb-4">Total vs Participados vs Adjudicados</p>
          {sectorComparativo.every((s) => s.Total === 0) ? <Empty /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={sectorComparativo} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="Total"        fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Participados" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Adjudicados"  fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mensual */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Evolución Mensual</h3>
          <p className="text-xs text-gray-500 mb-4">Participados vs Adjudicados a lo largo del año</p>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mensualData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="participados"   name="Participados"     stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="adjudicados"    name="Adjudicados"      stroke="#059669" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="noParticipados" name="No Participados"  stroke="#f43f5e" strokeWidth={2}   dot={{ r: 3 }} strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Entidades */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Top Entidades — Participación vs Adjudicación</h3>
          <p className="text-xs text-gray-500 mb-4">Top 8 entidades con más adjudicaciones</p>
          {entidadesStats.length === 0 ? <Empty /> : (
            <div className="space-y-2">
              {entidadesStats.map((e) => (
                <div key={e.full} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate" title={e.full}>{e.entidad}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{e.total} procesos</span>
                      <span>·</span>
                      <span className="text-emerald-700">{e.participados} participados</span>
                      <span>·</span>
                      <span className="text-emerald-900 font-semibold">{e.adjudicados} adjudicados</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-48 flex-shrink-0">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                        style={{ width: `${e.tasa}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-gray-700 w-10 text-right">{e.tasa}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ─── OPORTUNIDADES PERDIDAS ─── */}
      {oportunidadesPerdidas.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-rose-500" />
              <div>
                <h3 className="text-base font-semibold text-gray-800">Procesos Participados sin Adjudicar</h3>
                <p className="text-xs text-gray-500">Top 10 procesos donde Melan participó pero no se adjudicó (mayor cuantía primero)</p>
              </div>
            </div>
            <span className="text-xs px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-semibold">
              {oportunidadesPerdidas.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Entidad</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Objeto</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Participación</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuantía</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Ver</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {oportunidadesPerdidas.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-50/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-[180px] truncate">{p.entidad}</p>
                      <p className="text-xs text-gray-500">{p.numero_proceso ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-[260px] truncate">{p.objeto_proceso}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge estado={p.estado_proceso} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ParticipaBadge participa={p.participa ?? 'SI'} />
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-semibold text-gray-900">
                      {formatCurrency(p.cuantia_proceso)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(p.fecha_publicacion)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setView(p)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProcesoDetailModal open={!!view} onClose={() => setView(null)} proceso={view} />
    </div>
  )
}

function HeroCard({ icon, bg, label, value, sub, progress }: {
  icon: React.ReactNode; bg: string; label: string; value: string; sub: string; progress?: number
}) {
  return (
    <div className={`rounded-xl p-5 text-white shadow-md ${bg}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-white/80 text-xs font-semibold uppercase tracking-wide">{label}</p>
        <div className="bg-white/20 rounded-lg p-2">{icon}</div>
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-white/80 text-xs mt-1">{sub}</p>
      {progress !== undefined && (
        <div className="mt-3 bg-white/20 h-1.5 rounded-full overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(100, progress)}%` }} />
        </div>
      )}
    </div>
  )
}

function KpiCard({ label, value, sub, color, small }: {
  label: string; value: string | number; sub?: string; color: string; small?: boolean
}) {
  const colors: Record<string, string> = {
    blue:    'bg-blue-50 border-blue-100 text-blue-900',
    indigo:  'bg-indigo-50 border-indigo-100 text-indigo-900',
    rose:    'bg-rose-50 border-rose-100 text-rose-900',
    red:     'bg-red-50 border-red-100 text-red-900',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  }
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className={`font-bold mt-1 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

function Empty() {
  return (
    <div className="h-[260px] flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">Sin datos para los filtros seleccionados</p>
      </div>
    </div>
  )
}
