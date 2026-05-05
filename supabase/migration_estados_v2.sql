-- ============================================================
-- MIGRACIÓN: Agregar nuevos estados de proceso
-- ============================================================
-- Estados nuevos: 'Estudio de Mercado', 'A Presentar'
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Eliminar la constraint antigua
ALTER TABLE public.procesos DROP CONSTRAINT IF EXISTS procesos_estado_proceso_check;

-- 2. Crear la nueva constraint con todos los estados
ALTER TABLE public.procesos
  ADD CONSTRAINT procesos_estado_proceso_check
  CHECK (estado_proceso IN (
    'En Evaluación',
    'Adjudicado',
    'Cancelado',
    'Desierto',
    'Borrador',
    'Pendiente',
    'Estudio de Mercado',
    'A Presentar'
  ));

-- 3. Verificar que la columna participa también está bien
ALTER TABLE public.procesos DROP CONSTRAINT IF EXISTS procesos_participa_check;
ALTER TABLE public.procesos
  ADD CONSTRAINT procesos_participa_check
  CHECK (participa IN ('SI', 'NO'));

-- ✅ Ahora la app soporta los nuevos estados
