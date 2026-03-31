'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { getMesFromFecha, getAñoFromFecha, calcularDuracion, DEPARTAMENTOS_COLOMBIA } from '@/lib/utils'
import type { Proceso, ProcesoFormData, EstadoProceso, Fuente, Sector, SumicorpCumple, Participa } from '@/types'
import { Loader2 } from 'lucide-react'

interface ProcesoFormModalProps {
  open: boolean
  onClose: () => void
  proceso?: Proceso | null
  onSuccess: () => void
}

const EMPTY_FORM: ProcesoFormData = {
  sector: 'Público',
  fuente: 'Secop II',
  año_publicacion: new Date().getFullYear(),
  fecha_publicacion: '',
  mes_publicacion: '',
  fecha_presentacion: '',
  entidad: '',
  estado_proceso: 'Pendiente',
  departamento_ejecucion: '',
  municipio_ejecucion: '',
  cuantia_proceso: '',
  objeto_proceso: '',
  tipo_proceso: '',
  numero_proceso: '',
  correo_entrega: '',
  contacto_proceso: '',
  fecha_inicio: '',
  fecha_terminacion: '',
  duracion_dias: '',
  proponente_ganador: '',
  valor_ofertado_ganador: '',
  valor_ofertado_sumicorp: '',
  sumicorp_cumple: 'PENDIENTE',
  gestion_realizar: '',
  participa: 'SI',
  observaciones: '',
}

