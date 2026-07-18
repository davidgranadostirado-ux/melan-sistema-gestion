-- =============================================================
-- Migración: agregar sector 'Comercial'
-- Fecha: 2026-07-17
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================================

-- 1. Eliminar la restricción CHECK actual del campo sector
ALTER TABLE public.procesos
  DROP CONSTRAINT IF EXISTS procesos_sector_check;

-- 2. Crear la nueva restricción incluyendo 'Comercial'
ALTER TABLE public.procesos
  ADD CONSTRAINT procesos_sector_check
  CHECK (sector IN ('Público', 'Privado', 'Comercial'));

-- 3. Verificación (debe devolver la restricción nueva)
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.procesos'::regclass
  AND conname = 'procesos_sector_check';
