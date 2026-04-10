'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import type { Proceso, EstadoProceso } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { X } from 'lucide-react'

interface ChartsSectionProps {
  procesos: Proceso[]
}

const ESTADO_COLORS: Record<string, string> = {
  'En Evaluación': '#d97706',
  'Adjudicado':    '#059669',
  'Cancelado':     '#dc2626',
  'Desierto':      '#6b7280',
  'Borrador':      '#7c3aed',
  'Pendiente':     '#1a56db',
}
const SECTOR_COLORS = ['#1a56db', '#059669']
const MESES_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MESES_FULL  = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const ESTADOS: EstadoProceso[] = ['En Evaluación','Adjudicado','Cancelado','Desierto','Borrador','Pendiente']
const CATEGORIAS = ['INSUMOS DE ASEO','INSUMOS DE ASEO Y CAFETERIA','INSUMOS DE CAFETERIA','INSUMOS DE PAPELERÍA','INSUMOS DE PROTECCION PERSONAL','INSUMOS DEPORTIVOS','INSUMOS LUDICOS','SUMINISTRO DE ASEO','SUMINISTRO DE FERRETERÍA','SUMINISTRO DE HIGIENE','SUMINISTRO DE MERCADOS','SUMINISTRO DE TECNOLOGÍA','SUMINISTRO MOBILIARIO']

const selectClass = 'h-8 px-2 text-xs border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm text-gray-600">{entry.name}: <span className="font-medium">{entry.value}</span></p>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsSection({ procesos }: ChartsSectionProps) {
  const [filterAño, setFilterAño]         = useState('Todos')
  const [filterMes, setFilterMes]         = useState('Todos')
  const [filterEstado, setFilterEstado]   = useState('Todos')
  const [filterSector, setFilterSector]   = useState('Todos')
  const [filterCategoria, setFilterCategoria] = useState('Todos')

  const años = useMemo(() => {
    const set = new Set(procesos.map((p) => String(p.año_publicacion)).filter(Boolean))
    return ['Todos', ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [procesos])

  const hasFilters = filterAño !== 'Todos' || filterMes !== 'Todos' || filterEstado !== 'Todos' || filterSector !== 'Todos' || filterCategoria !== 'Todos'

  const clearFilters = () => {
    setFilterAño('Todos'); setFilterMes('Todos'); setFilterEstado('Todos')
    setFilterSector('Todos'); setFilterCategoria('Todos')
  }

  const filtered = useMemo(() => procesos.filter((p) => {
    if (filterAño !== 'Todos' && String(p.año_publicacion) !== filterAño) return false
    if (filterMes !== 'Todos' && (p.mes_publicacion ?? '').toUpperCase() !== filterMes) return false
    if (filterEstado !== 'Todos' && p.estado_proceso !== filterEstado) return false
    if (filterSector !== 'Todos' && p.sector !== filterSector) return false
    if (filterCategoria !== 'Todos' && p.categoria !== filterCategoria) return false
    return true
  }), [procesos, filterAño, filterMes, filterEstado, filterSector, filterCategoria])

  // 1. Por Estado
  const estadoData = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado_proceso] = (acc[p.estado_proceso] || 0) + 1; return acc
    }, {})
  ).map(([name, value]) => ({ name, value, fill: ESTADO_COLORS[name] ?? '#94a3b8' }))

  // 2. Por Sector
  const sectorData = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.sector] = (acc[p.sector] || 0) + 1; return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // 3. Por Mes (año seleccionado o actual)
  const yearForChart = filterAño === 'Todos' ? new Date().getFullYear() : Number(filterAño)
  const monthlyData = MESES_SHORT.map((mes, i) => {
    const base = filterAño === 'Todos'
      ? procesos.filter((p) => new Date(p.fecha_publicacion).getFullYear() === yearForChart && new Date(p.fecha_publicacion).getMonth() === i)
      : filtered.filter((p) => (p.mes_publicacion ?? '').toUpperCase() === MESES_FULL[i])
    return {
      mes,
      procesos: base.length,
      adjudicados: base.filter((p) => p.estado_proceso === 'Adjudicado').length,
    }
  })

  // 4. Top Entidades
  const topEntidades = Object.entries(
    filtered.reduce<Record<string, number>>((acc, p) => {
      acc[p.entidad] = (acc[p.entidad] || 0) + 1; return acc
    }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, value }))

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 px-4 py-3 shadow-sm flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide mr-1">Filtrar:</span>

        <select value={filterAño} onChange={(e) => setFilterAño(e.target.value)} className={selectClass}>
          {años.map((a) => <option key={a} value={a}>{a === 'Todos' ? 'Todos los años' : a}</option>)}
        </select>

        <select value={filterMes} onChange={(e) => setFilterMes(e.target.value)} className={selectClass}>
          <option value="Todos">Todos los meses</option>
          {MESES_FULL.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
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

        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 h-8 px-2 text-xs text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
            <X className="h-3 w-3" /> Limpiar
          </button>
        )}

        <span className="ml-auto text-xs text-gray-500">
          <span className="font-semibold text-gray-800">{filtered.length}</span> procesos
        </span>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Estado */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Estado de Procesos</h3>
          {estadoData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={estadoData} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Procesos" radius={[4, 4, 0, 0]}>
                  {estadoData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Sector */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Distribución por Sector</h3>
          {sectorData.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                  {sectorData.map((_, i) => <Cell key={i} fill={SECTOR_COLORS[i % SECTOR_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Legend formatter={(value) => <span className="text-sm text-gray-700">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Por Mes */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-1">Procesos por Mes</h3>
          <p className="text-xs text-gray-500 mb-4">Año {yearForChart}</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="procesos" name="Total" stroke="#1a56db" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="adjudicados" name="Adjudicados" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Entidades */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Top Entidades</h3>
          {topEntidades.length === 0 ? <EmptyChart /> : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topEntidades} layout="vertical" barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Procesos" fill="#1a56db" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">Sin datos para los filtros seleccionados</p>
      </div>
    </div>
  )
}
