'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Lock, Mail } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast({
        title: 'Error de autenticación',
        description: error.message === 'Invalid login credentials'
          ? 'Correo o contraseña incorrectos'
          : error.message,
        variant: 'destructive',
      })
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-600 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-700 rounded-full opacity-10 blur-3xl" />
      </div>

      {/* Card de login */}
      <div className="relative z-10 w-full max-w-md mx-4">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-8 py-10 text-center">
            <div className="flex items-center justify-center mb-6">
              <svg width="170" height="52" viewBox="0 0 170 52" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Melan Services">
                {/* Icon */}
                <polygon points="20,2 36,11 36,29 20,38 4,29 4,11" fill="#1e3a6e"/>
                <polygon points="20,7 31,13 31,27 20,33 9,27 9,13" fill="#2a5298"/>
                <text x="13" y="26" fontFamily="Arial Black,sans-serif" fontSize="14" fontWeight="900" fill="white">M</text>
                <polygon points="4,11 0,16 4,21" fill="#e8612a" opacity="0.9"/>
                <polygon points="4,21 0,26 4,29" fill="#e8612a" opacity="0.7"/>
                {/* MELAN */}
                <text fontFamily="Arial Black,sans-serif" fontSize="22" fontWeight="900" y="28" letterSpacing="1">
                  <tspan x="44" fill="#1e3a6e">M</tspan>
                  <tspan fill="#c8d6e8">E</tspan>
                  <tspan fill="#1e3a6e">L</tspan>
                  <tspan fill="#c8d6e8">AN</tspan>
                </text>
                {/* SERVICES */}
                <text x="44" y="44" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="700" letterSpacing="3.5" fill="#c8d6e8">SERVICES</text>
              </svg>
            </div>
            <p className="text-blue-100 text-sm mt-1">Sistema de Gestión de Licitaciones</p>
          </div>

          {/* Formulario */}
          <div className="px-8 py-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-1">Iniciar sesión</h2>
            <p className="text-sm text-gray-500 mb-6">Ingresa tus credenciales para acceder</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">
                  Correo electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@melan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">
                  Contraseña
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  'Ingresar al sistema'
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} MELAN Services · Todos los derechos reservados
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
