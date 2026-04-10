'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Crear usuario directamente con contraseña (sin invitación por correo) */
export async function createUser(email: string, password: string, fullName: string, role: string) {
  const supabase = getAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // confirma el email automáticamente
    user_metadata: { full_name: fullName },
  })

  if (error) return { error: error.message }

  // Crear perfil inmediatamente
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  if (profileError) return { error: profileError.message }

  return { success: true, userId: data.user.id }
}

/** Cambiar contraseña de un usuario existente */
export async function updateUserPassword(userId: string, newPassword: string) {
  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

/** Eliminar usuario */
export async function deleteUser(userId: string) {
  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}
