'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Proceso, EstadoProceso } from '@/types'
import { X } from 'lucide-react'
import { formatCurrency, ganadoPorMelan } from '@/lib/utils'

interface EstadisticasClientProps {
  procesos: Proceso[]
}

const ESTADO_COLORS: Record<string, string> = {
  'Adjudicado':          '#059669',
  'En Evaluación':       '#d97706',
  'Cancelado':           '#dc2626',
  'Desierto':            '#6b7280',
  'Borrador':            '#7c3aed',
  'Pendiente':           '#1a56db',
  'Estudio de Mercado':  '#0891b2',
  'A Presentar':         '#ea580c',
}
const FUENTE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const ESTADOS: EstadoProceso[] = ['En Evaluación','Adjudicado','Cancelado','Desierto','Borrador','Pendiente','Estudio de Mercado','A Presentar']
const CATEGORIAS = ['INSUMOS DE ASEO','INSUMOS DE ASEO Y CAFETERIA','INSUMOS DE CAFETERIA','INSUMOS DE PAPELERÍA','INSUMOS DE PROTECCION PERSONAL','INSUMOS DEPORTIVOS','INSUMOS LUDICOS','SUMINISTRO DE ASEO','SUMINISTRO DE FERRETERÍA','SUMINISTRO DE HIGIENE','SUMINISTRO DE MERCADOS','SUMINISTRO DE TECNOLOGÍA','SUMINISTRO MOBILIARIO']

