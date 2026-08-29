-- ============================================================
-- MELAN · MIGRACIÓN DE MÓDULOS NUEVOS
--   1. Ingresos y Gastos      (categorias_gasto, gastos, ventas)
--   2. Perfil Documental      (perfil_documentos, documento_archivos + bucket 'documentos')
--   3. Homologación           (homologacion_estados, _plataformas, _credenciales)
--   4. Permiso ver_credenciales en profiles
--
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query → Run
-- Idempotente: se puede correr varias veces sin romper nada.
-- ============================================================

-- ============================================================
-- FUNCIÓN AUXILIAR: rol del usuario actual
-- El esquema actual de Melan resuelve el rol con subconsultas
-- EXISTS(...) dentro de cada política. Los módulos nuevos usan
-- esta función, que además evita la recursión de RLS al leer
-- profiles con SECURITY DEFINER. Crearla no altera las políticas
-- que ya existen.
-- ============================================================
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;



-- ############################################################
-- 1. INGRESOS Y GASTOS
-- (origen: supabase/finanzas.sql)
-- ############################################################

-- ============================================================
-- MELAN - Módulo "Ingresos y Gastos"
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Se puede ejecutar varias veces sin romper nada (idempotente)
-- ============================================================

-- ============================================================
-- TABLA: categorias_gasto
-- Alimenta la lista desplegable de "Gastos Operativos".
-- El usuario puede agregar nuevas desde el formulario.
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categorias_gasto (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre      TEXT NOT NULL UNIQUE,
  activo      BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Categorías iniciales (las del Excel)
INSERT INTO public.categorias_gasto (nombre)
VALUES ('Estampillas'), ('Pólizas'), ('RUP')
ON CONFLICT (nombre) DO NOTHING;

-- ============================================================
-- TABLA: gastos
-- Formulario 1 del Excel: Proveedor / Gasto Operativo / Valor / IVA / Total
-- ============================================================
CREATE TABLE IF NOT EXISTS public.gastos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  proveedor     TEXT NOT NULL,
  categoria     TEXT NOT NULL,                       -- Gasto Operativo (lista desplegable)
  descripcion   TEXT,
  valor         NUMERIC(18, 2) NOT NULL DEFAULT 0,   -- base gravable
  iva_pct       NUMERIC(5, 2)  NOT NULL DEFAULT 19,  -- % de IVA aplicado
  iva           NUMERIC(18, 2) NOT NULL DEFAULT 0,   -- valor del IVA
  total         NUMERIC(18, 2) GENERATED ALWAYS AS (valor + iva) STORED,

  proceso_id    UUID REFERENCES public.procesos(id) ON DELETE SET NULL,
  observaciones TEXT,

  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: ventas
-- Formulario 2 del Excel: Cliente / Descripción de la venta / Valor / IVA / Total
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ventas (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  cliente       TEXT NOT NULL,
  descripcion   TEXT NOT NULL,                       -- Descripción de la venta
  numero_factura TEXT,
  valor         NUMERIC(18, 2) NOT NULL DEFAULT 0,
  iva_pct       NUMERIC(5, 2)  NOT NULL DEFAULT 19,
  iva           NUMERIC(18, 2) NOT NULL DEFAULT 0,
  total         NUMERIC(18, 2) GENERATED ALWAYS AS (valor + iva) STORED,

  proceso_id    UUID REFERENCES public.procesos(id) ON DELETE SET NULL,
  observaciones TEXT,

  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_gastos_fecha      ON public.gastos (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_gastos_proveedor  ON public.gastos (proveedor);
CREATE INDEX IF NOT EXISTS idx_gastos_categoria  ON public.gastos (categoria);
CREATE INDEX IF NOT EXISTS idx_gastos_proceso    ON public.gastos (proceso_id);

CREATE INDEX IF NOT EXISTS idx_ventas_fecha      ON public.ventas (fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente    ON public.ventas (cliente);
CREATE INDEX IF NOT EXISTS idx_ventas_proceso    ON public.ventas (proceso_id);

-- ============================================================
-- TRIGGERS updated_at (reutiliza la función del schema principal)
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at_gastos ON public.gastos;
CREATE TRIGGER set_updated_at_gastos
  BEFORE UPDATE ON public.gastos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_ventas ON public.ventas;
CREATE TRIGGER set_updated_at_ventas
  BEFORE UPDATE ON public.ventas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Mismo criterio que "procesos":
--   - todos los autenticados pueden LEER
--   - admin y editor pueden CREAR / EDITAR
--   - solo admin puede ELIMINAR
-- ============================================================
ALTER TABLE public.gastos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias_gasto  ENABLE ROW LEVEL SECURITY;

-- ---- GASTOS ----
DROP POLICY IF EXISTS "gastos_select_authenticated" ON public.gastos;
CREATE POLICY "gastos_select_authenticated"
  ON public.gastos FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "gastos_insert_editor" ON public.gastos;
CREATE POLICY "gastos_insert_editor"
  ON public.gastos FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "gastos_update_editor" ON public.gastos;
CREATE POLICY "gastos_update_editor"
  ON public.gastos FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "gastos_delete_admin" ON public.gastos;
CREATE POLICY "gastos_delete_admin"
  ON public.gastos FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- ---- VENTAS ----
DROP POLICY IF EXISTS "ventas_select_authenticated" ON public.ventas;
CREATE POLICY "ventas_select_authenticated"
  ON public.ventas FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "ventas_insert_editor" ON public.ventas;
CREATE POLICY "ventas_insert_editor"
  ON public.ventas FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "ventas_update_editor" ON public.ventas;
CREATE POLICY "ventas_update_editor"
  ON public.ventas FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "ventas_delete_admin" ON public.ventas;
CREATE POLICY "ventas_delete_admin"
  ON public.ventas FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- ---- CATEGORIAS_GASTO ----
DROP POLICY IF EXISTS "categorias_select_authenticated" ON public.categorias_gasto;
CREATE POLICY "categorias_select_authenticated"
  ON public.categorias_gasto FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "categorias_insert_editor" ON public.categorias_gasto;
CREATE POLICY "categorias_insert_editor"
  ON public.categorias_gasto FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "categorias_update_admin" ON public.categorias_gasto;
CREATE POLICY "categorias_update_admin"
  ON public.categorias_gasto FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "categorias_delete_admin" ON public.categorias_gasto;
CREATE POLICY "categorias_delete_admin"
  ON public.categorias_gasto FOR DELETE TO authenticated
  USING (public.current_user_role() = 'admin');

-- ============================================================
-- LISTO
-- Verifica en Table Editor que aparezcan: gastos, ventas, categorias_gasto
-- ============================================================


-- ############################################################
-- 2. PERFIL DOCUMENTAL + HOMOLOGACIÓN
-- (origen: supabase/migracion_perfil_homologacion.sql)
-- ############################################################

-- ============================================================
-- MIGRACIÓN: Perfil Documental + Homologación de Plataformas
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Idempotente: se puede correr varias veces sin problema.
-- ============================================================

-- ============================================================
-- PERFIL DOCUMENTAL
-- ============================================================
CREATE TABLE IF NOT EXISTS public.perfil_documentos (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documento         TEXT NOT NULL UNIQUE,
  aplica            BOOLEAN NOT NULL DEFAULT TRUE,
  no_aplica         BOOLEAN NOT NULL DEFAULT FALSE,
  lo_tiene          BOOLEAN NOT NULL DEFAULT FALSE,
  no_lo_tiene       BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_documento   DATE,
  fecha_vencimiento DATE,
  archivo_path      TEXT,
  archivo_nombre    TEXT,
  orden             INTEGER NOT NULL DEFAULT 0,
  created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Historial de archivos cargados por documento
CREATE TABLE IF NOT EXISTS public.documento_archivos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  documento_id  UUID NOT NULL REFERENCES public.perfil_documentos(id) ON DELETE CASCADE,
  storage_path  TEXT NOT NULL,
  nombre        TEXT,
  uploaded_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_perfil_documentos ON public.perfil_documentos;
CREATE TRIGGER set_updated_at_perfil_documentos
  BEFORE UPDATE ON public.perfil_documentos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.perfil_documentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documento_archivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pdoc_select_auth" ON public.perfil_documentos;
CREATE POLICY "pdoc_select_auth" ON public.perfil_documentos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "pdoc_write_editor" ON public.perfil_documentos;
CREATE POLICY "pdoc_write_editor" ON public.perfil_documentos FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "darch_select_auth" ON public.documento_archivos;
CREATE POLICY "darch_select_auth" ON public.documento_archivos FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "darch_write_editor" ON public.documento_archivos;
CREATE POLICY "darch_write_editor" ON public.documento_archivos FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

-- Documentos iniciales (del Excel)
INSERT INTO public.perfil_documentos (documento, aplica, no_aplica, lo_tiene, no_lo_tiene, orden) VALUES
  ('RUP', TRUE, FALSE, TRUE, FALSE, 1),
  ('Resolución de Transporte', TRUE, FALSE, FALSE, TRUE, 2),
  ('Revisor Fiscal', TRUE, FALSE, FALSE, TRUE, 3),
  ('Contador', TRUE, FALSE, FALSE, TRUE, 4)
ON CONFLICT (documento) DO NOTHING;

-- ============================================================
-- STORAGE: bucket privado 'documentos'
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "docs_read"   ON storage.objects;
CREATE POLICY "docs_read"   ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documentos');
DROP POLICY IF EXISTS "docs_insert" ON storage.objects;
CREATE POLICY "docs_insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documentos' AND public.current_user_role() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "docs_update" ON storage.objects;
CREATE POLICY "docs_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documentos' AND public.current_user_role() IN ('admin', 'editor'));
DROP POLICY IF EXISTS "docs_delete" ON storage.objects;
CREATE POLICY "docs_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documentos' AND public.current_user_role() = 'admin');

-- ============================================================
-- HOMOLOGACIÓN DE PLATAFORMAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.homologacion_estados (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre     TEXT NOT NULL UNIQUE,
  orden      INTEGER NOT NULL DEFAULT 0,
  activo     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homologacion_plataformas (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plataforma TEXT NOT NULL UNIQUE,
  acceso     TEXT,
  estado     TEXT,
  orden      INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_updated_at_homolog_plat ON public.homologacion_plataformas;
CREATE TRIGGER set_updated_at_homolog_plat
  BEFORE UPDATE ON public.homologacion_plataformas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.homologacion_estados     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homologacion_plataformas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hest_select_auth" ON public.homologacion_estados;
CREATE POLICY "hest_select_auth" ON public.homologacion_estados FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "hest_write_editor" ON public.homologacion_estados;
CREATE POLICY "hest_write_editor" ON public.homologacion_estados FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

DROP POLICY IF EXISTS "hplat_select_auth" ON public.homologacion_plataformas;
CREATE POLICY "hplat_select_auth" ON public.homologacion_plataformas FOR SELECT
  TO authenticated USING (true);
DROP POLICY IF EXISTS "hplat_write_editor" ON public.homologacion_plataformas;
CREATE POLICY "hplat_write_editor" ON public.homologacion_plataformas FOR ALL
  TO authenticated
  USING (public.current_user_role() IN ('admin', 'editor'))
  WITH CHECK (public.current_user_role() IN ('admin', 'editor'));

-- Estados iniciales
INSERT INTO public.homologacion_estados (nombre, orden) VALUES
  ('Existente', 1), ('Inexistente', 2), ('En proceso', 3), ('Pendiente', 4)
ON CONFLICT (nombre) DO NOTHING;

-- Plataformas iniciales (del Excel)
INSERT INTO public.homologacion_plataformas (plataforma, acceso, estado, orden) VALUES
  ('BIONEXO', 'https://co.bionexo.com/soluciones/para-proveedores/', 'Existente', 1),
  ('SUPLUS', 'Suplos - Proveedores', 'En proceso', 2),
  ('GRUPO EPM', 'https://service.ariba.com/Sourcing.aw/109521003/aw?awh=r&awssk=UrPXMEn2&dard=1&ancdc=1', 'Existente', 3),
  ('COMPRAS MENORES EPM', 'https://portalesepm.epm.com.co/TeCuento/default.aspx', 'Existente', 4),
  ('TRIPLE AAA BARRANQUILLA', 'https://www.aaa.com.co/compras-abiertas/', 'Existente', 5),
  ('CAMARA DE COMERCIO DE BOGOTÁ', 'https://portaldecontratacion.ccb.org.co/?redir=/negociaciones/ver/9604', 'Existente', 6),
  ('ACUEDUCTO DE BOGOTÁ', 'Portal de Contratación y Compras Acueducto de Bogotá', 'Pendiente', 7),
  ('INSTITUTO NACIONAL DE CANCEROLOGÍA', 'Login (cancer.gov.co)', 'Existente', 8),
  ('COMPENSAR', 'https://compensar.comforce.co/', 'Existente', 9),
  ('MI MERCADO POPULAR', 'https://mimercadopopular.gov.co/proveedores/private/iad', 'Existente', 10),
  ('ETENDERBOX ACNUR', 'https://etenderbox.unhcr.org', 'Existente', 11),
  ('UNGM.ORG 1077052', 'https://www.ungm.org', 'Existente', 12),
  ('INDUMIL', 'https://www.indumil.gov.co/INDUMIL.RegistroProveedores/', 'Existente', 13),
  ('BOLSA MERCANTIL', 'https://www.bolsamercantil.com.co/', 'Pendiente', 14),
  ('ENERGIA DE PEREIRA', 'https://energiapereira.eep.com.co/EEP_PROVEEDORES/registro.php', 'Existente', 15),
  ('ECOPETROL', 'https://s3.ariba.com/Sourcing/Main/aw?awh=r&awssk=8RZbY8R7wv84vVFq&realm=ecopetrol&dard=1', 'Existente', 16),
  ('SECOP II', 'https://community.secop.gov.co/STS/Users/Login/Index?SkinName=CCE', 'Existente', 17),
  ('AGUAS KAPITAL CÚCUTA', 'https://www.akc.com.co/contratosweb/contratos/session.php', 'Existente', 18),
  ('COMFAMILIAR BARRANQUILLA', NULL, 'Existente', 19),
  ('WHEREX', NULL, 'Existente', 20),
  ('UNIVERSIDAD LIBRE', NULL, 'Existente', 21)
ON CONFLICT (plataforma) DO NOTHING;

-- Refrescar el cache de la API
NOTIFY pgrst, 'reload schema';


-- ############################################################
-- 3. PERFIL DOCUMENTAL — columnas No Aplica / No lo tiene
-- (origen: supabase/migracion_documentos_v2.sql)
-- ############################################################

-- ============================================================
-- MIGRACIÓN v2: Perfil Documental — columnas No Aplica / No lo tiene
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Idempotente.
-- ============================================================

ALTER TABLE public.perfil_documentos ADD COLUMN IF NOT EXISTS no_aplica   BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.perfil_documentos ADD COLUMN IF NOT EXISTS no_lo_tiene BOOLEAN NOT NULL DEFAULT FALSE;

-- Inicializa las filas existentes como el inverso de aplica / lo_tiene
-- (solo las que aún están en el valor por defecto, para no pisar cambios manuales)
UPDATE public.perfil_documentos
   SET no_aplica = NOT aplica
 WHERE no_aplica = FALSE AND aplica = FALSE;

UPDATE public.perfil_documentos
   SET no_lo_tiene = NOT lo_tiene
 WHERE no_lo_tiene = FALSE AND lo_tiene = FALSE;

NOTIFY pgrst, 'reload schema';


-- ############################################################
-- 4. CREDENCIALES DE PLATAFORMAS + PERMISO POR USUARIO
-- (origen: supabase/migracion_credenciales.sql)
-- ############################################################

-- ============================================================
-- MIGRACIÓN: Credenciales de plataformas (usuario/contraseña)
-- con permiso por usuario controlado por el administrador.
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query. Idempotente.
-- ============================================================

-- 1) Permiso por usuario para ver las credenciales
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ver_credenciales BOOLEAN NOT NULL DEFAULT FALSE;

-- 2) ¿El usuario actual puede ver credenciales? (admin siempre; o con permiso)
CREATE OR REPLACE FUNCTION public.puede_ver_credenciales()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(bool_or(role = 'admin' OR ver_credenciales), FALSE)
  FROM public.profiles WHERE id = auth.uid();
$$;

-- 3) Tabla de credenciales, separada y protegida a nivel de base de datos
CREATE TABLE IF NOT EXISTS public.homologacion_credenciales (
  plataforma_id UUID PRIMARY KEY REFERENCES public.homologacion_plataformas(id) ON DELETE CASCADE,
  usuario       TEXT,
  contrasena    TEXT,
  updated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.homologacion_credenciales ENABLE ROW LEVEL SECURITY;

-- Solo quien tiene permiso puede LEER las credenciales
DROP POLICY IF EXISTS "hcred_select" ON public.homologacion_credenciales;
CREATE POLICY "hcred_select" ON public.homologacion_credenciales FOR SELECT
  TO authenticated USING (public.puede_ver_credenciales());

-- Solo admin/editor CON permiso pueden crearlas/editarlas
DROP POLICY IF EXISTS "hcred_write" ON public.homologacion_credenciales;
CREATE POLICY "hcred_write" ON public.homologacion_credenciales FOR ALL
  TO authenticated
  USING (public.puede_ver_credenciales() AND public.current_user_role() IN ('admin', 'editor'))
  WITH CHECK (public.puede_ver_credenciales() AND public.current_user_role() IN ('admin', 'editor'));

NOTIFY pgrst, 'reload schema';
