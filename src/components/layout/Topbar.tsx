'use client'

import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Plus, Users, LogOut, ChevronDown, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from './ThemeToggle'
import { NotificationsBell } from './NotificationsBell'
import type { Notificacion } from '@/lib/notificaciones'
import type { Profile } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/procesos': 'Procesos de Licitación',
  '/adjudicados': 'Procesos Adjudicados',
  '/comparativo': 'Participados vs Adjudicados',
  '/estadisticas': 'Estadísticas',
  '/finanzas': 'Ingresos y Gastos',
  '/perfil-documental': 'Perfil Documental',
  '/homologacion': 'Homologación de Plataformas',
  '/usuarios': 'Gestión de Usuarios',
}

interface TopbarProps {
  userProfile: Profile | null
  notificaciones: Notificacion[]
}

export function Topbar({ userProfile, notificaciones }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const title = PAGE_TITLES[pathname] ?? 'MELAN Services'

  const showNewButton = pathname === '/procesos'
  const esAdmin = userProfile?.role === 'admin'
  const inicial = (userProfile?.full_name || userProfile?.email)?.charAt(0)?.toUpperCase() ?? 'U'

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0 dark:bg-gray-800 dark:border-gray-700">
      <div className="pl-12 lg:pl-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {new Date().toLocaleDateString('es-CO', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {showNewButton && (
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent('open-nuevo-proceso'))}
            className="bg-brand hover:bg-brand-soft text-navy-deep font-semibold gap-2 hidden sm:flex"
          >
            <Plus className="h-4 w-4" />
            Nuevo Proceso
          </Button>
        )}

        <ThemeToggle />

        <NotificationsBell notificaciones={notificaciones} />

        {/* Menú de usuario */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 pl-2 ml-1 border-l border-gray-200 dark:border-gray-700 rounded-r-lg py-1 pr-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
              <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {inicial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 leading-tight">
                  {userProfile?.full_name || userProfile?.email || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight capitalize">
                  {userProfile?.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-64">
            <div className="flex items-center gap-3 px-2.5 py-2.5">
              <div className="w-10 h-10 bg-navy rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                {inicial}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {userProfile?.full_name || 'Usuario'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {userProfile?.email}
                </p>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-brand text-navy-deep mt-1 capitalize">
                  {userProfile?.role}
                </span>
              </div>
            </div>

            <DropdownMenuSeparator />

            {esAdmin && (
              <DropdownMenuItem asChild>
                <Link href="/usuarios">
                  <Users className="h-4 w-4" />
                  Gestión de Usuarios
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link href="/dashboard">
                <UserCircle className="h-4 w-4" />
                Mi panel
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-600 focus:bg-red-50 focus:text-red-700 dark:text-red-400 dark:focus:bg-red-500/10 dark:focus:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
