import { createClient } from '@/lib/supabase/server'
import type { HomologacionPlataforma, HomologacionEstado } from '@/types'
import { HomologacionClient } from '@/components/homologacion/HomologacionClient'

export const dynamic = 'force-dynamic'

export default async function HomologacionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: plataformas }, { data: estados }, { data: profile }] = await Promise.all([
    supabase.from('homologacion_plataformas').select('*').order('orden', { ascending: true }),
    supabase.from('homologacion_estados').select('*').eq('activo', true).order('orden', { ascending: true }),
    supabase.from('profiles').select('role, ver_credenciales').eq('id', user!.id).single(),
  ])

  const puedeEditar = profile?.role === 'admin' || profile?.role === 'editor'
  const puedeVerCredenciales = profile?.role === 'admin' || profile?.ver_credenciales === true

  let lista = (plataformas ?? []) as HomologacionPlataforma[]

  // Las credenciales solo se cargan (y solo llegan al navegador) si el usuario tiene permiso.
  if (puedeVerCredenciales) {
    const { data: creds } = await supabase
      .from('homologacion_credenciales')
      .select('plataforma_id, usuario, contrasena')
    const porId = new Map((creds ?? []).map((c) => [c.plataforma_id, c]))
    lista = lista.map((p) => {
      const c = porId.get(p.id)
      return { ...p, usuario: c?.usuario ?? null, contrasena: c?.contrasena ?? null }
    })
  }

  return (
    <HomologacionClient
      initialPlataformas={lista}
      initialEstados={(estados ?? []) as HomologacionEstado[]}
      puedeEditar={puedeEditar}
      puedeVerCredenciales={puedeVerCredenciales}
    />
  )
}
