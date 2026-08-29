'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/utils'
import type { Gasto, Venta, CategoriaGasto, TipoMovimiento } from '@/types'
import { Loader2, Plus, Check, X, AlertTriangle } from 'lucide-react'

interface MovimientoFormModalProps {
  open: boolean
  tipo: TipoMovimiento
  gasto?: Gasto | null
  venta?: Venta | null
  categorias: CategoriaGasto[]
  onClose: () => void
  onSuccess: () => void
  onCategoriaCreada: (categoria: CategoriaGasto) => void
}

const IVA_OPCIONES = [0, 5, 19]

interface FormState {
  fecha: string
  tercero: string
  categoria: string
  descripcion: string
  numero_factura: string
  valor: string
  iva_pct: string
  iva: string
  observaciones: string
}

const hoy = () => new Date().toISOString().slice(0, 10)

const EMPTY: FormState = {
  fecha: '',
  tercero: '',
  categoria: '',
  descripcion: '',
  numero_factura: '',
  valor: '',
  iva_pct: '19',
  iva: '',
  observaciones: '',
}

export function MovimientoFormModal({
  open, tipo, gasto, venta, categorias, onClose, onSuccess, onCategoriaCreada,
}: MovimientoFormModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [ivaManual, setIvaManual] = useState(false)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [agregandoCategoria, setAgregandoCategoria] = useState(false)
  const [guardandoCategoria, setGuardandoCategoria] = useState(false)
  const [confirmandoEdicion, setConfirmandoEdicion] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const esGasto = tipo === 'Gasto'
  const registro = esGasto ? gasto : venta
  const isEditing = !!registro

  useEffect(() => {
    if (!open) return
    setIvaManual(false)
    setAgregandoCategoria(false)
    setNuevaCategoria('')
    setConfirmandoEdicion(false)

    if (gasto && esGasto) {
      setForm({
        fecha: gasto.fecha ?? hoy(),
        tercero: gasto.proveedor ?? '',
        categoria: gasto.categoria ?? '',
        descripcion: gasto.descripcion ?? '',
        numero_factura: '',
        valor: String(gasto.valor ?? ''),
        iva_pct: String(gasto.iva_pct ?? 19),
        iva: String(gasto.iva ?? ''),
        observaciones: gasto.observaciones ?? '',
      })
    } else if (venta && !esGasto) {
      setForm({
        fecha: venta.fecha ?? hoy(),
        tercero: venta.cliente ?? '',
        categoria: '',
        descripcion: venta.descripcion ?? '',
        numero_factura: venta.numero_factura ?? '',
        valor: String(venta.valor ?? ''),
        iva_pct: String(venta.iva_pct ?? 19),
        iva: String(venta.iva ?? ''),
        observaciones: venta.observaciones ?? '',
      })
    } else {
      setForm({ ...EMPTY, fecha: hoy() })
    }
  }, [open, gasto, venta, esGasto])

  const valorNum = Number(form.valor) || 0
  const ivaNum = Number(form.iva) || 0
  const total = valorNum + ivaNum

  // Recalcular IVA automáticamente cuando cambia el valor o el %
  const recalcularIva = (valor: string, pct: string) => {
    if (ivaManual) return
    const v = Number(valor) || 0
    const p = Number(pct) || 0
    const calculado = Math.round(v * (p / 100))
    setForm((prev) => ({ ...prev, valor, iva_pct: pct, iva: calculado ? String(calculado) : '' }))
  }

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleAgregarCategoria = async () => {
    const nombre = nuevaCategoria.trim()
    if (!nombre) return
    if (categorias.some((c) => c.nombre.toLowerCase() === nombre.toLowerCase())) {
      toast({ title: 'Esa categoría ya existe', variant: 'destructive' })
      return
    }
    setGuardandoCategoria(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('categorias_gasto')
      .insert({ nombre, created_by: user?.id })
      .select()
      .single()
    setGuardandoCategoria(false)

    if (error) {
      toast({ title: 'No se pudo crear la categoría', description: error.message, variant: 'destructive' })
      return
    }
    onCategoriaCreada(data as CategoriaGasto)
    set('categoria', nombre)
    setNuevaCategoria('')
    setAgregandoCategoria(false)
    toast({ title: 'Categoría agregada', description: nombre })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.tercero.trim()) {
      toast({ title: esGasto ? 'Indica el proveedor' : 'Indica el cliente', variant: 'destructive' })
      return
    }
    if (esGasto && !form.categoria) {
      toast({ title: 'Selecciona el gasto operativo', variant: 'destructive' })
      return
    }
    if (!esGasto && !form.descripcion.trim()) {
      toast({ title: 'Indica la descripción de la venta', variant: 'destructive' })
      return
    }
    if (valorNum <= 0) {
      toast({ title: 'El valor debe ser mayor a cero', variant: 'destructive' })
      return
    }

    // Al modificar un registro existente pedimos confirmación antes de guardar
    if (isEditing && !confirmandoEdicion) {
      setConfirmandoEdicion(true)
      return
    }

    guardar()
  }

  const guardar = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const payload = esGasto
      ? {
          fecha: form.fecha || hoy(),
          proveedor: form.tercero.trim(),
          categoria: form.categoria,
          descripcion: form.descripcion.trim() || null,
          valor: valorNum,
          iva_pct: Number(form.iva_pct) || 0,
          iva: ivaNum,
          observaciones: form.observaciones.trim() || null,
        }
      : {
          fecha: form.fecha || hoy(),
          cliente: form.tercero.trim(),
          descripcion: form.descripcion.trim(),
          numero_factura: form.numero_factura.trim() || null,
          valor: valorNum,
          iva_pct: Number(form.iva_pct) || 0,
          iva: ivaNum,
          observaciones: form.observaciones.trim() || null,
        }

    const tabla = esGasto ? 'gastos' : 'ventas'
    const { error } = isEditing
      ? await supabase.from(tabla).update(payload).eq('id', registro!.id)
      : await supabase.from(tabla).insert({ ...payload, created_by: user?.id })

    setLoading(false)
    setConfirmandoEdicion(false)

    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' })
      return
    }

    toast({
      title: isEditing ? 'Registro actualizado' : esGasto ? 'Gasto registrado' : 'Venta registrada',
      description: `${form.tercero} · ${formatCurrency(total)}`,
    })
    onSuccess()
    onClose()
  }

  const categoriasOrdenadas = useMemo(
    () => [...categorias].sort((a, b) => a.nombre.localeCompare(b.nombre)),
    [categorias]
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar ' : 'Registrar '}
            {esGasto ? 'gasto' : 'venta facturada'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={form.fecha}
                onChange={(e) => set('fecha', e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tercero">{esGasto ? 'Proveedor *' : 'Cliente *'}</Label>
              <Input
                id="tercero"
                value={form.tercero}
                onChange={(e) => set('tercero', e.target.value)}
                placeholder={esGasto ? 'Ej: Believe' : 'Ej: Alcaldía de Sincelejo'}
                required
              />
            </div>
          </div>

          {/* Gasto operativo: lista desplegable + agregar nuevo */}
          {esGasto && (
            <div className="space-y-1.5">
              <Label htmlFor="categoria">Gasto Operativo *</Label>
              {!agregandoCategoria ? (
                <div className="flex gap-2">
                  <select
                    id="categoria"
                    value={form.categoria}
                    onChange={(e) => set('categoria', e.target.value)}
                    className="flex-1 h-10 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecciona…</option>
                    {categoriasOrdenadas.map((c) => (
                      <option key={c.id} value={c.nombre}>{c.nombre}</option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAgregandoCategoria(true)}
                    title="Agregar nueva categoría"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    autoFocus
                    value={nuevaCategoria}
                    onChange={(e) => setNuevaCategoria(e.target.value)}
                    placeholder="Nombre de la nueva categoría"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleAgregarCategoria() }
                      if (e.key === 'Escape') { setAgregandoCategoria(false); setNuevaCategoria('') }
                    }}
                  />
                  <Button type="button" onClick={handleAgregarCategoria} disabled={guardandoCategoria}>
                    {guardandoCategoria ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setAgregandoCategoria(false); setNuevaCategoria('') }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">
              {esGasto ? 'Detalle del gasto' : 'Descripción de la venta *'}
            </Label>
            <Textarea
              id="descripcion"
              rows={2}
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder={esGasto ? 'Opcional' : 'Ej: Suministro de insumos de aseo'}
              required={!esGasto}
            />
          </div>

          {!esGasto && (
            <div className="space-y-1.5">
              <Label htmlFor="numero_factura">N.º de factura</Label>
              <Input
                id="numero_factura"
                value={form.numero_factura}
                onChange={(e) => set('numero_factura', e.target.value)}
                placeholder="Opcional"
              />
            </div>
          )}

          {/* Valores */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (sin IVA) *</Label>
              <Input
                id="valor"
                type="number"
                min={0}
                step="1"
                value={form.valor}
                onChange={(e) => recalcularIva(e.target.value, form.iva_pct)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iva_pct">IVA %</Label>
              <select
                id="iva_pct"
                value={form.iva_pct}
                onChange={(e) => recalcularIva(form.valor, e.target.value)}
                className="w-full h-10 px-3 text-sm border border-gray-200 rounded-md bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {IVA_OPCIONES.map((o) => <option key={o} value={o}>{o}%</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="iva">Valor IVA</Label>
              <Input
                id="iva"
                type="number"
                min={0}
                step="1"
                value={form.iva}
                onChange={(e) => { setIvaManual(true); set('iva', e.target.value) }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
            <span className="text-sm font-medium text-gray-600">Total</span>
            <span className="text-xl font-bold text-gray-900">{formatCurrency(total)}</span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              rows={2}
              value={form.observaciones}
              onChange={(e) => set('observaciones', e.target.value)}
              placeholder="Opcional"
            />
          </div>

          {/* Confirmación al modificar */}
          {confirmandoEdicion && (
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
              <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-900">
                <p className="font-semibold">¿Confirmas guardar los cambios?</p>
                <p className="opacity-80 mt-0.5">
                  Se actualizará el registro de <strong>{form.tercero}</strong> por{' '}
                  <strong>{formatCurrency(total)}</strong> y se recalcularán los KPIs.
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {confirmandoEdicion ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmandoEdicion(false)}
                  disabled={loading}
                >
                  No, seguir editando
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Sí, guardar cambios
                </Button>
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Guardar cambios' : 'Registrar'}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
