'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Proceso, EstadoProceso } from '@/types'
import { X } from 'lucide-react'

interface EstadisticasClientProps {
  procesos: Proceso[]
}

const ESTADO_COLORS: Record<string, string> = {
  'Adjudicado':    '#059669',
  'En Evaluación': '#d97706',
  'Cancelado':     '#dc2626',
  'Desierto':      '#6b7280',
  'Borrador':      '#7c3aed',
  'Pendiente':     '#1a56db',
}
const FUENTE_COLORS = ['#1a56db', '#059669', '#d97706', '#dc2626']
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const ESTADOS: EstadoProceso[] = ['En Evaluación','Adjudicado','Cancelado','Desierto','Borrador','Pendiente']
const CATEGORIAS = ['INSUMOS DE ASEO','INSUMOS DE ASEO Y CAFETERIA','INSUMOS DE CAFETERIA','INSUMOS DE PAPELERÍA','INSUMOS DE PROTECCION PERSONAL','INSUMOS DEPORTIVOS','INSUMOS LUDICOS','SUMINISTRO DE ASEO','SUMINISTRO DE FERRETERÍA','SUMINISTRO DE HIGIENE','SUMINISTRO DE MERCADOS','SUMINISTRO DE TECNOLOGÍA','SUMINISTRO MOBILIARIO']

export function EstadisticasClient({ procesos }: EstadisticasClientProps) {
  const [filterAño, setFilterAño] = useState('Todos')
  const [filterMes, setFilterMes] = useState('Todos')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterCategoria, setFilterCategoria] = useState('Todos')
  const [filterSector, setFilterSector] = useState('Todos')

  const años = useMemo(() => {
    const set = new Set(procesos.map((p) => String(p.año_publicacion)).filter(Boolean))
    return ['Todos', ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [procesos])

  const hasFilters = filterAño !== 'Todos' || filterMes !== 'Todos' || filterEstado !== 'Todos' || filterCategoria !== 'Todos' || filterSector !== 'Todos'

  const clearFilters = () => {
    setFilterAño('Todos'); setFilterMes('Todos'); setFilterEstado('Todos')
    setFilterCategoria('Todos'); setFilterSector('Todos')
  }

  const filtered = useMemo(() => procesos.filter((p) => {
    if (filterAño !== 'Todos' && String(p.año_publicacion) !== filterAño) return false
    if (filterMes !== 'Todos' && (p.mes_publicacion ?? '').toUpperCase() !== filterMes) return false
    if (filterEstado !== 'Todos' && p.estado_proceso !== filterEstado) return false
    if (filterCategoria !== 'Todos' && p.categoria !== filterCategoria) return false
    if (filterSector !== 'Todos' && p.sector !== filterSector) return false
    return true
  }), [procesos, filterAño, filterMes, filterEstado, filterCategoria, filterSector])

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

  const selectClass = 'h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="space-y-6">
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
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={fuenteData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {fuenteData.map((_, i) => <Cell key={i} fill={FUENTE_COLORS[i % FUENTE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [v, 'Procesos']} />
                <Legend />
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
