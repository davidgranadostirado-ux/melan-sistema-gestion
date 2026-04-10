'use server'

import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function inviteUser(email: string, fullName: string, role: string) {
  const supabase = getAdminClient()

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: fullName },
  })

  if (error) return { error: error.message }

  // Crear perfil inmediatamente
  await supabase.from('profiles').upsert({
    id: data.user.id,
    email,
    full_name: fullName,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return { success: true, userId: data.user.id }
}

export async function deleteUser(userId: string) {
  const supabase = getAdminClient()
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }
  return { success: true }
}
