import { createClient } from '@/lib/supabase/server'
import { ProcesosTable } from '@/components/procesos/ProcesosTable'
import type { Proceso } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProcesosPage() {
  const supabase = createClient()

  const [{ data: procesos }, { data: profiles }] = await Promise.all([
    supabase.from('procesos').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name'),
  ])

  // Mapa id → nombre para mostrar quién cargó cada proceso
  const profileMap: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name])
  )

  const procesosConCreador: Proceso[] = (procesos ?? []).map((p) => ({
    ...p,
    created_by_name: p.created_by ? (profileMap[p.created_by] ?? 'Desconocido') : '—',
  }))

  return (
    <div>
      <ProcesosTable initialProcesos={procesosConCreador} />
    </div>
  )
}
