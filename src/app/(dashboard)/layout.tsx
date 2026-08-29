import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { SessionGuard } from '@/components/layout/SessionGuard'
import { construirNotificaciones } from '@/lib/notificaciones'
import type { Proceso, Gasto, Venta, PerfilDocumento } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Perfil del usuario + datos que alimentan las notificaciones
  const [
    { data: profileData },
    { data: procesos },
    { data: gastos },
    { data: ventas },
    { data: documentos },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('procesos').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('gastos').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('ventas').select('*').order('created_at', { ascending: false }).limit(400),
    supabase.from('perfil_documentos').select('*'),
    supabase.from('profiles').select('id, full_name'),
  ])

  // Garantizar que el email del perfil esté disponible como fallback
  const profile = profileData
    ? { ...profileData, email: profileData.email || user.email || '' }
    : null

  const nombresPorId: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  )

  const notificaciones = construirNotificaciones({
    procesos: (procesos ?? []) as Proceso[],
    gastos: (gastos ?? []) as Gasto[],
    ventas: (ventas ?? []) as Venta[],
    documentos: (documentos ?? []) as PerfilDocumento[],
    nombresPorId,
  })

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden dark:bg-gray-900">
      <SessionGuard />
      <Sidebar userProfile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar userProfile={profile} notificaciones={notificaciones} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