export function ProcesoFormModal({ open, onClose, proceso, onSuccess }: ProcesoFormModalProps) {
  const [form, setForm] = useState<ProcesoFormData>(EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const isEditing = !!proceso

  useEffect(() => {
    if (proceso) {
      setForm({
        ...proceso,
        cuantia_proceso: proceso.cuantia_proceso ?? '',
        duracion_dias: proceso.duracion_dias ?? '',
        valor_ofertado_ganador: proceso.valor_ofertado_ganador ?? '',
        valor_ofertado_sumicorp: proceso.valor_ofertado_sumicorp ?? '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [proceso, open])

  const handleChange = (field: keyof ProcesoFormData, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value }

      // Auto-calcular mes y año
      if (field === 'fecha_publicacion' && value) {
        updated.mes_publicacion = getMesFromFecha(String(value))
        updated.año_publicacion = getAñoFromFecha(String(value))
      }

      // Auto-calcular duración
      if ((field === 'fecha_inicio' || field === 'fecha_terminacion') && updated.fecha_inicio && updated.fecha_terminacion) {
        updated.duracion_dias = calcularDuracion(updated.fecha_inicio as string, updated.fecha_terminacion as string)
      }

      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!form.entidad || !form.objeto_proceso || !form.fecha_publicacion) {
      toast({ title: 'Campos requeridos', description: 'Completa Entidad, Objeto y Fecha de Publicación', variant: 'destructive' })
      return
    }

    setLoading(true)

    const payload = {
      ...form,
      cuantia_proceso: form.cuantia_proceso ? Number(String(form.cuantia_proceso).replace(/\D/g, '')) : 0,
      duracion_dias: form.duracion_dias ? Number(form.duracion_dias) : null,
      valor_ofertado_ganador: form.valor_ofertado_ganador ? Number(String(form.valor_ofertado_ganador).replace(/\D/g, '')) : null,
      valor_ofertado_sumicorp: form.valor_ofertado_sumicorp ? Number(String(form.valor_ofertado_sumicorp).replace(/\D/g, '')) : null,
      año_publicacion: form.año_publicacion ? Number(form.año_publicacion) : null,
      // Limpiar campos vacíos
      fecha_presentacion: form.fecha_presentacion || null,
      fecha_inicio: form.fecha_inicio || null,
      fecha_terminacion: form.fecha_terminacion || null,
      departamento_ejecucion: form.departamento_ejecucion || null,
      municipio_ejecucion: form.municipio_ejecucion || null,
      tipo_proceso: form.tipo_proceso || null,
      numero_proceso: form.numero_proceso || null,
      correo_entrega: form.correo_entrega || null,
      contacto_proceso: form.contacto_proceso || null,
      proponente_ganador: form.proponente_ganador || null,
      gestion_realizar: form.gestion_realizar || null,
      observaciones: form.observaciones || null,
    }

    let error
    if (isEditing && proceso) {
      const { error: updateError } = await supabase.from('procesos').update(payload).eq('id', proceso.id)
      error = updateError
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error: insertError } = await supabase.from('procesos').insert({ ...payload, created_by: user?.id })
      error = insertError
    }

    setLoading(false)

    if (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' })
      return
    }

    toast({
      title: isEditing ? 'Proceso actualizado' : 'Proceso creado',
      description: `El proceso de "${form.entidad}" fue ${isEditing ? 'actualizado' : 'registrado'} exitosamente.`,
    })
    onSuccess()
    onClose()
  }

  const Field = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </Label>
      {children}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 bg-gray-50 rounded-t-lg sticky top-0 z-10">
          <DialogTitle className="text-lg font-bold text-gray-900">
            {isEditing ? 'Editar Proceso de Licitación' : 'Nuevo Proceso de Licitación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
          {/* Sección: Información General */}
          <Section title="Información General">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Sector" required>
                <Select value={form.sector} onValueChange={(v) => handleChange('sector', v as Sector)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Público">Público</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Fuente" required>
                <Select value={form.fuente} onValueChange={(v) => handleChange('fuente', v as Fuente)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Secop II">Secop II</SelectItem>
                    <SelectItem value="Secop I">Secop I</SelectItem>
                    <SelectItem value="Privado">Privado</SelectItem>
                    <SelectItem value="Otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Fecha de Publicación" required>
                <Input
                  type="date"
                  value={form.fecha_publicacion as string}
                  onChange={(e) => handleChange('fecha_publicacion', e.target.value)}
                  required
                />
              </Field>

              <Field label="Mes de Publicación (auto)">
                <Input value={form.mes_publicacion as string} readOnly className="bg-gray-50 text-gray-600" placeholder="Se calcula automáticamente" />
              </Field>

              <Field label="Número de Proceso">
                <Input value={form.numero_proceso as string} onChange={(e) => handleChange('numero_proceso', e.target.value)} placeholder="Ej: SDHT-CGT-037-2025" />
              </Field>

              <Field label="Tipo de Proceso">
                <Input value={form.tipo_proceso as string} onChange={(e) => handleChange('tipo_proceso', e.target.value)} placeholder="Ej: Licitación Pública, Concurso..." />
              </Field>

              <Field label="Estado del Proceso" required>
                <Select value={form.estado_proceso} onValueChange={(v) => handleChange('estado_proceso', v as EstadoProceso)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pendiente">Pendiente</SelectItem>
                    <SelectItem value="Borrador">Borrador</SelectItem>
                    <SelectItem value="En Evaluación">En Evaluación</SelectItem>
                    <SelectItem value="Adjudicado">Adjudicado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                    <SelectItem value="Desierto">Desierto</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Participa">
                <Select value={form.participa ?? 'SI'} onValueChange={(v) => handleChange('participa', v as Participa)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">SI</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Entidad" required>
              <Input value={form.entidad} onChange={(e) => handleChange('entidad', e.target.value)} placeholder="Nombre completo de la entidad contratante" required />
            </Field>

            <Field label="Objeto del Proceso" required>
              <Textarea
                value={form.objeto_proceso}
                onChange={(e) => handleChange('objeto_proceso', e.target.value)}
                placeholder="Descripción detallada del objeto del proceso..."
                rows={3}
                required
              />
            </Field>
          </Section>

          {/* Sección: Localización y Fechas */}
          <Section title="Localización y Fechas">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Departamento de Ejecución">
                <Select
                  value={form.departamento_ejecucion ?? ''}
                  onValueChange={(v) => handleChange('departamento_ejecucion', v)}
                >
                  <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                  <SelectContent>
                    {DEPARTAMENTOS_COLOMBIA.map((dep) => (
                      <SelectItem key={dep} value={dep}>{dep}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Municipio de Ejecución">
                <Input value={form.municipio_ejecucion as string} onChange={(e) => handleChange('municipio_ejecucion', e.target.value)} placeholder="Municipio" />
              </Field>

              <Field label="Fecha de Presentación">
                <Input type="date" value={form.fecha_presentacion as string} onChange={(e) => handleChange('fecha_presentacion', e.target.value)} />
              </Field>

              <Field label="Correo Entrega de Propuesta">
                <Input type="email" value={form.correo_entrega as string} onChange={(e) => handleChange('correo_entrega', e.target.value)} placeholder="correo@entidad.gov.co" />
              </Field>

              <Field label="Contacto del Proceso">
                <Input value={form.contacto_proceso as string} onChange={(e) => handleChange('contacto_proceso', e.target.value)} placeholder="Nombre del responsable" />
              </Field>

              <Field label="Cuantía del Proceso (COP)" required>
                <Input
                  type="number"
                  value={form.cuantia_proceso as string}
                  onChange={(e) => handleChange('cuantia_proceso', e.target.value)}
                  placeholder="0"
                  min="0"
                  required
                />
              </Field>

              <Field label="Fecha de Inicio">
                <Input type="date" value={form.fecha_inicio as string} onChange={(e) => handleChange('fecha_inicio', e.target.value)} />
              </Field>

              <Field label="Fecha de Terminación">
                <Input type="date" value={form.fecha_terminacion as string} onChange={(e) => handleChange('fecha_terminacion', e.target.value)} />
              </Field>

              <Field label="Duración (días, auto)">
                <Input type="number" value={form.duracion_dias as string} onChange={(e) => handleChange('duracion_dias', e.target.value)} placeholder="Se calcula automáticamente" />
              </Field>
            </div>
          </Section>

          {/* Sección: Información de Adjudicación */}
          <Section title="Adjudicación y SUMICORP">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Proponente Ganador">
                <Input value={form.proponente_ganador as string} onChange={(e) => handleChange('proponente_ganador', e.target.value)} placeholder="Nombre del proponente ganador" />
              </Field>

              <Field label="Valor Ofertado Ganador (COP)">
                <Input type="number" value={form.valor_ofertado_ganador as string} onChange={(e) => handleChange('valor_ofertado_ganador', e.target.value)} placeholder="0" min="0" />
              </Field>

              <Field label="Valor Ofertado SUMICORP (COP)">
                <Input type="number" value={form.valor_ofertado_sumicorp as string} onChange={(e) => handleChange('valor_ofertado_sumicorp', e.target.value)} placeholder="0" min="0" />
              </Field>

              <Field label="SUMICORP Cumple">
                <Select value={form.sumicorp_cumple ?? 'PENDIENTE'} onValueChange={(v) => handleChange('sumicorp_cumple', v as SumicorpCumple)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SI">SI</SelectItem>
                    <SelectItem value="NO">NO</SelectItem>
                    <SelectItem value="PENDIENTE">PENDIENTE</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
          </Section>

          {/* Sección: Notas */}
          <Section title="Notas y Gestión">
            <div className="grid grid-cols-1 gap-4">
              <Field label="Gestión a Realizar">
                <Textarea value={form.gestion_realizar as string} onChange={(e) => handleChange('gestion_realizar', e.target.value)} placeholder="Acciones pendientes, gestión requerida..." rows={2} />
              </Field>
              <Field label="Observaciones">
                <Textarea value={form.observaciones as string} onChange={(e) => handleChange('observaciones', e.target.value)} placeholder="Observaciones adicionales del proceso..." rows={3} />
              </Field>
            </div>
          </Section>

          <DialogFooter className="pt-2 gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-700 hover:bg-blue-800 min-w-[140px]">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? 'Actualizando...' : 'Guardando...'}</>
              ) : (
                isEditing ? 'Actualizar Proceso' : 'Guardar Proceso'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <div className="h-5 w-1 bg-blue-600 rounded-full" />
        <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">{title}</h4>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
