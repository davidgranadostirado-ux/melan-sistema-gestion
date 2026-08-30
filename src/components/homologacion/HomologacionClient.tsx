'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ConfirmDialog } from '@/components/finanzas/ConfirmDialog'
import {
  Plus, Pencil, Trash2, ExternalLink, Settings2, Loader2, X, Eye, EyeOff, ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { HomologacionPlataforma, HomologacionEstado } from '@/types'

function esUrl(s?: string | null) {
  return !!s && /^https?:\/\//i.test(s.trim())
}

/**
 * Etiqueta corta para la columna Acceso.
 * En vez de la URL completa (que nunca cabe y se corta en "ht…"),
 * muestra el dominio: "co.bionexo.com". La URL entera queda en el
 * tooltip y en el enlace.
 */
function etiquetaAcceso(s?: string | null) {
  if (!s) return '—'
  const texto = s.trim()
  if (!esUrl(texto)) return texto
  try {
    const { hostname, pathname } = new URL(texto)
    const dominio = hostname.replace(/^www\./i, '')
    const primerTramo = pathname.split('/').filter(Boolean)[0]
    return primerTramo ? `${dominio}/${primerTramo}` : dominio
  } catch {
    return texto
  }
}
function estadoCls(nombre?: string | null) {
  const n = (nombre ?? '').toLowerCase()
  if (n === 'existente') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
  if (n === 'en proceso') return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400'
  if (n === 'inexistente') return 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400'
  if (n === 'pendiente') return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-400'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}

interface Props {
  initialPlataformas: HomologacionPlataforma[]
  initialEstados: HomologacionEstado[]
  puedeEditar: boolean
  puedeVerCredenciales: boolean
}

export function HomologacionClient({ initialPlataformas, initialEstados, puedeEditar, puedeVerCredenciales }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const { toast } = useToast()

  const [plataformas, setPlataformas] = useState<HomologacionPlataforma[]>(initialPlataformas)
  const [estados, setEstados] = useState<HomologacionEstado[]>(initialEstados)
  const [verPass, setVerPass] = useState<Record<string, boolean>>({})

  // Modal plataforma
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<HomologacionPlataforma | null>(null)
  const [fPlataforma, setFPlataforma] = useState('')
  const [fAcceso, setFAcceso] = useState('')
  const [fEstado, setFEstado] = useState('')
  const [fUsuario, setFUsuario] = useState('')
  const [fContrasena, setFContrasena] = useState('')
  const [verFormPass, setVerFormPass] = useState(false)
  const [guardando, setGuardando] = useState(false)

  // Modal estados
  const [estadosOpen, setEstadosOpen] = useState(false)
  const [nuevoEstado, setNuevoEstado] = useState('')

  // Eliminar
  const [aEliminar, setAEliminar] = useState<HomologacionPlataforma | null>(null)
  const [eliminando, setEliminando] = useState(false)

  const cols = 3 + (puedeVerCredenciales ? 2 : 0) + (puedeEditar ? 1 : 0)

  const abrirNueva = () => {
    setEditando(null); setFPlataforma(''); setFAcceso(''); setFEstado(estados[0]?.nombre ?? '')
    setFUsuario(''); setFContrasena(''); setVerFormPass(false)
    setModalOpen(true)
  }
  const abrirEditar = (p: HomologacionPlataforma) => {
    setEditando(p); setFPlataforma(p.plataforma); setFAcceso(p.acceso ?? ''); setFEstado(p.estado ?? '')
    setFUsuario(p.usuario ?? ''); setFContrasena(p.contrasena ?? ''); setVerFormPass(false)
    setModalOpen(true)
  }

  const guardarPlataforma = async () => {
    if (!fPlataforma.trim()) { toast({ title: 'Escribe el nombre de la plataforma', variant: 'destructive' }); return }
    setGuardando(true)
    const payload = { plataforma: fPlataforma.trim(), acceso: fAcceso.trim() || null, estado: fEstado || null }

    let platId = editando?.id ?? null
    if (editando) {
      const { error } = await supabase.from('homologacion_plataformas').update(payload).eq('id', editando.id)
      if (error) { setGuardando(false); toast({ title: 'No se pudo guardar', description: error.message, variant: 'destructive' }); return }
      setPlataformas((prev) => prev.map((p) => (p.id === editando.id ? { ...p, ...payload } : p)))
    } else {
      const orden = plataformas.reduce((m, p) => Math.max(m, p.orden), 0) + 1
      const { data, error } = await supabase.from('homologacion_plataformas').insert({ ...payload, orden }).select().single()
      if (error) { setGuardando(false); toast({ title: error.code === '23505' ? 'Esa plataforma ya existe' : 'No se pudo guardar', description: error.code === '23505' ? undefined : error.message, variant: 'destructive' }); return }
      platId = (data as HomologacionPlataforma).id
      setPlataformas((prev) => [...prev, data as HomologacionPlataforma])
    }

    // Credenciales (solo si el usuario tiene permiso)
    if (puedeVerCredenciales && platId) {
      const usuario = fUsuario.trim() || null
      const contrasena = fContrasena || null
      const { error } = await supabase.from('homologacion_credenciales')
        .upsert({ plataforma_id: platId, usuario, contrasena, updated_at: new Date().toISOString() }, { onConflict: 'plataforma_id' })
      if (error) {
        setGuardando(false)
        toast({ title: 'La plataforma se guardó, pero no las credenciales', description: error.message, variant: 'destructive' })
        setModalOpen(false); router.refresh(); return
      }
      const idFinal = platId
      setPlataformas((prev) => prev.map((p) => (p.id === idFinal ? { ...p, usuario, contrasena } : p)))
    }

    setGuardando(false)
    toast({ title: editando ? 'Plataforma actualizada' : 'Plataforma agregada' })
    setModalOpen(false)
    router.refresh()
  }

  const cambiarEstado = async (p: HomologacionPlataforma, estado: string) => {
    setPlataformas((prev) => prev.map((x) => (x.id === p.id ? { ...x, estado } : x)))
    const { error } = await supabase.from('homologacion_plataformas').update({ estado }).eq('id', p.id)
    if (error) toast({ title: 'No se pudo cambiar el estado', description: error.message, variant: 'destructive' })
  }

  const eliminarPlataforma = async () => {
    if (!aEliminar) return
    setEliminando(true)
    const { error } = await supabase.from('homologacion_plataformas').delete().eq('id', aEliminar.id)
    setEliminando(false)
    if (error) { toast({ title: 'No se pudo eliminar', description: error.message, variant: 'destructive' }) }
    else { setPlataformas((prev) => prev.filter((p) => p.id !== aEliminar.id)); toast({ title: 'Plataforma eliminada' }) }
    setAEliminar(null)
  }

  // ---- Gestión de estados ----
  const agregarEstado = async () => {
    const nombre = nuevoEstado.trim()
    if (!nombre) return
    const orden = estados.reduce((m, e) => Math.max(m, e.orden), 0) + 1
    const { data, error } = await supabase.from('homologacion_estados').insert({ nombre, orden }).select().single()
    if (error) { toast({ title: error.code === '23505' ? 'Ese estado ya existe' : 'No se pudo crear', description: error.code === '23505' ? undefined : error.message, variant: 'destructive' }); return }
    if (data) setEstados((prev) => [...prev, data as HomologacionEstado])
    setNuevoEstado('')
  }

  const renombrarEstado = async (est: HomologacionEstado, nombre: string) => {
    const limpio = nombre.trim()
    if (!limpio || limpio === est.nombre) return
    const { error } = await supabase.from('homologacion_estados').update({ nombre: limpio }).eq('id', est.id)
    if (error) { toast({ title: 'No se pudo renombrar', description: error.message, variant: 'destructive' }); return }
    await supabase.from('homologacion_plataformas').update({ estado: limpio }).eq('estado', est.nombre)
    setEstados((prev) => prev.map((e) => (e.id === est.id ? { ...e, nombre: limpio } : e)))
    setPlataformas((prev) => prev.map((p) => (p.estado === est.nombre ? { ...p, estado: limpio } : p)))
    router.refresh()
  }

  const eliminarEstado = async (est: HomologacionEstado) => {
    const { error } = await supabase.from('homologacion_estados').delete().eq('id', est.id)
    if (error) { toast({ title: 'No se pudo eliminar', description: error.message, variant: 'destructive' }); return }
    setEstados((prev) => prev.filter((e) => e.id !== est.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Plataformas de compras</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
            {plataformas.length} plataformas registradas
            {puedeVerCredenciales && (
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> ves credenciales
              </span>
            )}
          </p>
        </div>
        {puedeEditar && (
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setEstadosOpen(true)} className="gap-2">
              <Settings2 className="h-4 w-4" /> Estados
            </Button>
            <Button onClick={abrirNueva} className="gap-2">
              <Plus className="h-4 w-4" /> Nueva plataforma
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-x-auto dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <th className="px-4 py-3 font-medium">Plataforma</th>
              <th className="px-4 py-3 font-medium">Acceso</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              {puedeVerCredenciales && <th className="px-4 py-3 font-medium">Usuario</th>}
              {puedeVerCredenciales && <th className="px-4 py-3 font-medium">Contraseña</th>}
              {puedeEditar && <th className="px-4 py-3 font-medium text-right">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {plataformas.length === 0 ? (
              <tr><td colSpan={cols} className="px-4 py-10 text-center text-gray-400">No hay plataformas registradas.</td></tr>
            ) : plataformas.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 last:border-0 dark:border-gray-700/60">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{p.plataforma}</td>
                <td className="px-4 py-3 w-[240px]">
                  <div className="flex items-center gap-1.5 w-[240px]">
                    {esUrl(p.acceso) && (
                      <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-navy-mid dark:text-blue-300" />
                    )}
                    {esUrl(p.acceso) ? (
                      <a
                        href={p.acceso!}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={p.acceso ?? undefined}
                        className="truncate min-w-0 text-navy-mid dark:text-blue-300 hover:underline"
                      >
                        {etiquetaAcceso(p.acceso)}
                      </a>
                    ) : (
                      <span className="truncate min-w-0 text-gray-500 dark:text-gray-400" title={p.acceso ?? undefined}>
                        {p.acceso || '—'}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  {puedeEditar ? (
                    <Select value={p.estado ?? ''} onValueChange={(v) => cambiarEstado(p, v)}>
                      <SelectTrigger className="h-8 w-[150px]"><SelectValue placeholder="Estado" /></SelectTrigger>
                      <SelectContent>
                        {estados.map((e) => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}
                        {p.estado && !estados.some((e) => e.nombre === p.estado) && (
                          <SelectItem value={p.estado}>{p.estado}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className={cn('inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', estadoCls(p.estado))}>{p.estado ?? '—'}</span>
                  )}
                </td>
                {puedeVerCredenciales && (
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">{p.usuario || '—'}</td>
                )}
                {puedeVerCredenciales && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {p.contrasena ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-700 dark:text-gray-200">{verPass[p.id] ? p.contrasena : '••••••••'}</span>
                        <button onClick={() => setVerPass((v) => ({ ...v, [p.id]: !v[p.id] }))}
                          className="p-1 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-100" title={verPass[p.id] ? 'Ocultar' : 'Mostrar'}>
                          {verPass[p.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                )}
                {puedeEditar && (
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => abrirEditar(p)} title="Editar" className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setAEliminar(p)} title="Eliminar" className="p-1.5 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal alta/edición plataforma */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && !guardando && setModalOpen(false)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editando ? 'Editar plataforma' : 'Nueva plataforma'}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Plataforma</Label>
              <Input value={fPlataforma} onChange={(e) => setFPlataforma(e.target.value)} placeholder="Nombre de la plataforma" autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label>Acceso (link)</Label>
              <Input value={fAcceso} onChange={(e) => setFAcceso(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={fEstado} onValueChange={setFEstado}>
                <SelectTrigger><SelectValue placeholder="Seleccionar estado..." /></SelectTrigger>
                <SelectContent>
                  {estados.map((e) => <SelectItem key={e.id} value={e.nombre}>{e.nombre}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {puedeVerCredenciales && (
              <div className="grid grid-cols-1 gap-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="space-y-1.5">
                  <Label>Usuario</Label>
                  <Input value={fUsuario} onChange={(e) => setFUsuario(e.target.value)} placeholder="Usuario o correo de acceso" />
                </div>
                <div className="space-y-1.5">
                  <Label>Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={verFormPass ? 'text' : 'password'}
                      value={fContrasena}
                      onChange={(e) => setFContrasena(e.target.value)}
                      placeholder="Contraseña de acceso"
                      className="pr-16"
                    />
                    <button type="button" onClick={() => setVerFormPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary hover:underline">
                      {verFormPass ? 'Ocultar' : 'Ver'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)} disabled={guardando}>Cancelar</Button>
            <Button onClick={guardarPlataforma} disabled={guardando}>
              {guardando ? <Loader2 className="h-4 w-4 animate-spin" /> : editando ? 'Guardar cambios' : 'Agregar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal gestión de estados */}
      <Dialog open={estadosOpen} onOpenChange={(o) => !o && setEstadosOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Estados</DialogTitle></DialogHeader>
          <div className="py-2 space-y-2">
            {estados.map((e) => (
              <div key={e.id} className="flex items-center gap-2">
                <Input defaultValue={e.nombre} onBlur={(ev) => renombrarEstado(e, ev.target.value)} className="h-9" />
                <button onClick={() => eliminarEstado(e)} title="Eliminar estado"
                  className="p-2 rounded-md text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 flex-shrink-0"><X className="h-4 w-4" /></button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <Input value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)} placeholder="Nuevo estado"
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarEstado() } }} className="h-9" />
              <Button onClick={agregarEstado} disabled={!nuevoEstado.trim()} className="flex-shrink-0">Agregar</Button>
            </div>
          </div>
          <p className="text-xs text-gray-400 px-1">Al renombrar un estado se actualizan las plataformas que lo usan. Sal del campo para guardar.</p>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!aEliminar}
        title="¿Eliminar esta plataforma?"
        description={aEliminar?.plataforma}
        variant="danger"
        loading={eliminando}
        confirmLabel="Eliminar"
        onConfirm={eliminarPlataforma}
        onCancel={() => setAEliminar(null)}
      />
    </div>
  )
}
