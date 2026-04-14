import { createClient } from '@/lib/supabase/server'
import type { Proceso } from '@/types'
import { EstadisticasClient } from '@/components/estadisticas/EstadisticasClient'

export const dynamic = 'force-dynamic'

export default async function EstadisticasPage() {
  const supabase = createClient()

  const { data: procesos = [] } = await supabase
    .from('procesos')
    .select('*')
    .order('fecha_publicacion', { ascending: true })

  return <EstadisticasClient procesos={(procesos ?? []) as Proceso[]} />
}
