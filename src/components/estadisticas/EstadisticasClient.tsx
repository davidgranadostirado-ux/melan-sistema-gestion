'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import type { Proceso } from '@/types'

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

export function EstadisticasClient({ procesos }: EstadisticasClientProps) {
  // Por estado
  const estadoData = Object.entries(
    procesos.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado_proceso] = (acc[p.estado_proceso] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value, fill: ESTADO_COLORS[name] ?? '#94a3b8' }))

  // Por fuente
  const fuenteData = Object.entries(
    procesos.reduce<Record<string, number>>((acc, p) => {
      acc[p.fuente] = (acc[p.fuente] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  // Por departamento (top 8)
  const depData = Object.entries(
    procesos
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
    procesos
      .filter((p) => p.categoria)
      .reduce<Record<string, number>>((acc, p) => {
        const cat = p.categoria!
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      }, {})
  )
    .sort(([, a], [, b]) => b - a)
    .map(([name, value]) => ({ name: name.length > 24 ? name.slice(0, 24) + '…' : name, value }))

  // Por año
  const añoData = Object.entries(
    procesos
      .filter((p) => p.año_publicacion)
      .reduce<Record<string, number>>((acc, p) => {
        const año = String(p.año_publicacion)
        acc[año] = (acc[año] || 0) + 1
        return acc
      }, {})
  )
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([name, value]) => ({ name, value }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Resumen por Estado */}
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
                {estadoData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
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
                {fuenteData.map((_, i) => (
                  <Cell key={i} fill={FUENTE_COLORS[i % FUENTE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Procesos']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Por Departamento */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Top Departamentos de Ejecución</h3>
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
              <Bar dataKey="value" name="Procesos" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
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
        <p className="text-sm">Sin datos disponibles</p>
      </div>
    </div>
  )
}
