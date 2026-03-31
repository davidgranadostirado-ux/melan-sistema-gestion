import { createClient } from '@/lib/supabase/server'
import { ProcesosTable } from '@/components/procesos/ProcesosTable'
import type { Proceso } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProcesosPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div>
      <ProcesosTable initialProcesos={(procesos ?? []) as Proceso[]} />
    </div>
  )
}
