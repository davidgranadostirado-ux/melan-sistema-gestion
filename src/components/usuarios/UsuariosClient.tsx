'use client'

import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Profile, UserRole } from '@/types'
import { Pencil, Users, Shield, Eye, Loader2, Trash2, UserPlus, KeyRound } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { createUser, deleteUser, updateUserPassword } from '@/app/actions/usuarios'

interface UsuariosClientProps {
  usuarios: Profile[]
}

const ROLE_CONFIG = {
  admin:  { label: 'Administrador', color: 'bg-red-100 text-red-800',  icon: Shield },
  editor: { label: 'Editor',        color: 'bg-blue-100 text-blue-800', icon: Pencil },
  viewer: { label: 'Visor',         color: 'bg-gray-100 text-gray-700', icon: Eye },
}

const EMPTY_CREATE = { email: '', full_name: '', password: '', role: 'viewer' as UserRole }

export function UsuariosClient({ usuarios: initialUsuarios }: UsuariosClientProps) {
  const [usuarios, setUsuarios] = useState<Profile[]>(initialUsuarios)

  // Crear
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm]             = useState(EMPTY_CREATE)
  const [showPass, setShowPass]     = useState(false)

  // Editar
  const [editUser, setEditUser]   = useState<Profile | null>(null)
  const [newName, setNewName]     = useState('')
  const [newRole, setNewRole]     = useState<UserRole>('viewer')

  // Cambiar contraseña
  const [pwdUser, setPwdUser]         = useState<Profile | null>(null)
  const [newPwd, setNewPwd]           = useState('')
  const [showNewPwd, setShowNewPwd]   = useState(false)

  // Eliminar
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // ── Crear ────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!form.email || !form.full_name || !form.password) {
      toast({ title: 'Campos requeridos', description: 'Completa todos los campos obligatorios.', variant: 'destructive' })
      return
    }
    if (form.password.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const result = await createUser(form.email, form.password, form.full_name, form.role)
    setLoading(false)
    if (result.error) { toast({ title: 'Error al crear usuario', description: result.error, variant: 'destructive' }); return }
    setUsuarios((prev) => [...prev, {
      id: result.userId!,
      email: form.email,
      full_name: form.full_name,
      role: form.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    toast({ title: 'Usuario creado', description: `${form.full_name} puede iniciar sesión de inmediato.` })
    setForm(EMPTY_CREATE)
    setShowCreate(false)
  }

  // ── Editar ──────────────────────────────────────────────
  const handleEdit = (user: Profile) => {
    setEditUser(user); setNewName(user.full_name); setNewRole(user.role)
  }

  const handleSave = async () => {
    if (!editUser) return
    setLoading(true)
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName, role: newRole, updated_at: new Date().toISOString() })
      .eq('id', editUser.id)
    setLoading(false)
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return }
    setUsuarios((prev) => prev.map((u) => u.id === editUser.id ? { ...u, full_name: newName, role: newRole } : u))
    toast({ title: 'Usuario actualizado', description: `${newName} fue actualizado.` })
    setEditUser(null)
  }

  // ── Cambiar contraseña ────────────────────────────────────
  const handleChangePwd = async () => {
    if (!pwdUser || !newPwd) return
    if (newPwd.length < 6) {
      toast({ title: 'Contraseña muy corta', description: 'Mínimo 6 caracteres.', variant: 'destructive' })
      return
    }
    setLoading(true)
    const result = await updateUserPassword(pwdUser.id, newPwd)
    setLoading(false)
    if (result.error) { toast({ title: 'Error', description: result.error, variant: 'destructive' }); return }
    toast({ title: 'Contraseña actualizada', description: `La contraseña de ${pwdUser.full_name} fue cambiada.` })
    setPwdUser(null)
    setNewPwd('')
  }

  // ── Eliminar ─────────────────────────────────────────────
  const handleDelete = async (userId: string) => {
    setLoading(true)
    const result = await deleteUser(userId)
    setLoading(false)
    if (result.error) { toast({ title: 'Error al eliminar', description: result.error, variant: 'destructive' }); return }
    setUsuarios((prev) => prev.filter((u) => u.id !== userId))
    toast({ title: 'Usuario eliminado', description: 'El usuario fue eliminado del sistema.' })
    setDeleteConfirm(null)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Resumen por rol */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {(['admin', 'editor', 'viewer'] as UserRole[]).map((role) => {
            const count = usuarios.filter((u) => u.role === role).length
            const config = ROLE_CONFIG[role]
            const Icon = config.icon
            return (
              <div key={role} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 shadow-sm">
                <div className="p-3 bg-gray-100 rounded-xl"><Icon className="h-5 w-5 text-gray-600" /></div>
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
            <Button onClick={() => setShowCreate(true)} className="bg-blue-700 hover:bg-blue-800 gap-2 text-sm">
              <UserPlus className="h-4 w-4" /> Nuevo Usuario
            </Button>
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
                      <td className="px-5 py-4 text-gray-500">{formatDate(user.created_at?.split('T')[0])}</td>
                      <td className="px-5 py-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => handleEdit(user)} className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors" title="Editar nombre y rol">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => { setPwdUser(user); setNewPwd('') }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Cambiar contraseña">
                            <KeyRound className="h-4 w-4" />
                          </button>
                          {deleteConfirm === user.id ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => handleDelete(user.id)} disabled={loading} className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors">
                                {loading ? '...' : 'Confirmar'}
                              </button>
                              <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors">
                                No
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setDeleteConfirm(user.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal crear usuario */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) { setShowCreate(false); setForm(EMPTY_CREATE) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Crear Nuevo Usuario</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nombre completo <span className="text-red-500">*</span></Label>
              <Input placeholder="Nombre del usuario" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Correo electrónico <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="correo@empresa.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="pr-16"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  {showPass ? 'Ocultar' : 'Ver'}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rol en el sistema</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as UserRole })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador — acceso total</SelectItem>
                  <SelectItem value="editor">Editor — crear y editar procesos</SelectItem>
                  <SelectItem value="viewer">Visor — solo lectura</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-xs text-gray-500 bg-green-50 border border-green-200 rounded-lg p-2.5">
              ✓ El usuario podrá iniciar sesión de inmediato con estas credenciales, sin necesidad de confirmar su correo.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCreate(false); setForm(EMPTY_CREATE) }}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={loading} className="bg-blue-700 hover:bg-blue-800">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando...</> : <><UserPlus className="mr-2 h-4 w-4" />Crear usuario</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal editar */}
      <Dialog open={!!editUser} onOpenChange={(o) => !o && setEditUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Usuario</DialogTitle></DialogHeader>
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

      {/* Modal cambiar contraseña */}
      <Dialog open={!!pwdUser} onOpenChange={(o) => { if (!o) { setPwdUser(null); setNewPwd('') } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Cambiar Contraseña</DialogTitle></DialogHeader>
          {pwdUser && (
            <div className="space-y-4 py-2">
              <p className="text-sm text-gray-600">
                Establecer nueva contraseña para <span className="font-semibold">{pwdUser.full_name}</span>
              </p>
              <div className="space-y-2">
                <Label>Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    type={showNewPwd ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                    className="pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPwd(!showNewPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {showNewPwd ? 'Ocultar' : 'Ver'}
                  </button>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPwdUser(null); setNewPwd('') }}>Cancelar</Button>
            <Button onClick={handleChangePwd} disabled={loading} className="bg-blue-700 hover:bg-blue-800">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : <><KeyRound className="mr-2 h-4 w-4" />Cambiar contraseña</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
