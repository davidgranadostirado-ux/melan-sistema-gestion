'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, SectorBadge, ParticipaBadge } from '@/components/shared/StatusBadge'
import { ProcesoFormModal } from './ProcesoFormModal'
import { ProcesoDetailModal } from './ProcesoDetailModal'
import { formatCurrency, formatDate, exportToCSV, ganadoPorMelan } from '@/lib/utils'
import type { Proceso, EstadoProceso } from '@/types'
import {
  Search, Download, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, X, Plus,
} from 'lucide-react'

interface ProcesosTableProps {
  initialProcesos: Proceso[]
}

const ESTADOS: EstadoProceso[] = ['En Evaluación', 'Adjudicado', 'Cancelado', 'Desierto', 'Borrador', 'Pendiente', 'Estudio de Mercado', 'A Presentar']
const SECTORES = ['Público', 'Privado', 'Comercial']
const AÑOS = ['Todos', '2026', '2025', '2024', '2023']
const PARTICIPACIONES = ['Todos', 'SI', 'NO']
const MESES = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
const CATEGORIAS = ['INSUMOS DE ASEO','INSUMOS DE ASEO Y CAFETERIA','INSUMOS DE CAFETERIA','INSUMOS DE PAPELERÍA','INSUMOS DE PROTECCION PERSONAL','INSUMOS DEPORTIVOS','INSUMOS LUDICOS','SUMINISTRO DE ASEO','SUMINISTRO DE FERRETERÍA','SUMINISTRO DE HIGIENE','SUMINISTRO DE MERCADOS','SUMINISTRO DE TECNOLOGÍA','SUMINISTRO MOBILIARIO']
const PAGE_SIZE = 10

