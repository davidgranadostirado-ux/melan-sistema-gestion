'use client'

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge, SectorBadge } from '@/components/shared/StatusBadge'
import { ProcesoFormModal } from './ProcesoFormModal'
import { ProcesoDetailModal } from './ProcesoDetailModal'
import { formatCurrency, formatDate, exportToCSV } from '@/lib/utils'
import type { Proceso, EstadoProceso } from '@/types'
import {
  Search, Download, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, X, Plus,
} from 'lucide-react'

interface ProcesosTableProps {
  initialProcesos: Proceso[]
}

const ESTADOS: EstadoProceso[] = ['En Evaluación', 'Adjudicado', 'Cancelado', 'Desierto', 'Borrador', 'Pendiente']
const SECTORES = ['Público', 'Privado']
const AÑOS = ['Todos', '2026', '2025', '2024', '2023']
const PAGE_SIZE = 10

export function ProcesosTable({ initialProcesos }: ProcesosTableProps) {
  const [procesos, setProcesos] = useState<Proceso[]>(initialProcesos)
  const [search, setSearch] = useState('')
  const [filterAño, setFilterAño] = useState('Todos')
  const [filterEstado, setFilterEstado] = useState('Todos')
  const [filterSector, setFilterSector] = useState('Todos')
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

      return matchSearch && matchAño && matchEstado && matchSector
    })
  }, [procesos, search, filterAño, filterEstado, filterSector])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const hasFilters = search || filterAño !== 'Todos' || filterEstado !== 'Todos' || filterSector !== 'Todos'

  const clearFilters = () => {
    setSearch('')
    setFilterAño('Todos')
    setFilterEstado('Todos')
    setFilterSector('Todos')
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
      'Valor': p.valor_ofertado_sumicorp ?? '',
      'Fecha Cargue CRM': p.fecha_cargue ?? '',
    }))
    exportToCSV(data, `procesos-melan-${new Date().toISOString().split('T')[0]}`)
    toast({ title: 'CSV exportado', description: `${filtered.length} registros exportados.` })
  }

  return (
    <>
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
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Objeto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Sector</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Estado</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wide">Cuantía</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha Pub.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Fecha Cargue</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
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
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-700 max-w-[220px] truncate">{proceso.objeto_proceso}</p>
                      <p className="text-xs text-gray-400">{proceso.fuente} · {proceso.mes_publicacion}</p>
                    </td>
                    <td className="px-4 py-3">
                      <SectorBadge sector={proceso.sector} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge estado={proceso.estado_proceso} />
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
