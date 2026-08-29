'use client'

import { useState, useEffect } from 'react'
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
import { DatePicker } from '@/components/ui/date-picker'
import { Loader2 } from 'lucide-react'
import type { PerfilDocumento } from '@/types'

function SiNo({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="si">Sí</SelectItem>
          <SelectItem value="no">No</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

interface Props {
  open: boolean
  onClose: () => void
  doc?: PerfilDocumento | null
  onSaved: () => void
}

export function DocumentoFormModal({ open, onClose, doc, onSaved }: Props) {
  const { toast } = useToast()
  const supabase = createClient()
  const isEdit = !!doc

  const [loading, setLoading] = useState(false)
  const [documento, setDocumento] = useState('')
  const [aplica, setAplica] = useState('si')
  const [noAplica, setNoAplica] = useState('no')
  const [loTiene, setLoTiene] = useState('no')
  const [noLoTiene, setNoLoTiene] = useState('si')
  const [fechaDoc, setFechaDoc] = useState('')
  const [fechaVenc, setFechaVenc] = useState('')

  useEffect(() => {
    if (!open) return
    setDocumento(doc?.documento ?? '')
    setAplica(doc ? (doc.aplica ? 'si' : 'no') : 'si')
    setNoAplica(doc ? (doc.no_aplica ? 'si' : 'no') : 'no')
    setLoTiene(doc ? (doc.lo_tiene ? 'si' : 'no') : 'no')
    setNoLoTiene(doc ? (doc.no_lo_tiene ? 'si' : 'no') : 'si')
    setFechaDoc(doc?.fecha_documento ?? '')
    setFechaVenc(doc?.fecha_vencimiento ?? '')
  }, [open, doc])

  const guardar = async () => {
    if (!documento.trim()) {
      toast({ title: 'Escribe el nombre del documento', variant: 'destructive' })
      return
    }
    setLoading(true)
    const payload = {
      documento: documento.trim(),
      aplica: aplica === 'si',
      no_aplica: noAplica === 'si',
      lo_tiene: loTiene === 'si',
      no_lo_tiene: noLoTiene === 'si',
      fecha_documento: fechaDoc || null,
      fecha_vencimiento: fechaVenc || null,
    }
    const { error } = isEdit
      ? await supabase.from('perfil_documentos').update(payload).eq('id', doc!.id)
      : await supabase.from('perfil_documentos').insert(payload)
    setLoading(false)

    if (error) {
      const dup = error.code === '23505'
      toast({
        title: dup ? 'Ese documento ya existe' : 'No se pudo guardar',
        description: dup ? undefined : error.message,
        variant: 'destructive',
      })
      return
    }
    toast({ title: isEdit ? 'Documento actualizado' : 'Documento agregado' })
    onSaved()
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar documento' : 'Nuevo documento'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Documento</Label>
            <Input
              value={documento}
              onChange={(e) => setDocumento(e.target.value)}
              placeholder="Ej: RUP, Cámara de Comercio, Resolución..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SiNo label="Aplica" value={aplica} onChange={setAplica} />
            <SiNo label="No Aplica" value={noAplica} onChange={setNoAplica} />
            <SiNo label="Lo tiene" value={loTiene} onChange={setLoTiene} />
            <SiNo label="No lo tiene" value={noLoTiene} onChange={setNoLoTiene} />
            <div className="space-y-1.5">
              <Label>Fecha del documento</Label>
              <DatePicker value={fechaDoc} onChange={setFechaDoc} />
            </div>
            <div className="space-y-1.5">
              <Label>Fecha de vencimiento</Label>
              <DatePicker value={fechaVenc} onChange={setFechaVenc} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={guardar} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? 'Guardar cambios' : 'Agregar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
