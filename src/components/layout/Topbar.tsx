'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Bell, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Profile } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/procesos': 'Procesos de Licitación',
  '/adjudicados': 'Procesos Adjudicados',
  '/estadisticas': 'Estadísticas',
  '/usuarios': 'Gestión de Usuarios',
}

interface TopbarProps {
  userProfile: Profile | null
}

export function Topbar({ userProfile }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const title = PAGE_TITLES[pathname] ?? 'MELAN Services'

  const showNewButton = pathname === '/procesos'

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {showNewButton && (
          <Button
            onClick={() => {
              // Dispatch evento para abrir modal de nuevo proceso
              window.dispatchEvent(new CustomEvent('open-nuevo-proceso'))
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white gap-2 hidden sm:flex"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proceso
          </Button>
        )}

        <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-white text-sm font-bold">
            {userProfile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-800 leading-tight">
              {userProfile?.full_name ?? 'Usuario'}
            </p>
            <p className="text-xs text-gray-500 leading-tight capitalize">{userProfile?.role}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
