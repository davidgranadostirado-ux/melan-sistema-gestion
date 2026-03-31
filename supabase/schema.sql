-- ============================================================
-- MELAN Services - Sistema de Gestión de Licitaciones
-- Schema SQL para Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- Extiende auth.users con información adicional del usuario
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT NOT NULL DEFAULT '',
  role        TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'editor', 'viewer')),
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: procesos
-- Registros de procesos de licitación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.procesos (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Clasificación
  sector                    TEXT NOT NULL CHECK (sector IN ('Público', 'Privado')),
  fuente                    TEXT NOT NULL CHECK (fuente IN ('Secop II', 'Secop I', 'Privado', 'Otro')),

  -- Publicación
  año_publicacion           INTEGER,
  fecha_publicacion         DATE NOT NULL,
  mes_publicacion           TEXT,
  fecha_presentacion        DATE,

  -- Entidad
  entidad                   TEXT NOT NULL,
  estado_proceso            TEXT NOT NULL DEFAULT 'Pendiente'
                              CHECK (estado_proceso IN ('En Evaluación', 'Adjudicado', 'Cancelado', 'Desierto', 'Borrador', 'Pendiente')),

  -- Localización
  departamento_ejecucion    TEXT,
  municipio_ejecucion       TEXT,

  -- Proceso
  cuantia_proceso           NUMERIC(18, 2) NOT NULL DEFAULT 0,
  objeto_proceso            TEXT NOT NULL,
  tipo_proceso              TEXT,
  numero_proceso            TEXT,
  correo_entrega            TEXT,
  contacto_proceso          TEXT,

  -- Ejecución
  fecha_inicio              DATE,
  fecha_terminacion         DATE,
  duracion_dias             INTEGER,

  -- Adjudicación
  proponente_ganador        TEXT,
  valor_ofertado_ganador    NUMERIC(18, 2),
  valor_ofertado_sumicorp   NUMERIC(18, 2),
  sumicorp_cumple           TEXT DEFAULT 'PENDIENTE'
                              CHECK (sumicorp_cumple IN ('SI', 'NO', 'PENDIENTE')),

  -- Gestión
  gestion_realizar          TEXT,
  participa                 TEXT DEFAULT 'SI' CHECK (participa IN ('SI', 'NO')),
  observaciones             TEXT,

  -- Auditoría
  created_by                UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES para mejorar rendimiento en búsquedas frecuentes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_procesos_estado     ON public.procesos (estado_proceso);
CREATE INDEX IF NOT EXISTS idx_procesos_año        ON public.procesos (año_publicacion);
CREATE INDEX IF NOT EXISTS idx_procesos_entidad    ON public.procesos (entidad);
CREATE INDEX IF NOT EXISTS idx_procesos_sector     ON public.procesos (sector);
CREATE INDEX IF NOT EXISTS idx_procesos_fuente     ON public.procesos (fuente);
CREATE INDEX IF NOT EXISTS idx_procesos_created_at ON public.procesos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_procesos_created_by ON public.procesos (created_by);

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_procesos ON public.procesos;
CREATE TRIGGER set_updated_at_procesos
  BEFORE UPDATE ON public.procesos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- FUNCIÓN: crear perfil automáticamente al registrar usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'viewer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procesos  ENABLE ROW LEVEL SECURITY;

-- ---- POLICIES: profiles ----

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Los admins pueden ver todos los perfiles
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Los admins pueden actualizar cualquier perfil
CREATE POLICY "profiles_update_admin"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ---- POLICIES: procesos ----

-- Usuarios autenticados pueden leer todos los procesos
CREATE POLICY "procesos_select_authenticated"
  ON public.procesos FOR SELECT
  TO authenticated
  USING (true);

-- Admins y editors pueden insertar procesos
CREATE POLICY "procesos_insert_editor"
  ON public.procesos FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Admins y editors pueden actualizar procesos
CREATE POLICY "procesos_update_editor"
  ON public.procesos FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Solo admins pueden eliminar procesos
CREATE POLICY "procesos_delete_admin"
  ON public.procesos FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- DATOS DE EJEMPLO (opcional — comentar si no se necesitan)
-- ============================================================

-- Insertar usuario admin inicial (debes crear el usuario en
-- Supabase Auth primero, luego actualizar su rol aquí)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@melan.com';

-- Proceso de ejemplo
INSERT INTO public.procesos (
  sector, fuente, fecha_publicacion, mes_publicacion, año_publicacion,
  entidad, estado_proceso, departamento_ejecucion, municipio_ejecucion,
  cuantia_proceso, objeto_proceso, tipo_proceso, numero_proceso,
  participa, sumicorp_cumple
) VALUES
(
  'Público', 'Secop II', '2025-01-15', 'Enero', 2025,
  'Alcaldía Municipal de Bogotá D.C.',
  'En Evaluación', 'Bogotá D.C.', 'Bogotá D.C.',
  850000000, 'Suministro de materiales de construcción para obras de infraestructura vial',
  'Licitación Pública', 'ALB-LP-001-2025',
  'SI', 'PENDIENTE'
),
(
  'Público', 'Secop II', '2025-02-10', 'Febrero', 2025,
  'Gobernación de Antioquia',
  'Adjudicado', 'Antioquia', 'Medellín',
  1250000000, 'Prestación de servicios de consultoría para diseño y supervisión de obras',
  'Concurso de Méritos', 'GAN-CM-005-2025',
  'SI', 'SI'
),
(
  'Privado', 'Privado', '2025-03-05', 'Marzo', 2025,
  'Empresa de Servicios Públicos del Norte',
  'Pendiente', 'Atlántico', 'Barranquilla',
  420000000, 'Mantenimiento preventivo y correctivo de redes de distribución eléctrica',
  'Contratación Directa', 'ESP-CD-012-2025',
  'SI', 'PENDIENTE'
),
(
  'Público', 'Secop I', '2024-11-20', 'Noviembre', 2024,
  'Ministerio de Educación Nacional',
  'Cancelado', 'Cundinamarca', 'Bogotá D.C.',
  3200000000, 'Dotación de laboratorios de tecnología para instituciones educativas públicas',
  'Licitación Pública', 'MEN-LP-089-2024',
  'NO', 'NO'
),
(
  'Público', 'Secop II', '2024-09-15', 'Septiembre', 2024,
  'Instituto Nacional de Vías - INVIAS',
  'Adjudicado', 'Valle del Cauca', 'Cali',
  5800000000, 'Construcción y mejoramiento de vías secundarias en el departamento del Valle',
  'Licitación Pública', 'INV-LP-234-2024',
  'SI', 'SI'
);

-- ============================================================
-- VISTA: resumen_dashboard (útil para métricas rápidas)
-- ============================================================
CREATE OR REPLACE VIEW public.v_dashboard_metrics AS
SELECT
  COUNT(*)                                                        AS total_procesos,
  COUNT(*) FILTER (WHERE estado_proceso = 'Adjudicado')          AS adjudicados,
  COUNT(*) FILTER (WHERE estado_proceso = 'En Evaluación')       AS en_evaluacion,
  COUNT(*) FILTER (WHERE estado_proceso = 'Cancelado')           AS cancelados,
  COUNT(*) FILTER (WHERE estado_proceso = 'Desierto')            AS desiertos,
  COUNT(*) FILTER (WHERE estado_proceso = 'Pendiente')           AS pendientes,
  COALESCE(SUM(cuantia_proceso), 0)                              AS cuantia_total,
  COALESCE(SUM(valor_ofertado_sumicorp), 0)                      AS valor_sumicorp_total,
  ROUND(
    CASE WHEN COUNT(*) > 0
      THEN COUNT(*) FILTER (WHERE estado_proceso = 'Adjudicado') * 100.0 / COUNT(*)
      ELSE 0
    END, 2
  )                                                              AS tasa_adjudicacion
FROM public.procesos;
