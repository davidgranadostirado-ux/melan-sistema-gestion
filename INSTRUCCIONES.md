# MELAN Services — Sistema de Gestión de Licitaciones
## Guía de instalación y configuración

---

## PASO 1 — Instalar dependencias

```bash
cd melan-crm
npm install
```

---

## PASO 2 — Configurar Supabase

### 2.1 Crear proyecto en Supabase
1. Ve a https://app.supabase.com y crea una cuenta (gratis)
2. Crea un **nuevo proyecto** (nombre: `melan-services`)
3. Anota la contraseña de la base de datos

### 2.2 Ejecutar el schema SQL
1. En tu proyecto de Supabase, ve a **SQL Editor → New Query**
2. Copia y pega todo el contenido de `supabase/schema.sql`
3. Haz clic en **Run** (o Ctrl+Enter)

### 2.3 Obtener las claves API
1. Ve a **Settings → API**
2. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## PASO 3 — Configurar variables de entorno

Crea el archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## PASO 4 — Crear usuario administrador

1. En Supabase, ve a **Authentication → Users → Add user**
2. Crea un usuario con email y contraseña
3. Ve a **SQL Editor** y ejecuta:

```sql
UPDATE public.profiles
SET role = 'admin', full_name = 'Tu Nombre Completo'
WHERE email = 'tu-email@ejemplo.com';
```

---

## PASO 5 — Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre http://localhost:3000 en tu navegador.

---

## Estructura del proyecto

```
src/
├── app/
│   ├── login/              → Página de inicio de sesión
│   └── (dashboard)/
│       ├── dashboard/      → Dashboard con métricas y gráficos
│       ├── procesos/       → Tabla completa de procesos
│       ├── adjudicados/    → Procesos adjudicados
│       ├── estadisticas/   → Estadísticas históricas
│       └── usuarios/       → Gestión de usuarios (solo admin)
├── components/
│   ├── layout/             → Sidebar y Topbar
│   ├── ui/                 → Componentes base (shadcn/ui)
│   ├── dashboard/          → Tarjetas y gráficos del dashboard
│   ├── procesos/           → Tabla, formulario y detalle de procesos
│   ├── adjudicados/        → Vista de adjudicados
│   ├── estadisticas/       → Gráficos de estadísticas
│   ├── usuarios/           → Gestión de usuarios
│   └── shared/             → Badges y componentes compartidos
├── lib/
│   ├── supabase/
│   │   ├── client.ts       → Cliente Supabase (browser)
│   │   └── server.ts       → Cliente Supabase (server)
│   └── utils.ts            → Utilidades (formato moneda, fechas, CSV)
└── types/index.ts          → Tipos TypeScript
```

---

## Roles de usuario

| Rol | Permisos |
|-----|----------|
| `admin` | Acceso total: ver, crear, editar, eliminar procesos y gestionar usuarios |
| `editor` | Crear y editar procesos, pero no eliminar ni gestionar usuarios |
| `viewer` | Solo lectura — puede ver todos los procesos |

---

## Despliegue en producción (Vercel)

```bash
# 1. Push a GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/melan-services.git
git push -u origin main

# 2. Importar en Vercel
# Ve a https://vercel.com → Import Project → GitHub
# Agrega las variables de entorno en Vercel:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## Funcionalidades incluidas

- ✅ Autenticación con Supabase (email/contraseña)
- ✅ Protección de rutas con middleware
- ✅ Dashboard con 4 métricas y 4 gráficos (Recharts)
- ✅ Tabla de procesos con filtros y paginación
- ✅ Formulario completo (27 campos) en modal
- ✅ Vista detalle de proceso en modal
- ✅ Exportación a CSV
- ✅ Módulo de adjudicados
- ✅ Estadísticas con gráficos históricos
- ✅ Gestión de usuarios (solo admin)
- ✅ Notificaciones toast
- ✅ Diseño responsive (móvil + desktop)
- ✅ Row Level Security (RLS) en Supabase
- ✅ Badges de colores por estado
- ✅ Formato de moneda colombiana (COP)
