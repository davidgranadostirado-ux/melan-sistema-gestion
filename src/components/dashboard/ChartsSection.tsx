'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts'
import type { Proceso } from '@/types'
import { formatCurrency } from '@/lib/utils'

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

const MESES_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

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
  // 1. Estado de Procesos
  const estadoData = Object.entries(
    procesos.reduce<Record<string, number>>((acc, p) => {
      acc[p.estado_proceso] = (acc[p.estado_proceso] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value, fill: ESTADO_COLORS[name] ?? '#94a3b8' }))

  // 2. Distribución por Sector
  const sectorData = Object.entries(
    procesos.reduce<Record<string, number>>((acc, p) => {
      acc[p.sector] = (acc[p.sector] || 0) + 1
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const SECTOR_COLORS = ['#1a56db', '#059669']

  // 3. Procesos por Mes (año actual)
  const currentYear = new Date().getFullYear()
  const monthlyData = MESES_SHORT.map((mes, i) => {
    const monthProcesos = procesos.filter((p) => {
      const date = new Date(p.fecha_publicacion)
      return date.getFullYear() === currentYear && date.getMonth() === i
    })
    return {
      mes,
      procesos: monthProcesos.length,
      adjudicados: monthProcesos.filter((p) => p.estado_proceso === 'Adjudicado').length,
    }
  })

  // 4. Top Entidades
  const entidadCounts = procesos.reduce<Record<string, number>>((acc, p) => {
    acc[p.entidad] = (acc[p.entidad] || 0) + 1
    return acc
  }, {})
  const topEntidades = Object.entries(entidadCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name: name.length > 25 ? name.slice(0, 25) + '…' : name, value }))

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* Estado de Procesos */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Estado de Procesos</h3>
        {estadoData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={estadoData} barSize={36}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" name="Procesos" radius={[4, 4, 0, 0]}>
                {estadoData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Distribución por Sector */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Distribución por Sector</h3>
        {sectorData.length === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={sectorData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={3}
                dataKey="value"
              >
                {sectorData.map((_, index) => (
                  <Cell key={index} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => [v, 'Procesos']} />
              <Legend formatter={(value) => <span className="text-sm text-gray-700">{value}</span>} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Procesos por Mes */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Procesos por Mes</h3>
        <p className="text-xs text-gray-500 mb-4">Año {currentYear}</p>
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
        {topEntidades.length === 0 ? (
          <EmptyChart />
        ) : (
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
  )
}

function EmptyChart() {
  return (
    <div className="h-[240px] flex items-center justify-center text-gray-400">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">Sin datos disponibles</p>
      </div>
    </div>
  )
}
