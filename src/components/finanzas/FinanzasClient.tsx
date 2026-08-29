'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart,
} from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { MovimientoFormModal } from './MovimientoFormModal'
import { ConfirmDialog } from './ConfirmDialog'
import { formatCurrency, formatDate, exportToCSV, MESES } from '@/lib/utils'
import type { Gasto, Venta, CategoriaGasto, TipoMovimiento } from '@/types'
import {
  Plus, X, Download, Pencil, Trash2, TrendingUp, TrendingDown, Wallet, Percent,
} from 'lucide-react'

interface FinanzasClientProps {
  initialGastos: Gasto[]
  initialVentas: Venta[]
  initialCategorias: CategoriaGasto[]
}

type Vista = 'resumen' | 'gastos' | 'ventas'

const COLOR_INGRESO = '#059669'
const COLOR_GASTO = '#d60024'
const COLOR_UTILIDAD = '#6366f1'
const PIE_COLORS = ['#d60024', '#f59e0b', '#8b5cf6', '#06b6d4', '#10b981', '#ef4444', '#6366f1', '#ec4899', '#84cc16', '#f97316']

const mesIndex = (fecha: string) => Number(fecha.slice(5, 7)) - 1
const añoDe = (fecha: string) => fecha.slice(0, 4)

export function FinanzasClient({ initialGastos, initialVentas, initialCategorias }: FinanzasClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const [categorias, setCategorias] = useState<CategoriaGasto[]>(initialCategorias)
  const [vista, setVista] = useState<Vista>('resumen')

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [modalTipo, setModalTipo] = useState<TipoMovimiento>('Gasto')
  const [editGasto, setEditGasto] = useState<Gasto | null>(null)
  const [editVenta, setEditVenta] = useState<Venta | null>(null)

  // Confirmación de eliminación
  const [porEliminar, setPorEliminar] = useState<
    { tabla: 'gastos' | 'ventas'; id: string; detalle: string } | null
  >(null)
  const [eliminando, setEliminando] = useState(false)

  // Filtros
  const [filterAño, setFilterAño] = useState('Todos')
  const [filterMesDesde, setFilterMesDesde] = useState('Todos')
  const [filterMesHasta, setFilterMesHasta] = useState('Todos')
  const [filterCategoria, setFilterCategoria] = useState('Todos')
  const [filterTercero, setFilterTercero] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')

  const años = useMemo(() => {
    const set = new Set<string>()
    initialGastos.forEach((g) => g.fecha && set.add(añoDe(g.fecha)))
    initialVentas.forEach((v) => v.fecha && set.add(añoDe(v.fecha)))
    return ['Todos', ...Array.from(set).sort((a, b) => Number(b) - Number(a))]
  }, [initialGastos, initialVentas])

  const terceros = useMemo(() => {
    const set = new Set<string>()
    initialGastos.forEach((g) => g.proveedor && set.add(g.proveedor))
    initialVentas.forEach((v) => v.cliente && set.add(v.cliente))
    return ['Todos', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [initialGastos, initialVentas])

  const hasFilters =
    filterAño !== 'Todos' || filterMesDesde !== 'Todos' || filterMesHasta !== 'Todos' ||
    filterCategoria !== 'Todos' || filterTercero !== 'Todos' || busqueda.trim() !== ''

  const clearFilters = () => {
    setFilterAño('Todos'); setFilterMesDesde('Todos'); setFilterMesHasta('Todos')
    setFilterCategoria('Todos'); setFilterTercero('Todos'); setBusqueda('')
  }

  const pasaFechaYTercero = (fecha: string, tercero: string) => {
    if (!fecha) return false
    if (filterAño !== 'Todos' && añoDe(fecha) !== filterAño) return false
    const m = mesIndex(fecha)
    if (filterMesDesde !== 'Todos' && m < Number(filterMesDesde)) return false
    if (filterMesHasta !== 'Todos' && m > Number(filterMesHasta)) return false
    if (filterTercero !== 'Todos' && tercero !== filterTercero) return false
    return true
  }

  const texto = busqueda.trim().toLowerCase()

  const gastos = useMemo(() => initialGastos.filter((g) => {
    if (!pasaFechaYTercero(g.fecha, g.proveedor)) return false
    if (filterCategoria !== 'Todos' && g.categoria !== filterCategoria) return false
    if (texto && ![g.proveedor, g.categoria, g.descripcion, g.observaciones]
      .some((c) => (c ?? '').toLowerCase().includes(texto))) return false
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [initialGastos, filterAño, filterMesDesde, filterMesHasta, filterCategoria, filterTercero, texto])

  const ventas = useMemo(() => initialVentas.filter((v) => {
    if (!pasaFechaYTercero(v.fecha, v.cliente)) return false
    // Si se filtra por una categoría de gasto, las ventas no aplican
    if (filterCategoria !== 'Todos') return false
    if (texto && ![v.cliente, v.descripcion, v.numero_factura, v.observaciones]
      .some((c) => (c ?? '').toLowerCase().includes(texto))) return false
    return true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [initialVentas, filterAño, filterMesDesde, filterMesHasta, filterCategoria, filterTercero, texto])

  // ===================== KPIs =====================
  const totalIngresos = ventas.reduce((s, v) => s + Number(v.valor ?? 0), 0)
  const totalGastos = gastos.reduce((s, g) => s + Number(g.valor ?? 0), 0)
  const utilidad = totalIngresos - totalGastos
  const margen = totalIngresos > 0 ? (utilidad / totalIngresos) * 100 : 0

  const ivaVentas = ventas.reduce((s, v) => s + Number(v.iva ?? 0), 0)
  const ivaGastos = gastos.reduce((s, g) => s + Number(g.iva ?? 0), 0)
  const ivaPorPagar = ivaVentas - ivaGastos

  const ticketPromedio = ventas.length > 0 ? totalIngresos / ventas.length : 0

  // ===================== Serie mensual =====================
  const serieMensual = useMemo(() => {
    const map = new Map<string, { key: string; mes: string; ingresos: number; gastos: number }>()
    const push = (fecha: string, campo: 'ingresos' | 'gastos', valor: number) => {
      if (!fecha) return
      const key = fecha.slice(0, 7) // YYYY-MM
      if (!map.has(key)) {
        map.set(key, {
          key,
          mes: `${MESES[mesIndex(fecha)].slice(0, 3)} ${añoDe(fecha).slice(2)}`,
          ingresos: 0,
          gastos: 0,
        })
      }
      map.get(key)![campo] += valor
    }
    ventas.forEach((v) => push(v.fecha, 'ingresos', Number(v.valor ?? 0)))
    gastos.forEach((g) => push(g.fecha, 'gastos', Number(g.valor ?? 0)))

    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((d) => ({
        ...d,
        utilidad: d.ingresos - d.gastos,
        margen: d.ingresos > 0 ? Number((((d.ingresos - d.gastos) / d.ingresos) * 100).toFixed(1)) : 0,
      }))
  }, [ventas, gastos])

  // Mejor y peor mes
  const mejorMes = serieMensual.length ? serieMensual.reduce((a, b) => (b.utilidad > a.utilidad ? b : a)) : null
  const mesesEnPerdida = serieMensual.filter((m) => m.utilidad < 0).length

  // ===================== Gastos por categoría =====================
  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, number>()
    gastos.forEach((g) => map.set(g.categoria, (map.get(g.categoria) ?? 0) + Number(g.valor ?? 0)))
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [gastos])

  // ===================== Top proveedores / clientes =====================
  const topProveedores = useMemo(() => {
    const map = new Map<string, number>()
    gastos.forEach((g) => map.set(g.proveedor, (map.get(g.proveedor) ?? 0) + Number(g.valor ?? 0)))
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [gastos])

  const topClientes = useMemo(() => {
    const map = new Map<string, number>()
    ventas.forEach((v) => map.set(v.cliente, (map.get(v.cliente) ?? 0) + Number(v.valor ?? 0)))
    return Array.from(map.entries())
      .map(([name, value]) => ({ name: name.length > 22 ? name.slice(0, 22) + '…' : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [ventas])

  // ===================== Acciones =====================
  const abrirNuevo = (tipo: TipoMovimiento) => {
    setModalTipo(tipo); setEditGasto(null); setEditVenta(null); setModalOpen(true)
  }
  const abrirEditarGasto = (g: Gasto) => {
    setModalTipo('Gasto'); setEditGasto(g); setEditVenta(null); setModalOpen(true)
  }
  const abrirEditarVenta = (v: Venta) => {
    setModalTipo('Ingreso'); setEditVenta(v); setEditGasto(null); setModalOpen(true)
  }

  const confirmarEliminacion = async () => {
    if (!porEliminar) return
    setEliminando(true)
    const { error } = await supabase.from(porEliminar.tabla).delete().eq('id', porEliminar.id)
    setEliminando(false)

    if (error) {
      toast({ title: 'No se pudo eliminar', description: error.message, variant: 'destructive' })
      return
    }
    toast({ title: 'Registro eliminado', description: porEliminar.detalle })
    setPorEliminar(null)
    router.refresh()
  }

  const exportar = () => {
    const filas = [
      ...ventas.map((v) => ({
        Tipo: 'Ingreso', Fecha: v.fecha, Tercero: v.cliente, Concepto: v.descripcion,
        Factura: v.numero_factura ?? '', Valor: v.valor, IVA: v.iva, Total: v.total,
        Observaciones: v.observaciones ?? '',
      })),
      ...gastos.map((g) => ({
        Tipo: 'Gasto', Fecha: g.fecha, Tercero: g.proveedor, Concepto: g.categoria,
        Factura: '', Valor: g.valor, IVA: g.iva, Total: g.total,
        Observaciones: g.observaciones ?? '',
      })),
    ].sort((a, b) => String(b.Fecha).localeCompare(String(a.Fecha)))

    if (!filas.length) {
      toast({ title: 'No hay datos para exportar', variant: 'destructive' })
      return
    }
    exportToCSV(filas, `melan-ingresos-gastos-${new Date().toISOString().slice(0, 10)}`)
  }

  const selectClass = 'h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
  const tabClass = (activo: boolean) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      activo ? 'bg-navy text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'
    }`

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos y Gastos</h1>
          <p className="text-sm text-gray-500">Control de rentabilidad mes a mes</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={exportar}>
            <Download className="h-4 w-4 mr-2" />Exportar CSV
          </Button>
          <Button variant="outline" onClick={() => abrirNuevo('Gasto')}>
            <Plus className="h-4 w-4 mr-2" />Nuevo gasto
          </Button>
          <Button onClick={() => abrirNuevo('Ingreso')}>
            <Plus className="h-4 w-4 mr-2" />Nueva venta
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Ingresos"
          value={formatCurrency(totalIngresos)}
          sub={`${ventas.length} ventas facturadas`}
          color="emerald"
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <KpiCard
          label="Gastos"
          value={formatCurrency(totalGastos)}
          sub={`${gastos.length} gastos registrados`}
          color="red"
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <KpiCard
          label="Utilidad"
          value={formatCurrency(utilidad)}
          sub={utilidad >= 0 ? 'Resultado positivo' : 'Resultado negativo'}
          color={utilidad >= 0 ? 'indigo' : 'rose'}
          icon={<Wallet className="h-5 w-5" />}
        />
        <KpiCard
          label="Margen"
          value={`${margen.toFixed(1)}%`}
          sub="Utilidad / Ingresos"
          color={margen >= 0 ? 'purple' : 'rose'}
          icon={<Percent className="h-5 w-5" />}
        />
      </div>

      {/* KPIs secundarios */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard label="IVA por pagar" value={formatCurrency(ivaPorPagar)} sub={`Generado ${formatCurrency(ivaVentas)} · Descontable ${formatCurrency(ivaGastos)}`} color="amber" small />
        <KpiCard label="Ticket promedio" value={formatCurrency(ticketPromedio)} sub="Por venta facturada" color="cyan" small />
        <KpiCard
          label="Mejor mes"
          value={mejorMes ? mejorMes.mes : '—'}
          sub={mejorMes ? `Utilidad ${formatCurrency(mejorMes.utilidad)}` : 'Sin datos'}
          color="emerald"
          small
        />
        <KpiCard
          label="Meses en pérdida"
          value={mesesEnPerdida}
          sub={`De ${serieMensual.length} meses con movimiento`}
          color={mesesEnPerdida > 0 ? 'rose' : 'emerald'}
          small
        />
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Filtrar:</span>

          <select value={filterAño} onChange={(e) => setFilterAño(e.target.value)} className={selectClass}>
            {años.map((a) => <option key={a} value={a}>{a === 'Todos' ? 'Todos los años' : a}</option>)}
          </select>

          <select value={filterMesDesde} onChange={(e) => setFilterMesDesde(e.target.value)} className={selectClass}>
            <option value="Todos">Mes desde</option>
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          <select value={filterMesHasta} onChange={(e) => setFilterMesHasta(e.target.value)} className={selectClass}>
            <option value="Todos">Mes hasta</option>
            {MESES.map((m, i) => <option key={m} value={i}>{m}</option>)}
          </select>

          <select value={filterCategoria} onChange={(e) => setFilterCategoria(e.target.value)} className={selectClass}>
            <option value="Todos">Todas las categorías</option>
            {categorias.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
          </select>

          <select value={filterTercero} onChange={(e) => setFilterTercero(e.target.value)} className={selectClass}>
            {terceros.map((t) => <option key={t} value={t}>{t === 'Todos' ? 'Proveedor / Cliente' : t}</option>)}
          </select>

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar…"
            className={`${selectClass} w-44`}
          />

          {hasFilters && (
            <button onClick={clearFilters} className="flex items-center gap-1 h-9 px-3 text-sm text-gray-500 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
              <X className="h-3.5 w-3.5" />Limpiar
            </button>
          )}

          <span className="ml-auto text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{ventas.length + gastos.length}</span> movimientos
          </span>
        </div>
        {filterCategoria !== 'Todos' && (
          <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1 inline-block">
            Filtrando por categoría de gasto: los ingresos quedan excluidos del cálculo.
          </p>
        )}
      </div>

      {/* Pestañas */}
      <div className="flex gap-2">
        <button className={tabClass(vista === 'resumen')} onClick={() => setVista('resumen')}>Resumen</button>
        <button className={tabClass(vista === 'gastos')} onClick={() => setVista('gastos')}>Gastos ({gastos.length})</button>
        <button className={tabClass(vista === 'ventas')} onClick={() => setVista('ventas')}>Ventas ({ventas.length})</button>
      </div>

      {/* ===================== RESUMEN ===================== */}
      {vista === 'resumen' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Evolución mensual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Evolución mensual</h3>
            <p className="text-xs text-gray-500 mb-4">Ingresos vs. gastos y utilidad resultante por mes</p>
            {serieMensual.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={320}>
                <ComposedChart data={serieMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n]} />
                  <Legend iconType="circle" iconSize={10} />
                  <Bar dataKey="ingresos" name="Ingresos" fill={COLOR_INGRESO} radius={[4, 4, 0, 0]} barSize={24} />
                  <Bar dataKey="gastos" name="Gastos" fill={COLOR_GASTO} radius={[4, 4, 0, 0]} barSize={24} />
                  <Line type="monotone" dataKey="utilidad" name="Utilidad" stroke={COLOR_UTILIDAD} strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Margen mensual */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Margen mensual</h3>
            <p className="text-xs text-gray-500 mb-4">Porcentaje de utilidad sobre ingresos</p>
            {serieMensual.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={serieMensual}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Margen']} />
                  <Line type="monotone" dataKey="margen" name="Margen %" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Gastos por categoría */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-1">Gastos por categoría</h3>
            <p className="text-xs text-gray-500 mb-4">Distribución del gasto operativo</p>
            {gastosPorCategoria.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={gastosPorCategoria} cx="50%" cy="45%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value">
                    {gastosPorCategoria.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number, n: string) => [formatCurrency(v), n]} />
                  <Legend iconType="circle" iconSize={10} formatter={(value) => <span style={{ fontSize: 12, color: '#374151' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top proveedores */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Top proveedores por gasto</h3>
            {topProveedores.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topProveedores} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Gasto']} />
                  <Bar dataKey="value" name="Gasto" fill={COLOR_GASTO} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top clientes */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Top clientes por ingreso</h3>
            {topClientes.length === 0 ? <EmptyChart /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={topClientes} layout="vertical" barSize={18}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} />
                  <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Ingreso']} />
                  <Bar dataKey="value" name="Ingreso" fill={COLOR_INGRESO} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Detalle mensual */}
          {serieMensual.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm xl:col-span-2">
              <h3 className="text-base font-semibold text-gray-800 mb-4">Detalle mes a mes</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                      <th className="py-2 pr-4 font-semibold">Mes</th>
                      <th className="py-2 pr-4 font-semibold text-right">Ingresos</th>
                      <th className="py-2 pr-4 font-semibold text-right">Gastos</th>
                      <th className="py-2 pr-4 font-semibold text-right">Utilidad</th>
                      <th className="py-2 font-semibold text-right">Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serieMensual.map((m) => (
                      <tr key={m.key} className="border-b border-gray-100 last:border-0">
                        <td className="py-2.5 pr-4 font-medium text-gray-800">{m.mes}</td>
                        <td className="py-2.5 pr-4 text-right text-emerald-700">{formatCurrency(m.ingresos)}</td>
                        <td className="py-2.5 pr-4 text-right text-red-700">{formatCurrency(m.gastos)}</td>
                        <td className={`py-2.5 pr-4 text-right font-semibold ${m.utilidad >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>
                          {formatCurrency(m.utilidad)}
                        </td>
                        <td className={`py-2.5 text-right ${m.margen >= 0 ? 'text-gray-600' : 'text-rose-600'}`}>{m.margen}%</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="py-2.5 pr-4">Total</td>
                      <td className="py-2.5 pr-4 text-right text-emerald-700">{formatCurrency(totalIngresos)}</td>
                      <td className="py-2.5 pr-4 text-right text-red-700">{formatCurrency(totalGastos)}</td>
                      <td className={`py-2.5 pr-4 text-right ${utilidad >= 0 ? 'text-gray-900' : 'text-rose-600'}`}>{formatCurrency(utilidad)}</td>
                      <td className="py-2.5 text-right">{margen.toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===================== TABLA GASTOS ===================== */}
      {vista === 'gastos' && (
        <TablaMovimientos
          vacio="Aún no hay gastos registrados"
          columnas={['Fecha', 'Proveedor', 'Gasto operativo', 'Valor', 'IVA', 'Total', 'Acciones']}
          filas={gastos.map((g) => ({
            id: g.id,
            celdas: [
              formatDate(g.fecha),
              g.proveedor,
              g.categoria,
              formatCurrency(Number(g.valor)),
              formatCurrency(Number(g.iva)),
              formatCurrency(Number(g.total)),
            ],
            onEdit: () => abrirEditarGasto(g),
            onDelete: () => setPorEliminar({
              tabla: 'gastos',
              id: g.id,
              detalle: `${g.proveedor} · ${g.categoria} · ${formatCurrency(Number(g.total))}`,
            }),
          }))}
        />
      )}

      {/* ===================== TABLA VENTAS ===================== */}
      {vista === 'ventas' && (
        <TablaMovimientos
          vacio="Aún no hay ventas registradas"
          columnas={['Fecha', 'Cliente', 'Descripción', 'Valor', 'IVA', 'Total', 'Acciones']}
          filas={ventas.map((v) => ({
            id: v.id,
            celdas: [
              formatDate(v.fecha),
              v.cliente,
              v.descripcion,
              formatCurrency(Number(v.valor)),
              formatCurrency(Number(v.iva)),
              formatCurrency(Number(v.total)),
            ],
            onEdit: () => abrirEditarVenta(v),
            onDelete: () => setPorEliminar({
              tabla: 'ventas',
              id: v.id,
              detalle: `${v.cliente} · ${v.descripcion} · ${formatCurrency(Number(v.total))}`,
            }),
          }))}
        />
      )}

      <MovimientoFormModal
        open={modalOpen}
        tipo={modalTipo}
        gasto={editGasto}
        venta={editVenta}
        categorias={categorias}
        onClose={() => setModalOpen(false)}
        onSuccess={() => router.refresh()}
        onCategoriaCreada={(c) => setCategorias((prev) => [...prev, c])}
      />

      <ConfirmDialog
        open={!!porEliminar}
        variant="danger"
        title={porEliminar?.tabla === 'ventas' ? '¿Eliminar esta venta?' : '¿Eliminar este gasto?'}
        description="Esta acción no se puede deshacer y el registro dejará de contar en los KPIs y gráficos."
        detail={porEliminar?.detalle}
        confirmLabel="Sí, eliminar"
        cancelLabel="No, conservar"
        loading={eliminando}
        onConfirm={confirmarEliminacion}
        onCancel={() => setPorEliminar(null)}
      />
    </div>
  )
}

// ============================================================
// Subcomponentes
// ============================================================

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

function KpiCard({ label, value, sub, color, small, icon }: {
  label: string
  value: string | number
  sub?: string
  color: string
  small?: boolean
  icon?: React.ReactNode
}) {
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-900',
    red:     'bg-red-50 border-red-100 text-red-900',
    indigo:  'bg-indigo-50 border-indigo-100 text-indigo-900',
    purple:  'bg-purple-50 border-purple-100 text-purple-900',
    rose:    'bg-rose-50 border-rose-100 text-rose-900',
    amber:   'bg-amber-50 border-amber-100 text-amber-900',
    cyan:    'bg-cyan-50 border-cyan-100 text-cyan-900',
  }
  return (
    <div className={`rounded-xl border p-5 ${colorClasses[color] ?? colorClasses.indigo}`}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
        {icon && <span className="opacity-50">{icon}</span>}
      </div>
      <p className={`font-bold mt-1 ${small ? 'text-lg' : 'text-2xl'}`}>{value}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

interface FilaTabla {
  id: string
  celdas: string[]
  onEdit: () => void
  onDelete: () => void
}

function TablaMovimientos({ columnas, filas, vacio }: {
  columnas: string[]
  filas: FilaTabla[]
  vacio: string
}) {
  if (filas.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm text-center text-gray-400">
        <div className="text-4xl mb-2">🧾</div>
        <p className="text-sm">{vacio}</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
              {columnas.map((c, i) => (
                <th
                  key={i}
                  className={`px-4 py-3 font-semibold ${i >= 3 ? 'text-right' : ''}`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => (
              <tr key={f.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                {f.celdas.map((c, i) => (
                  <td key={i} className={`px-4 py-3 ${i >= 3 ? 'text-right whitespace-nowrap' : ''} ${i === 5 ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {c}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={f.onEdit} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Editar">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={f.onDelete} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
