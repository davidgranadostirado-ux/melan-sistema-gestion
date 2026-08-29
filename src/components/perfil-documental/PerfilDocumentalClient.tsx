'use client'

import { useState, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/finanzas/ConfirmDialog'
import { DocumentoFormModal } from './DocumentoFormModal'
import {
  Plus, Upload, Download, History, Pencil, Trash2, Loader2, Paperclip,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PerfilDocumento, DocumentoArchivo } from '@/types'

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function diasHasta(fecha: string) {
  return Math.round((new Date(fecha + 'T00:00:00').getTime() - new Date(hoyISO() + 'T00:00:00').getTime()) / 86_400_000)
}
function fmtFecha(f?: string | null) {
  if (!f) return '—'
  const d = new Date(f + 'T00:00:00')
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function semaforo(fecha?: string | null) {
  if (!fecha) return { label: 'Sin fecha', cls: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400' }
  const dias = diasHasta(fecha)
  if (dias < 0) return { label: `Vencido hace ${Math.abs(dias)}d`, cls: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400' }
  if (dias <= 15) return { label: dias === 0 ? 'Vence hoy' : `Vence en ${dias}d`, cls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400' }
  return { label: 'Vigente', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' }
}

interface Props {
  initialDocs: PerfilDocumento[]
  puedeEditar: boolean
}

export function PerfilDocumentalClient({ initialDocs, puedeEditar }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [docs, setDocs] = useState<PerfilDocumento[]>(initialDocs)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<PerfilDocumento | null>(null)
  const [aEliminar, setAEliminar] = useState<PerfilDocumento | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const [subiendo, setSubiendo] = useState<string | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const targetRef = useRef<string | null>(null)

  // Historial
  const [histDoc, setHistDoc] = useState<PerfilDocumento | null>(null)
  const [historial, setHistorial] = useState<DocumentoArchivo[]>([])
  const [cargandoHist, setCargandoHist] = useState(false)

  const { total, tiene, cumplimiento, falta } = useMemo(() => {
    const total = docs.length
    const tiene = docs.filter((d) => d.lo_tiene).length
    const cumplimiento = total ? Math.round((tiene / total) * 100) : 0
    return { total, tiene, cumplimiento, falta: 100 - cumplimiento }
  }, [docs])

  const refrescar = () => {
    router.refresh()
    supabase.from('perfil_documentos').select('*').order('orden').then(({ data }) => {
      if (data) setDocs(data as PerfilDocumento[])
    })
  }

  type CampoBool = 'aplica' | 'no_aplica' | 'lo_tiene' | 'no_lo_tiene'

  const setCampo = async (doc: PerfilDocumento, campo: CampoBool, valor: boolean) => {
    setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, [campo]: valor } : d)))
    const { error } = await supabase.from('perfil_documentos').update({ [campo]: valor }).eq('id', doc.id)
    if (error) {
      setDocs((prev) => prev.map((d) => (d.id === doc.id ? { ...d, [campo]: !valor } : d)))
      toast({ title: 'No se pudo actualizar', description: error.message, variant: 'destructive' })
    } else {
      router.refresh()
    }
  }

  const pedirArchivo = (docId: string) => {
    if (!puedeEditar) return
    targetRef.current = docId
    fileRef.current?.click()
  }

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    const docId = targetRef.current
    if (!file || !docId) return

    setSubiendo(docId)
    const safe = file.name.replace(/[^\w.\-]+/g, '_')
    const path = `${docId}/${Date.now()}-${safe}`

    const up = await supabase.storage.from('documentos').upload(path, file, { upsert: false })
    if (up.error) {
      setSubiendo(null)
      toast({ title: 'No se pudo subir el archivo', description: up.error.message, variant: 'destructive' })
      return
    }

    await supabase.from('documento_archivos').insert({ documento_id: docId, storage_path: path, nombre: file.name })
    const { error } = await supabase.from('perfil_documentos')
      .update({ archivo_path: path, archivo_nombre: file.name })
      .eq('id', docId)

    setSubiendo(null)
    if (error) {
      toast({ title: 'Archivo subido, pero no se actualizó el documento', description: error.message, variant: 'destructive' })
      return
    }
    setDocs((prev) => prev.map((d) => (d.id === docId ? { ...d, archivo_path: path, archivo_nombre: file.name } : d)))
    toast({ title: 'Archivo cargado', description: file.name })
  }

  const descargar = async (path?: string | null) => {
    if (!path) return
    const { data, error } = await supabase.storage.from('documentos').createSignedUrl(path, 120)
    if (error || !data) {
      toast({ title: 'No se pudo generar el enlace', description: error?.message, variant: 'destructive' })
      return
    }
    window.open(data.signedUrl, '_blank')
  }

  const verHistorial = async (doc: PerfilDocumento) => {
    setHistDoc(doc)
    setCargandoHist(true)
    const { data } = await supabase.from('documento_archivos')
      .select('*').eq('documento_id', doc.id).order('uploaded_at', { ascending: false })
    setHistorial((data ?? []) as DocumentoArchivo[])
    setCargandoHist(false)
  }

  const eliminar = async () => {
    if (!aEliminar) return
    setEliminando(true)
    const { error } = await supabase.from('perfil_documentos').delete().eq('id', aEliminar.id)
    setEliminando(false)
    if (error) {
      toast({ title: 'No se pudo eliminar', description: error.message, variant: 'destructive' })
    } else {
      setDocs((prev) => prev.filter((d) => d.id !== aEliminar.id))
      toast({ title: 'Documento eliminado' })
      router.refresh()
    }
    setAEliminar(null)
  }

  const SiNoCell = ({ doc, campo }: { doc: PerfilDocumento; campo: CampoBool }) => {
    const activo = !!doc[campo]
    if (!puedeEditar) {
      return (
        <span className={cn(
          'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold',
          activo
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
            : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
        )}>{activo ? 'Sí' : 'No'}</span>
      )
    }
    return (
      <Select value={activo ? 'si' : 'no'} onValueChange={(v) => setCampo(doc, campo, v === 'si')}>
        <SelectTrigger className="h-8 w-[72px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="si">Sí</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className="space-y-6">
      {/* Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Cumplimiento documental</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">{cumplimiento}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${cumplimiento}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Falta por cumplir</p>
          <p className="text-3xl font-bold text-red-600 mt-1">{falta}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
            <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${falta}%` }} />
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">Documentos</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-1">{tiene}/{total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">documentos que la empresa tiene</p>
        </div>
      </div>

      {/* Encabezado + botón */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documentos</h2>
        {puedeEditar && (
          <Button onClick={() => { setEditando(null); setModalOpen(true) }} className="gap-2">
            <Plus className="h-4 w-4" /> Nuevo documento
          </Button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 font-medium">Documento</th>
              <th className="px-4 py-3 font-medium">Aplica</th>
              <th className="px-4 py-3 font-medium">No Aplica</th>
              <th className="px-4 py-3 font-medium">Lo tiene</th>
              <th className="px-4 py-3 font-medium">No lo tiene</th>
              <th className="px-4 py-3 font-medium">Fecha doc.</th>
              <th className="px-4 py-3 font-medium">Vencimiento</th>
              <th className="px-4 py-3 font-medium">Archivo</th>
              {puedeEditar && <th className="px-4 py-3 font-medium text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={puedeEditar ? 9 : 8} className="px-4 py-10 text-center text-gray-400">
                No hay documentos. {puedeEditar && 'Agrega el primero con "Nuevo documento".'}
              </td></tr>
            ) : docs.map((doc) => {
              const sem = semaforo(doc.fecha_vencimiento)
              return (
                <tr key={doc.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{doc.documento}</td>
                  <td className="px-4 py-3"><SiNoCell doc={doc} campo="aplica" /></td>
                  <td className="px-4 py-3"><SiNoCell doc={doc} campo="no_aplica" /></td>
                  <td className="px-4 py-3"><SiNoCell doc={doc} campo="lo_tiene" /></td>
                  <td className="px-4 py-3"><SiNoCell doc={doc} campo="no_lo_tiene" /></td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{fmtFecha(doc.fecha_documento)}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <span className="text-gray-600 dark:text-gray-300">{fmtFecha(doc.fecha_vencimiento)}</span>
                      <span className={cn('inline-flex w-fit px-2 py-0.5 rounded-full text-[11px] font-medium', sem.cls)}>{sem.label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {subiendo === doc.id ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Subiendo…</span>
                      ) : doc.archivo_path ? (
                        <>
                          <button onClick={() => descargar(doc.archivo_path)} title={`Descargar ${doc.archivo_nombre ?? ''}`}
                            className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                            <Download className="h-4 w-4" />
                          </button>
                          {puedeEditar && (
                            <button onClick={() => pedirArchivo(doc.id)} title="Reemplazar archivo"
                              className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                              <Upload className="h-4 w-4" />
                            </button>
                          )}
                          <button onClick={() => verHistorial(doc)} title="Historial de cargas"
                            className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                            <History className="h-4 w-4" />
                          </button>
                        </>
                      ) : puedeEditar ? (
                        <button onClick={() => pedirArchivo(doc.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-primary hover:bg-red-50 dark:hover:bg-red-500/10">
                          <Paperclip className="h-3.5 w-3.5" /> Cargar
                        </button>
                      ) : <span className="text-gray-300">—</span>}
                    </div>
                  </td>
                  {puedeEditar && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => { setEditando(doc); setModalOpen(true) }} title="Editar"
                          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setAEliminar(doc)} title="Eliminar"
                          className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400">
        El % de cumplimiento se calcula sobre el total de documentos de la lista. Los documentos por vencer (≤ 15 días) o vencidos aparecen en la campana de notificaciones.
      </p>

      {/* Input de archivo oculto */}
      <input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />

      {/* Modal alta/edición */}
      <DocumentoFormModal
        open={modalOpen}
        doc={editando}
        onClose={() => setModalOpen(false)}
        onSaved={refrescar}
      />

      {/* Confirmar eliminación */}
      <ConfirmDialog
        open={!!aEliminar}
        title="¿Eliminar este documento?"
        description={aEliminar?.documento}
        detail="Se eliminará el documento y su historial de archivos cargados."
        variant="danger"
        loading={eliminando}
        confirmLabel="Eliminar"
        onConfirm={eliminar}
        onCancel={() => setAEliminar(null)}
      />

      {/* Historial de archivos */}
      <Dialog open={!!histDoc} onOpenChange={(o) => !o && setHistDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Historial — {histDoc?.documento}</DialogTitle>
          </DialogHeader>
          <div className="py-2 max-h-80 overflow-y-auto">
            {cargandoHist ? (
              <div className="py-8 text-center text-gray-400"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></div>
            ) : historial.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400">Aún no hay archivos cargados.</p>
            ) : (
              <ul className="space-y-2">
                {historial.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{h.nombre ?? 'archivo'}</p>
                      <p className="text-xs text-gray-400">{new Date(h.uploaded_at).toLocaleString('es-CO')}</p>
                    </div>
                    <button onClick={() => descargar(h.storage_path)}
                      className="p-1.5 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 flex-shrink-0">
                      <Download className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
