import { createClient } from '@/lib/supabase/server'
import type { Gasto, Venta, CategoriaGasto } from '@/types'
import { FinanzasClient } from '@/components/finanzas/FinanzasClient'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const supabase = createClient()

  const [{ data: gastos }, { data: ventas }, { data: categorias }] = await Promise.all([
    supabase.from('gastos').select('*').order('fecha', { ascending: false }),
    supabase.from('ventas').select('*').order('fecha', { ascending: false }),
    supabase.from('categorias_gasto').select('*').eq('activo', true).order('nombre'),
  ])

  return (
    <FinanzasClient
      initialGastos={(gastos ?? []) as Gasto[]}
      initialVentas={(ventas ?? []) as Venta[]}
      initialCategorias={(categorias ?? []) as CategoriaGasto[]}
    />
  )
}
