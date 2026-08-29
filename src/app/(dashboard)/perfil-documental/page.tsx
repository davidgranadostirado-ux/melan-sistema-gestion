import { createClient } from '@/lib/supabase/server'
import type { PerfilDocumento } from '@/types'
import { PerfilDocumentalClient } from '@/components/perfil-documental/PerfilDocumentalClient'

export const dynamic = 'force-dynamic'

export default async function PerfilDocumentalPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: docs }, { data: profile }] = await Promise.all([
    supabase.from('perfil_documentos').select('*').order('orden', { ascending: true }),
    supabase.from('profiles').select('role').eq('id', user!.id).single(),
  ])

  const puedeEditar = profile?.role === 'admin' || profile?.role === 'editor'

  return (
    <PerfilDocumentalClient
      initialDocs={(docs ?? []) as PerfilDocumento[]}
      puedeEditar={puedeEditar}
    />
  )
}
