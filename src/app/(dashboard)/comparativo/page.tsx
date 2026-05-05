import { createClient } from '@/lib/supabase/server'
import type { Proceso } from '@/types'
import { ComparativoClient } from '@/components/comparativo/ComparativoClient'

export const dynamic = 'force-dynamic'

export default async function ComparativoPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('fecha_publicacion', { ascending: true })

  return <ComparativoClient procesos={(procesos ?? []) as Proceso[]} />
}