export function ProcesosTable({ initialProcesos }: ProcesosTableProps) {
  const [procesos, setProcesos] = useState<Proceso[]>(initialProcesos)
  const [search, setSearch] = useState('')
  const [filterAño, setFilterAño] = useState('Todos')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterSector, setFilterSector] = useState('Todos')
  const [filterMes, setFilterMes] = useState('Todos')
  const [filterCategoria, setFilterCategoria] = useState('Todos')
  const [filterParticipa, setFilterParticipa] = useState('Todos')
  const [page, setPage] = useState(1)
  const [selectedProceso, setSelectedProceso] = useState<Proceso | null>(null)
  const [viewProceso, setViewProceso] = useState<Proceso | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const { toast } = useToast()
  const supabase = createClient()

  // Abrir modal desde botón topbar
  if (typeof window !== 'undefined') {
    window.addEventListener('open-nuevo-proceso', () => setShowForm(true), { once: true })
  }

  const filtered = useMemo(() => {
    return procesos.filter((p) => {
      const matchSearch =
        !search ||
        p.entidad.toLowerCase().includes(search.toLowerCase()) ||
        p.objeto_proceso.toLowerCase().includes(search.toLowerCase()) ||
        (p.numero_proceso ?? '').toLowerCase().includes(search.toLowerCase())

      const matchAño = filterAño === 'Todos' || String(p.año_publicacion) === filterAño
      const matchEstado = filterEstado === 'Todos' || p.estado_proceso === filterEstado
      const matchSector = filterSector === 'Todos' || p.sector === filterSector
      const matchMes = filterMes === 'Todos' || (p.mes_publicacion ?? '').toUpperCase() === filterMes
      const matchCategoria = filterCategoria === 'Todos' || p.categoria === filterCategoria
      const matchParticipa = filterParticipa === 'Todos' || (p.participa ?? 'SI') === filterParticipa

      return matchSearch && matchAño && matchEstado && matchSector && matchMes && matchCategoria && matchParticipa
    })
  }, [procesos, search, filterAño, filterEstado, filterSector, filterMes, filterCategoria, filterParticipa])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = search || filterAño !== 'Todos' || filterEstado !== 'Todos' || filterSector !== 'Todos' || filterMes !== 'Todos' || filterCategoria !== 'Todos' || filterParticipa !== 'Todos'

  // Métricas del resultado filtrado
  const metricasFiltradas = useMemo(() => {
    const participados = filtered.filter((p) => (p.participa ?? 'SI') === 'SI').length
    const ganadosMelan = filtered.filter((p) => (p.participa ?? 'SI') === 'SI' && ganadoPorMelan(p.proponente_ganador)).length
    return {
      total:        filtered.length,
      adjudicados:  filtered.filter((p) => p.estado_proceso === 'Adjudicado').length,
      enEvaluacion: filtered.filter((p) => p.estado_proceso === 'En Evaluación').length,
      cuantiaTotal: filtered.reduce((s, p) => s + (p.cuantia_proceso ?? 0), 0),
      participados,
      noParticipados: filtered.length - participados,
      tasaParticipacion: filtered.length > 0 ? Math.round((participados / filtered.length) * 100) : 0,
      ganadosMelan,
      tasaExito: participados > 0 ? Math.round((ganadosMelan / participados) * 100) : 0,
    }
  }, [filtered])

  const clearFilters = () => {
    setSearch('')
    setFilterAño('Todos')
    setFilterEstado('Todos')
    setFilterSector('Todos')
    setFilterMes('Todos')
    setFilterCategoria('Todos')
    setFilterParticipa('Todos')
    setPage(1)
  }

  const refreshProcesos = async () => {
    const { data } = await supabase
      .from('procesos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProcesos(data as Proceso[])
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('procesos').delete().eq('id', id)
    if (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Proceso eliminado', description: 'El proceso fue eliminado correctamente.' })
      setProcesos((prev) => prev.filter((p) => p.id !== id))
    }
    setDeleteConfirm(null)
  }

  const handleExport = () => {
    const data = filtered.map((p) => ({
      'Entidad': p.entidad,
      'Categoría': p.categoria ?? '',
      'Objeto': p.objeto_proceso,
      'Sector': p.sector,
      'Fuente': p.fuente,
      'Estado': p.estado_proceso,
      'Cuantía': p.cuantia_proceso,
      'Fecha Publicación': p.fecha_publicacion,
      'Departamento': p.departamento_ejecucion ?? '',
      'Número Proceso': p.numero_proceso ?? '',
      'Participa': p.participa ?? '',
      'Proponente Ganador': p.proponente_ganador ?? '',
      'Valor Ofertado': p.valor_ofertado_sumicorp ?? '',
      'N° Participantes': p.cantidad_participantes ?? '',
      'Posición': p.posicion ?? '',
      'Tiempo Ejecución': p.tiempo_ejecucion ?? '',
      'Fecha Cargue CRM': p.fecha_cargue ?? '',
    }))
    exportToCSV(data, `procesos-melan-${new Date().toISOString().split('T')[0]}`)
    toast({ title: 'CSV exportado', description: `${filtered.length} registros exportados.` })
  }

  return (
    <>
      {/* Tarjetas resumen — reaccionan a filtros */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <SummaryCard label="Total"        value={metricasFiltradas.total}        color="blue" />
        <SummaryCard label="Adjudicados"  value={metricasFiltradas.adjudicados}  color="green" />
        <SummaryCard label="En Evaluación" value={metricasFiltradas.enEvaluacion} color="yellow" />
        <SummaryCard label="Cuantía"      value={formatCurrency(metricasFiltradas.cuantiaTotal)} color="purple" small />
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          label="Participados"
          value={`${metricasFiltradas.participados} (${metricasFiltradas.tasaParticipacion}%)`}
          color="emerald"
          small
        />
        <SummaryCard
          label="Ganados por Melan"
          value={`${metricasFiltradas.ganadosMelan} (${metricasFiltradas.tasaExito}%)`}
          color="indigo"
          small
        />
        <SummaryCard
          label="No Ganados"
          value={metricasFiltradas.participados - metricasFiltradas.ganadosMelan}
          color="rose"
          small
        />
      </div>

      {/* Controles */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Barra de filtros */}
        <div className="px-5 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por entidad, objeto o número..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Filtro Año */}
            <select
              value={filterAño}
              onChange={(e) => { setFilterAño(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {AÑOS.map((a) => <option key={a} value={a}>{a === 'Todos' ? 'Todos los años' : a}</option>)}
            </select>

            {/* Filtro Mes */}
            <select
              value={filterMes}
              onChange={(e) => { setFilterMes(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los meses</option>
              {MESES.map((m) => <option key={m} value={m}>{m.charAt(0) + m.slice(1).toLowerCase()}</option>)}
            </select>

            {/* Filtro Estado */}
            <select
              value={filterEstado}
              onChange={(e) => { setFilterEstado(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los estados</option>
              {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>

            {/* Filtro Sector */}
            <select
              value={filterSector}
              onChange={(e) => { setFilterSector(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todos los sectores</option>
              {SECTORES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Filtro Categoría */}
            <select
              value={filterCategoria}
              onChange={(e) => { setFilterCategoria(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Todos">Todas las categorías</option>
              {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Filtro Participación */}
            <select
              value={filterParticipa}
              onChange={(e) => { setFilterParticipa(e.target.value); setPage(1) }}
              className="h-9 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Filtrar por participación de Melan"
            >
              <option value="Todos">Toda participación</option>
              <option value="SI">Participó</option>
              <option value="NO">No participó</option>
            </select>

            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-gray-500 gap-1">
                <X className="h-4 w-4" />Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Info y acciones */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{filtered.length}</span> proceso{filtered.length !== 1 ? 's' : ''}
              {hasFilters && ' (filtrado)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExport} className="gap-2 text-sm">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="bg-blue-700 hover:bg-blue-800 gap-2 text-sm">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Proceso</span>
            </Button>
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Entidad / N° Proceso</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Categoría</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Objeto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Sector</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Participación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Ganador</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuantía</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha Pub.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha Cargue</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-16 text-center">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-gray-500 font-medium">No se encontraron procesos</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {hasFilters ? 'Prueba ajustando los filtros' : 'Comienza registrando tu primer proceso'}
                    </p>
                    {!hasFilters && (
                      <Button className="mt-4 bg-blue-700 hover:bg-blue-800 gap-2" onClick={() => setShowForm(true)}>
                        <Plus className="h-4 w-4" />Nuevo Proceso
                      </Button>
                    )}
                  </td>
                </tr>
              ) : (
                paginated.map((proceso) => (
                  <tr key={proceso.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 max-w-[180px] truncate">{proceso.entidad}</p>
                      {proceso.numero_proceso && (
                        <p className="text-xs text-gray-500 font-mono">{proceso.numero_proceso}</p>
                      )}
                      {proceso.created_by_name && (
                        <p className="text-xs text-blue-500 mt-0.5">👤 {proceso.created_by_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {proceso.categoria
                        ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 max-w-[160px] truncate block">{proceso.categoria}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-[220px] truncate">{proceso.objeto_proceso}</p>
                      <p className="text-xs text-gray-400">{proceso.fuente} · {proceso.mes_publicacion}</p>
                      {(proceso.cantidad_participantes != null || proceso.posicion != null) && (
                        <p className="text-xs text-indigo-500 mt-0.5">
                          {proceso.cantidad_participantes != null && `${proceso.cantidad_participantes} proponentes`}
                          {proceso.posicion != null && proceso.cantidad_participantes != null && ' · '}
                          {proceso.posicion != null && `Pos. ${proceso.posicion}`}
                          {proceso.tiempo_ejecucion && ` · ${proceso.tiempo_ejecucion}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SectorBadge sector={proceso.sector} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ParticipaBadge participa={proceso.participa ?? 'SI'} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={proceso.estado_proceso} />
                    </td>
                    <td className="px-4 py-3">
                      {proceso.proponente_ganador ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm max-w-[140px] truncate ${ganadoPorMelan(proceso.proponente_ganador) ? 'text-emerald-800 font-semibold' : 'text-gray-700'}`}>
                            {proceso.proponente_ganador}
                          </span>
                          {ganadoPorMelan(proceso.proponente_ganador) && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex-shrink-0">
                              MELAN
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(proceso.cuantia_proceso)}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {formatDate(proceso.fecha_publicacion)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {proceso.fecha_cargue ? formatDate(proceso.fecha_cargue) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setViewProceso(proceso)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalle"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => { setSelectedProceso(proceso); setShowForm(true) }}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        {deleteConfirm === proceso.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDelete(proceso.id)}
                              className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(proceso.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Página {page} de {totalPages} · {filtered.length} resultados
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className={pageNum === page ? 'bg-blue-700 hover:bg-blue-800 w-8' : 'w-8'}
                  >
                    {pageNum}
                  </Button>
                )
              })}
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      <ProcesoFormModal
        open={showForm}
        onClose={() => { setShowForm(false); setSelectedProceso(null) }}
        proceso={selectedProceso}
        onSuccess={refreshProcesos}
      />
      <ProcesoDetailModal
        open={!!viewProceso}
        onClose={() => setViewProceso(null)}
        proceso={viewProceso}
      />
    </>
  )
}

function SummaryCard({ label, value, color, small }: {
  label: string; value: string | number; color: string; small?: boolean
}) {
  const colors: Record<string, string> = {
    blue:   'bg-blue-50 border-blue-100 text-blue-900',
    green:  'bg-green-50 border-green-100 text-green-900',
    yellow: 'bg-yellow-50 border-yellow-100 text-yellow-900',
    purple: 'bg-purple-50 border-purple-100 text-purple-900',
    emerald:'bg-emerald-50 border-emerald-100 text-emerald-900',
    rose:   'bg-rose-50 border-rose-100 text-rose-900',
    indigo: 'bg-indigo-50 border-indigo-100 text-indigo-900',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className={`font-bold mt-1 ${small ? 'text-base' : 'text-2xl'}`}>{value}</p>
    </div>
  )
}
