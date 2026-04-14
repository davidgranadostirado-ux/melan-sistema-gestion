'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

/**
 * SessionGuard: cierra la sesión automáticamente cuando el usuario
 * abre el CRM en una ventana nueva (después de haber cerrado el navegador).
 *
 * Funciona con sessionStorage:
 *  - sessionStorage se mantiene durante la misma pestaña/sesión (incluso al refrescar)
 *  - sessionStorage se borra al cerrar el navegador o la pestaña
 *
 * Si el usuario regresa sin la marca en sessionStorage, se hace signOut.
 */
export function SessionGuard() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const SESSION_KEY = 'melan_session_active'

    // ¿Viene de una sesión activa en esta pestaña?
    const isActive = sessionStorage.getItem(SESSION_KEY)

    if (!isActive) {
      // El usuario abrió el navegador de nuevo (sessionStorage vacío).
      // Cerramos la sesión del servidor para que tenga que volver a iniciar sesión.
      supabase.auth.signOut().then(() => {
        router.push('/login')
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
