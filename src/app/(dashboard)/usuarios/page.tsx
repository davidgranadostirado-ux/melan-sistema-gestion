import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Profile } from '@/types'
import { UsuariosClient } from '@/components/usuarios/UsuariosClient'

export const dynamic = 'force-dynamic'

export default async function UsuariosPage() {
  const supabase = createClient()

  // Verificar que es admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single()

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  const { data: usuarios = [] } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return <UsuariosClient usuarios={(usuarios ?? []) as Profile[]} />
}