export function EstadisticasClient({ procesos }: EstadisticasClientProps) {
  const [filterAño, setFilterAño] = useState('Todos')
  const [filterMes, setFilterMes] = useState('Todos')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterCategoria, setFilterCategoria] = useState('Todos')
  const [filterSector, setFilterSector] = useState('Todos')
  const [filterParticipa, setFilterParticipa] = useState('Todos')

  const años = useMemo(() => {
    const set = new Set(procesos.map((p) => String(p.año_publicacion)).filter(Boolean))
    return ['Todos', ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [procesos])

  const hasFilters = filterAño !== 'Todos' || filterMes !== 'Todos' || filterEstado !== 'Todos' || filterCategoria !== 'Todos' || filterSector !== 'Todos' || filterParticipa !== 'Todos'

  const clearFilters = () => {
    setFilterAño('Todos'); setFilterMes('Todos'); setFilterEstado('Todos')
    setFilterCategoria('Todos'); setFilterSector('Todos'); setFilterParticipa('Todos')
  }

  const filtered = useMemo(() => procesos.filter((p) => {
    if (filterAño !== 'Todos' && String(p.año_publicacion) !== filterAño) return false
    if (filterMes !== 'Todos' && (p.mes_publicacion ?? '').toUpperCase() !== filterMes) return false
    if (filterEstado !== 'Todos' && p.estado_proceso !== filterEstado) return false
    if (filterCategoria !== 'Todos' && p.categoria !== filterCategoria) return false
    if (filterSector !== 'Todos' && p.sector !== filterSector) return false
    if (filterParticipa !== 'Todos' && (p.participa ?? 'SI') !== filterParticipa) return false
    return true
  }), [procesos, filterAño, filterMes, filterEstado, filterCategoria, filterSector, filterParticipa])

  // Por estado
  const estadoData = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado_proceso] = (acc[p.estado_proceso] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value, fill: ESTADO_COLORS[name] ?? '#94a3b8' }))

  // Por fuente
  const fuenteData = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.fuente] = (acc[p.fuente] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // Por departamento (top 8)
  const depData = Object.entries(
    filtered
      .filter((p) => p.departamento_ejecucion)
      .reduce<Record<string, number>>((acc, p) => {
        const dep = p.departamento_ejecucion!
        acc[dep] = (acc[dep] || 0) + 1
        return acc
      }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + '…' : name, value }))

  // Por categoría
  const categoriaData = Object.entries(
    filtered
      .filter((p) => p.categoria)
      .reduce<Record<string, number>>((acc, p) => {
        acc[p.categoria!] = (acc[p.categoria!] || 0) + 1
        return acc
      }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name: name.length > 24 ? name.slice(0, 24) + '…' : name, value }))

  // Por año
  const añoData = Object.entries(
    filtered
      .filter((p) => p.año_publicacion)
      .reduce<Record<string, number>>((acc, p) => {
        acc[String(p.año_publicacion)] = (acc[String(p.año_publicacion)] || 0) + 1
        return acc
      }, {})
  )
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([name, value]) => ({ name, value }))

  // Distribución de posiciones (top 10)
  const posicionData = Object.entries(
    filtered
      .filter((p) => p.posicion != null && p.posicion > 0)
      .reduce<Record<string, number>>((acc, p) => {
        const key = `Pos. ${p.posicion}`
        acc[key] = (acc[key] || 0) + 1
        return acc
      }, {})
  )
    .sort(([a], [b]) => Number(a.replace('Pos. ', '')) - Number(b.replace('Pos. ', '')))
    .slice(0, 10)
    .map(([name, value]) => ({ name, value }))

  const selectClass = 'h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

  // Métricas calculadas desde filtered
  const total        = filtered.length
  const adjudicados  = filtered.filter((p) => p.estado_proceso === 'Adjudicado').length
  const cancelados   = filtered.filter((p) => p.estado_proceso === 'Cancelado').length
  const desiertos    = filtered.filter((p) => p.estado_proceso === 'Desierto').length
  const cuantiaTotal = filtered.reduce((s, p) => s + (p.cuantia_proceso ?? 0), 0)
  const tasaAdj      = total > 0 ? ((adjudicados / total) * 100).toFixed(1) : '0'

  // Métricas de Participación + Ganados por Melan
  const participados   = filtered.filter((p) => (p.participa ?? 'SI') === 'SI').length
  const noParticipados = total - participados
  const tasaParticip   = total > 0 ? ((participados / total) * 100).toFixed(1) : '0'
  const ganadosMelan   = filtered.filter((p) => (p.participa ?? 'SI') === 'SI' && ganadoPorMelan(p.proponente_ganador)).length
  const tasaExito      = participados > 0 ? ((ganadosMelan / participados) * 100).toFixed(1) : '0'

  // KPIs de competencia
  const conParticipantes = filtered.filter((p) => p.cantidad_participantes != null && p.cantidad_participantes > 0)
  const avgParticipantes = conParticipantes.length > 0
    ? Math.round(conParticipantes.reduce((s, p) => s + (p.cantidad_participantes ?? 0), 0) / conParticipantes.length)
    : null
  const conPosicion = filtered.filter((p) => p.posicion != null && p.posicion > 0)
  const avgPosicion = conPosicion.length > 0
    ? (conPosicion.reduce((s, p) => s + (p.posicion ?? 0), 0) / conPosicion.length).toFixed(1)
    : null
  // Top posicion: cuántos quedaron en posición 1 vs total con dato
  const pos1 = conPosicion.filter((p) => p.posicion === 1).length
  const tasaPos1 = conPosicion.length > 0 ? Math.round((pos1 / conPosicion.length) * 100) : null

  return (
    <div className="space-y-6">
      {/* Tarjetas de métricas — reaccionan a los filtros */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Procesos"          value={total}                     color="blue"   sub={hasFilters ? 'Con filtros aplicados' : 'Histórico total'} />
        <StatCard label="Tasa de Adjudicación"    value={`${tasaAdj}%`}             color="green"  sub={`${adjudicados} adjudicados`} />
        <StatCard label="Cuantía Total"           value={formatCurrency(cuantiaTotal)} color="purple" sub="Suma filtrada" small />
        <StatCard label="Cancelados / Desiertos"  value={cancelados + desiertos}    color="red"    sub={`${cancelados} cancel. · ${desiertos} desiert.`} />
      </div>

      {/* Tarjetas de Participación + Ganados por Melan */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Participados"     value={`${participados} (${tasaParticip}%)`} color="emerald" sub={`${noParticipados} no participados`} />
        <StatCard label="Ganados por Melan" value={ganadosMelan}                          color="green"   sub={`${tasaExito}% tasa de éxito`} />
        <StatCard label="No Ganados"       value={participados - ganadosMelan}             color="rose"    sub="Otros proponentes ganaron" />
        <StatCard label="Conversión Global" value={total > 0 ? `${((ganadosMelan / total) * 100).toFixed(1)}%` : '0%'} color="purple" sub="Ganados Melan / Total" small />
      </div>

      {/* KPIs de competencia */}
      {(avgParticipantes !== null || avgPosicion !== null) && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {avgParticipantes !== null && (
            <StatCard label="Prom. Proponentes" value={avgParticipantes} color="indigo" sub={`${conParticipantes.length} procesos con dato`} />
          )}
          {avgPosicion !== null && (
            <StatCard label="Posición Promedio" value={`# ${avgPosicion}`} color="indigo" sub={`${conPosicion.length} procesos evaluados`} />
          )}
          {tasaPos1 !== null && (
            <StatCard label="1er Lugar" value={`${tasaPos1}%`} color="indigo" sub={`${pos1} de ${conPosicion.length} procesos`} />
          )}
        </div>
      )}

      {/* Panel de filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar:</span>

          <select value={filterAño} onChange={(e) => setFilterAño(e.target.value)} className={selectClass}>
            {años.map((a) => <option key={a} value={a}>{a === 'Todos' ? 'Todos los años' : a}</option>)}
          </select>

          <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className={selectClass}>
            <option value="Todos">Todos los meses</option>
            {MESES.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
          </select>

          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className={selectClass}>
            <option value="Todos">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>

          <select value={filterSector} onChange={(e) => setFilterSector(e.target.value)} className={selectClass}>
            <option value="Todos">Todos los sectores</option>
            <option value="Público">Público</option>
            <option value="Privado">Privado</option>
          </select>

          <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className={selectClass}>
            <option value="Todos">Todas las categorías</option>
            {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select value={filterParticipa} onChange={(e) => setFilterParticipa(e.target.value)} className={selectClass} title="Participación de Melan">
            <option value="Todos">Toda participación</option>
            <option value="SI">Participó</option>
            <option value="NO">No participó</option>
          </select>

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 h-9 px-3 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <X className="h-3.5 w-3.5" />Limpiar
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span> procesos
          </span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Por Estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Resumen por Estado</h3>
          {estadoData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={estadoData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" name="Procesos" radius={[4, 4, 0, 0]}>
                  {estadoData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Fuente */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Distribución por Fuente</h3>
          {fuenteData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={fuenteData}
                  cx="50%"
                  cy="45%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fuenteData.map((_, i) => (
                    <Cell key={i} fill={FUENTE_COLORS[i % FUENTE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number, name: string) => [v, name]}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
                <Legend
                  iconType="circle"
                  iconSize={10}
                  formatter={(value) => <span style={{ fontSize: '12px', color: '#374151' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Categoría */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Procesos por Categoría</h3>
          {categoriaData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={categoriaData} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" name="Procesos" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Departamento */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top Departamentos</h3>
          {depData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={depData} layout="vertical" barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" name="Procesos" fill="#1a56db" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Año */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Procesos por Año</h3>
          {añoData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={añoData} barSize={60}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" name="Procesos" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución de Posiciones */}
        {posicionData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Distribución de Posiciones</h3>
            <p className="text-xs text-gray-500 mb-4">Posición final obtenida en cada proceso evaluado</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={posicionData} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Bar dataKey="value" name="Procesos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[260px] flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">Sin datos para los filtros seleccionados</p>
      </div>
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
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
    emerald:'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose:   'bg-rose-50 border-rose-100 text-rose-900',
  }
  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className={`font-bold mt-1 ${small ? 'text-lg' : 'text-3xl'}`}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}
