'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import { AlertTriangle, Loader2, Pencil } from 'lucide-react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description?: string
  detail?: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const esPeligro = variant === 'danger'

  return (
    <Dialog open={open} onOpenChange={(o) => !o && !loading && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={`flex-shrink-0 rounded-full p-2.5 ${
                esPeligro ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
              }`}
            >
              {esPeligro ? <AlertTriangle className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
            </div>
            <div className="flex-1 text-left">
              <DialogTitle className="text-left">{title}</DialogTitle>
              {description && (
                <DialogDescription className="text-left mt-1.5">{description}</DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        {detail && (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            {detail}
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={esPeligro ? 'bg-red-600 hover:bg-red-700 text-white' : undefined}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
