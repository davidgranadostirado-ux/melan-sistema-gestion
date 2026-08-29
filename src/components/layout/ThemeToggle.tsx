'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

type Theme = 'light' | 'dark'

/** Aplica el tema al <html> y lo guarda en el navegador */
function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  try {
    localStorage.setItem('melan-theme', theme)
  } catch {
    // navegador sin acceso a localStorage
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    // El script de <head> ya aplicó la clase; aquí solo sincronizamos el estado
    const actual: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light'
    setTheme(actual)
    setMontado(true)
  }, [])

  const toggle = () => {
    const nuevo: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nuevo)
    applyTheme(nuevo)
  }

  const esOscuro = theme === 'dark'

  return (
    <button
      onClick={toggle}
      title={esOscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      aria-label={esOscuro ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
      className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-700"
    >
      {/* Evita el parpadeo de icono equivocado antes de montar */}
      {montado ? (
        esOscuro ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5 opacity-0" />
      )}
    </button>
  )
}
