'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, UserRole } from '@/types'
import { Pencil, Users, Shield, Eye, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface UsuariosClientProps {
  usuarios: Profile[]
}

const ROLE_CONFIG = {
  admin:  { label: 'Administrador', color: 'bg-red-100 text-red-800', icon: Shield },
  editor: { label: 'Editor',        color: 'bg-blue-100 text-blue-800', icon: Pencil },
  viewer: { label: 'Visor',         color: 'bg-gray-100 text-gray-700', icon: Eye },
}

export function UsuariosClient({ usuarios: initialUsuarios }: UsuariosClientProps) {
  const [usuarios, setUsuarios] = useState<Profile[]>(initialUsuarios)
  const [editUser, setEditUser] = useState<Profile | null>(null)
  const [newName, setNewName] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('viewer')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const handleEdit = (user: Profile) => {
    setEditUser(user)
    setNewName(user.full_name)
    setNewRole(user.role)
  }

  const handleSave = async () => {
    if (!editUser) return
    setLoading(true)

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName, role: newRole, updated_at: new Date().toISOString() })
      .eq('id', editUser.id)

    setLoading(false)

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
      return
    }

    setUsuarios((prev) =>
      prev.map((u) => u.id === editUser.id ? { ...u, full_name: newName, role: newRole } : u)
    )
    toast({ title: 'Usuario actualizado', description: `${newName} fue actualizado correctamente.` })
    setEditUser(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumen */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['admin', 'editor', 'viewer'] as UserRole[]).map((role) => {
            const count = usuarios.filter((u) => u.role === role).length
            const config = ROLE_CONFIG[role]
            const Icon = config.icon
            return (
              <div key={role} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-gray-100 rounded-xl">
                  <Icon className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{config.label}es</p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tabla */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-gray-500" />
              <h3 className="font-semibold text-gray-800">Usuarios del Sistema</h3>
              <span className="text-sm text-gray-400">({usuarios.length} usuarios)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Usuario</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Correo</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Rol</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Registrado</th>
                  <th className="px-5 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usuarios.map((user) => {
                  const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.viewer
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                            {user.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
                          </div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-gray-600">{user.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${roleConfig.color}`}>
                          {roleConfig.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {formatDate(user.created_at?.split('T')[0])}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal editar */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Rol en el sistema</Label>
              <Select value={newRole} onValueChange={(v) => setNewRole(v as UserRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador — acceso total</SelectItem>
                  <SelectItem value="editor">Editor — crear y editar procesos</SelectItem>
                  <SelectItem value="viewer">Visor — solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-blue-700 hover:bg-blue-800">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
