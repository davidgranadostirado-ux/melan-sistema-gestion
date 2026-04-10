/**
 * Script de importación: INFORME MELAN 2026.xlsx → Supabase
 *
 * Uso: node import-2026.mjs
 * (Ejecutar desde la carpeta melan-crm)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Leer credenciales desde .env.local
const envContent = readFileSync('.env.local', 'utf-8');
const getEnvVar = (name) => {
  const match = envContent.match(new RegExp(`^${name}=(.+)$`, 'm'));
  return match ? match[1].trim() : null;
};

const SUPABASE_URL = getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = getEnvVar('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ No se encontraron las credenciales en .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// ─── Datos extraídos del archivo INFORME MELAN 2026.xlsx ───────────────────
const procesos = [
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-10", fecha_presentacion: "2026-01-19",
    mes_publicacion: "ENERO",
    entidad: "PATRIMONIO NATURAL FONDO PARA LA BIODIVERSIDAD Y AREAS PROTEGIDAS",
    estado_proceso: "Adjudicado", departamento_ejecucion: "BOLIVAR",
    municipio_ejecucion: "CARMEN DE BOLIVAR", cuantia_proceso: 32359300,
    objeto_proceso: "COTIZACION IKI CP 001 2026 EQUIPOS TECNOLÓGICOS",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION IKI CP 001 2026",
    correo_entrega: "adquisiciones@patrimonionatural.org.co",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 32359300, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE TECNOLOGÍA | Tiempo de ejecución: 30 DIAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-05", fecha_presentacion: "2026-01-06",
    mes_publicacion: "ENERO", entidad: "METRO LÍNEA 1 SAS",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 2320500,
    objeto_proceso: "COMODIN TOMACORRIENTE BULL REF: GN-605 100 UNIDADES",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION 12694",
    correo_entrega: "monica.c@metro1.com.co",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 2320500, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE FERRETERÍA | Tiempo de ejecución: 5 DIAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-07", fecha_presentacion: "2026-01-08",
    mes_publicacion: "ENERO", entidad: "FANTASIAS PLASTICAS DE COLOMBIA LTDA.",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 929390,
    objeto_proceso: "ARCHIVADOR METALICO 4 GAVETAS NEGRO MEDIDAS 130 X 47 X 50",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION 12695",
    correo_entrega: "compras@fantiplas.com",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 929390, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO MOBILIARIO | Tiempo de ejecución: 5 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-18", fecha_presentacion: "2026-01-20",
    mes_publicacion: "ENERO", entidad: "INGENIERIA DESAROLLO Y CONSULTORIA INDESCO SAS BIC",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 1748468,
    objeto_proceso: "SUMINISTROS DE INSUMOS DE ASEO",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION 12852",
    correo_entrega: "administracion@grupoindesco.com",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 1748468, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE ASEO | Tiempo de ejecución: 4 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-08", fecha_presentacion: "2026-01-20",
    mes_publicacion: "ENERO", entidad: "SOCIEDAD NACIONAL DE LA CRUZ ROJA COLOMBIANA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 30362612,
    objeto_proceso: "COMPRA DE MOBILIARIO PARA FORTALECIMIENTO - CRE.",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "GLI-005-2026",
    correo_entrega: "andres.roldan@cruzrojacolombiana.org",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 30362612, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO MOBILIARIO | Tiempo de ejecución: 15 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-19", fecha_presentacion: "2026-01-21",
    mes_publicacion: "ENERO", entidad: "SOCIEDAD NACIONAL DE LA CRUZ ROJA COLOMBIANA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 14296660,
    objeto_proceso: "ELEMENTOS CAMPING, ALMOHADA CAMPING COMFORT Y COLCHONETA",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "GLI-005-2026-B",
    correo_entrega: "maricela.quejada@cruzrojacolombiana.org",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 14296660, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO MOBILIARIO | Tiempo de ejecución: 15 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-23", fecha_presentacion: "2026-01-23",
    mes_publicacion: "ENERO", entidad: "METRO LÍNEA 1 SAS",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 7130480,
    objeto_proceso: "ARCHIVADOR METALICO 3 GAVETAS CON DOS LLAVES MEDIDAS 72 CM DE ALTO X 37 DE FRENTE X 50 DE FONDO",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION 12911",
    correo_entrega: "luisa.d@metro1.com.co",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 7130480, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO MOBILIARIO | Tiempo de ejecución: 5 DIAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-27", fecha_presentacion: "2026-01-28",
    mes_publicacion: "ENERO", entidad: "METRO LÍNEA 1 SAS",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 32210920,
    objeto_proceso: "COMODIN ESCRITORIO DE 120 CM X 60 CM CON PATA H COLOR NEGRO CON ARCHIVADOR DE 3 CAJONES",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "COTIZACION 12911-B",
    correo_entrega: "luisa.d@metro1.com.co",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 32210920, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO MOBILIARIO | Tiempo de ejecución: 5 DIAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-15", fecha_presentacion: "2026-01-28",
    mes_publicacion: "ENERO", entidad: "CRUZ ROJA ALEMANA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 105672000,
    objeto_proceso: "KIT HIGIENE FAMILIAR",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "Proyecto ECHO PCR 26-001",
    correo_entrega: "valentina.rodriguez@germanredcross.de",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 105672000, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE HIGIENE | Tiempo de ejecución: 15 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-02-02", fecha_presentacion: "2026-02-10",
    mes_publicacion: "FEBRERO", entidad: "CRUZ ROJA ALEMANA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 266400000,
    objeto_proceso: "KIT HIGIENE FAMILIAR",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "Proyecto ECHO PCR 26-009",
    correo_entrega: "valentina.rodriguez@germanredcross.de",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 266400000, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE HIGIENE | Tiempo de ejecución: 15 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Privado", fuente: "Privado", año_publicacion: 2026,
    fecha_publicacion: "2026-01-15", fecha_presentacion: "2026-01-28",
    mes_publicacion: "ENERO", entidad: "CRUZ ROJA ALEMANA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTÁ", cuantia_proceso: 478000000,
    objeto_proceso: "KIT MERCADO FAMILIAR",
    tipo_proceso: "REGIMEN PRIVADO", numero_proceso: "Proyecto ECHO PCR 26-010",
    correo_entrega: "valentina.rodriguez@germanredcross.de",
    proponente_ganador: "PRIVADO", valor_ofertado_ganador: 478000000, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: SUMINISTRO DE MERCADOS | Tiempo de ejecución: 15 DÍAS | Cantidad participantes: 1 | Posición: 1"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-02-27", fecha_presentacion: "2026-02-03",
    mes_publicacion: "FEBRERO",
    entidad: "DEPARTAMENTO ADMINISTRATIVO DE LA FUNCIÓN PÚBLICA",
    estado_proceso: "En Evaluación", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 0,
    objeto_proceso: "ADQUISICIÓN DE LA PAPELERÍA, UTILES DE ESCRITORIO Y OFICINA PARA EL USO DE LAS DEPENDENCIAS DE LA FUNCIÓN PÚBLICA",
    tipo_proceso: "ESTUDIO DE MERCADO", numero_proceso: "DAFP-SIP-004-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: null, valor_ofertado_ganador: null, valor_ofertado_sumicorp: null,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 5 DIAS | Cantidad participantes: 0 | Posición: 0"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-02-09", fecha_presentacion: "2026-02-18",
    mes_publicacion: "FEBRERO",
    entidad: "DIRECCION DE BIENESTAR DE LA POLICIA NACIONAL",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 18218596.55,
    objeto_proceso: "COMPRAVENTA DE ELEMENTOS DE PAPELERÍA, ÚTILES DE OFICINA Y DEMÁS INSUMOS NECESARIOS PARA EL FUNCIONAMIENTO ADMINISTRATIVO DE LOS PUNTOS DE SERVICIO DE LA DIRECCIÓN DE BIENESTAR SOCIAL Y FAMILIA VIGENCIA 2026",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "PN DIBIE MIC 015 2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "FORMARCHIVOS Y SUMINISTROS S.A.S.", valor_ofertado_ganador: 9879272.39, valor_ofertado_sumicorp: 0,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 30 DÍAS | Cantidad participantes: 35 | Posición: 8"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-02-20", fecha_presentacion: "2026-02-25",
    mes_publicacion: "FEBRERO",
    entidad: "DISTRITO ESPECIAL INDUSTRIAL Y PORTUARIO DE BARRANQUILLA",
    estado_proceso: "En Evaluación", departamento_ejecucion: "ATLANTICO",
    municipio_ejecucion: "BARRANQUILLA", cuantia_proceso: 0,
    objeto_proceso: "SUMINISTRO DE INSUMOS Y EQUIPOS DE ASEO Y CAFETERÍA PARA SER DISTRIBUIDOS EN LAS DIFERENTES SEDES DE LA ADMINISTRACIÓN CENTRAL DE LA ALCALDÍA DISTRITAL DE BARRANQUILLA",
    tipo_proceso: "ESTUDIO DE MERCADO", numero_proceso: "SIP-018-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: null, valor_ofertado_ganador: null, valor_ofertado_sumicorp: null,
    observaciones: "Categoría: INSUMOS DE ASEO Y CAFETERIA | Tiempo de ejecución: 10 MESES | Cantidad participantes: 0 | Posición: 0"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-02-24", fecha_presentacion: "2026-03-02",
    mes_publicacion: "MARZO",
    entidad: "DISTRITO ESPECIAL INDUSTRIAL Y PORTUARIO DE BARRANQUILLA",
    estado_proceso: "En Evaluación", departamento_ejecucion: "ATLANTICO",
    municipio_ejecucion: "BARRANQUILLA", cuantia_proceso: 0,
    objeto_proceso: "SUMINISTRO DE PAPELERÍA, ÚTILES DE OFICINA Y TÓNERES ORIGINALES Y DEMÁS SUMINISTROS BÁSICOS CON DESTINO A LAS DEPENDENCIAS DE LA ALCALDÍA DEL DISTRITO ESPECIAL, INDUSTRIAL Y PORTUARIO DE BARRANQUILLA",
    tipo_proceso: "ESTUDIO DE MERCADO", numero_proceso: "SIP-019-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: null, valor_ofertado_ganador: null, valor_ofertado_sumicorp: null,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 10 MESES | Cantidad participantes: 0 | Posición: 0"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-02-26", fecha_presentacion: "2026-03-04",
    mes_publicacion: "MARZO",
    entidad: "DISTRITO ESPECIAL INDUSTRIAL Y PORTUARIO DE BARRANQUILLA",
    estado_proceso: "En Evaluación", departamento_ejecucion: "ATLANTICO",
    municipio_ejecucion: "BARRANQUILLA", cuantia_proceso: 0,
    objeto_proceso: "SUMINISTRO DE KITS DE ASEO E INSUMOS DE LAVANDERÍA PARA LOS HABITANTES DE Y EN CALLE CON FACTORES DE RIESGO EN EL CENTRO DE ACOGIDA Y HOGAR DE PASO DEL DISTRITO ESPECIAL, INDUSTRIAL Y PORTUARIO DE BARRANQUILLA",
    tipo_proceso: "ESTUDIO DE MERCADO", numero_proceso: "SIP-023-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: null, valor_ofertado_ganador: null, valor_ofertado_sumicorp: null,
    observaciones: "Categoría: INSUMOS DE ASEO | Tiempo de ejecución: 3 MESES | Cantidad participantes: 0 | Posición: 0"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-04", fecha_presentacion: "2026-03-09",
    mes_publicacion: "MARZO", entidad: "POLICÍA METROPOLITANA DE MANIZALES",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CALDAS",
    municipio_ejecucion: "MANIZALES", cuantia_proceso: 136530700,
    objeto_proceso: "SUMINISTRO DE ELEMENTOS DE ASEO Y PRODUCTOS DE LIMPIEZA CON DESTINO A LA POLICÍA METROPOLITANA DE MANIZALES Y SUS UNIDADES ADSCRITAS",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "PN MEMAZ MIC 003 2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "CONVIL SOLUCIONES S.A.S", valor_ofertado_ganador: 105814205, valor_ofertado_sumicorp: 122088500,
    observaciones: "Categoría: INSUMOS DE ASEO | Tiempo de ejecución: 8 MESES | Cantidad participantes: 22 | Posición: 6"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-05", fecha_presentacion: "2026-03-11",
    mes_publicacion: "MARZO",
    entidad: "ESCUELA DE CADETES DE POLICIA GENERAL FRANCISCO DE PAULA SANTANDER ECSAN",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 30000000,
    objeto_proceso: "ADQUISICIÓN DE ELEMENTOS DE PAPELERÍA, ÚTILES DE ESCRITORIO Y OFICINA PARA LA ESCUELA DE CADETES DE POLICÍA GENERAL FRANCISCO DE PAULA SANTANDER",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "PN ECSAN MIC 011 2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "SUMICORP LTDA", valor_ofertado_ganador: 319912, valor_ofertado_sumicorp: 759393,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 60 DIAS | Cantidad participantes: 30 | Posición: 15"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-06", fecha_presentacion: "2026-03-11",
    mes_publicacion: "MARZO",
    entidad: "SENA REGIONAL CUNDINAMARCA Grupo Administrativo CBA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "MOSQUERA", cuantia_proceso: 151312235,
    objeto_proceso: "ADQUISICIÓN DE MATERIALES DE FORMACIÓN EN EL ÁREA ADMINISTRATIVA, DEL CENTRO DE BIOTECNOLOGÍA AGROPECUARIA",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-CMC-CBA-001-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "DIANA MARCELA MARTINEZ LARA", valor_ofertado_ganador: 101017366, valor_ofertado_sumicorp: 109259185,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 90 DIAS | Cantidad participantes: 20 | Posición: 8"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-09", fecha_presentacion: "2026-03-13",
    mes_publicacion: "MARZO",
    entidad: "SENA DISTRITO CAPITAL GRUPO DE APOYO ADMINISTRATIVO - CGI",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 25028426,
    objeto_proceso: "CONTRATAR LA COMPRA DE MATERIALES DE FORMACIÓN DE PAPELERÍA NECESARIOS PARA EL DESARROLLO DE LOS DIFERENTES PROGRAMAS DE FORMACIÓN QUE IMPARTE EL CENTRO DE GESTIÓN INDUSTRIAL",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-DC-CGI-003-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "GRUPO LOS LAGOS SAS", valor_ofertado_ganador: 25028426, valor_ofertado_sumicorp: 25028426,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 30 DIAS | Cantidad participantes: 14 | Posición: 7"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-09", fecha_presentacion: "2026-03-13",
    mes_publicacion: "MARZO",
    entidad: "SENA REGIONAL BOLIVAR Grupo de Apoyo Administrativo Mixto",
    estado_proceso: "Adjudicado", departamento_ejecucion: "BOLIVAR",
    municipio_ejecucion: "CARTAGENA", cuantia_proceso: 35710250,
    objeto_proceso: "CONTRATAR LA COMPRA DE ELEMENTOS PARA EL DESARROLLO DE ACTIVIDADES RELACIONADAS CON EL DEPORTE, LA RECREACIÓN, EL ARTE Y LA CULTURA - SENA REGIONAL BOLÍVAR",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-BLV-CAM-001-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "IMPERIAL SUPPLY SAS", valor_ofertado_ganador: 22624479, valor_ofertado_sumicorp: 33770500,
    observaciones: "Categoría: INSUMOS DEPORTIVOS | Tiempo de ejecución: 30 DIAS | Cantidad participantes: 15 | Posición: 13"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-09", fecha_presentacion: "2026-03-13",
    mes_publicacion: "MARZO", entidad: "SENA REGIONAL ATLANTICO",
    estado_proceso: "Adjudicado", departamento_ejecucion: "ATLANTICO",
    municipio_ejecucion: "BARRANQUILLA", cuantia_proceso: 84000000,
    objeto_proceso: "CONTRATAR LA ADQUISICIÓN DE MATERIALES NECESARIOS PARA EL DESARROLLO DE LAS ACTIVIDADES DE EXTENSIÓN CAMPESINA CON ENFOQUE AGROECOLÓGICO - REGIONAL ATLÁNTICO",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-ATL-0024-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "Micheell Blanco y/o Grupo empresarial e industrial del caribe",
    valor_ofertado_ganador: 5456842, valor_ofertado_sumicorp: 5721525,
    observaciones: "Categoría: INSUMOS LUDICOS | Tiempo de ejecución: 30 DIAS | Cantidad participantes: 13 | Posición: 4"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-10", fecha_presentacion: "2026-03-16",
    mes_publicacion: "MARZO",
    entidad: "SECRETARIA DISTRITAL DE SEGURIDAD, CONVIVENCIA Y JUSTICIA",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 113663859,
    objeto_proceso: "ADQUISICIÓN DE ÚTILES DE OFICINA Y RESMAS DE PAPEL PARA EL NORMAL FUNCIONAMIENTO ADMINISTRATIVO DE LA SECRETARÍA DISTRITAL DE SEGURIDAD, CONVIVENCIA Y JUSTICIA DE BOGOTÁ D.C",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "SCJ-MC-1-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "DISTRICONSUMOS SAS", valor_ofertado_ganador: 70283295, valor_ofertado_sumicorp: 79848880,
    observaciones: "Categoría: INSUMOS DE PAPELERÍA | Tiempo de ejecución: 2 MESES | Cantidad participantes: 26 | Posición: 7"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-10", fecha_presentacion: "2026-03-16",
    mes_publicacion: "MARZO", entidad: "SENA DIRECCION GENERAL",
    estado_proceso: "Adjudicado", departamento_ejecucion: "CUNDINAMARCA",
    municipio_ejecucion: "BOGOTA", cuantia_proceso: 15903891,
    objeto_proceso: "CONTRATAR LA ADQUISICIÓN DE EPPS ELEMENTOS DE PROTECCIÓN PERSONAL Y DOTACIÓN DE LA BRIGADA PARA CONTRATISTAS Y FUNCIONARIOS DE LA DIRECCIÓN GENERAL DEL SENA",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-DG-SG-0003-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "DIGECOL SAS", valor_ofertado_ganador: 15903891, valor_ofertado_sumicorp: 15957451,
    observaciones: "Categoría: INSUMOS DE PROTECCION PERSONAL | Tiempo de ejecución: 7 MESES | Cantidad participantes: 39 | Posición: 4"
  },
  {
    sector: "Público", fuente: "Secop II", año_publicacion: 2026,
    fecha_publicacion: "2026-03-18", fecha_presentacion: "2026-03-25",
    mes_publicacion: "MARZO",
    entidad: "SENA REGIONAL CHOCO Grupo de Apoyo Administrativo Mixto",
    estado_proceso: "Adjudicado", departamento_ejecucion: "QUIBDO",
    municipio_ejecucion: "CHOCO", cuantia_proceso: 165289176,
    objeto_proceso: "CONTRATAR LA COMPRA DE ELEMENTOS Y UTENSILIOS DE CAFETERÍA PARA EL CRNIB",
    tipo_proceso: "MINIMA CUANTIA", numero_proceso: "MC-CHC-CRNIB-0008-2026",
    correo_entrega: "SECOP II",
    proponente_ganador: "ANDROS GRUPO INTEGRAL S.A.S", valor_ofertado_ganador: 118459760, valor_ofertado_sumicorp: 110426350,
    observaciones: "Categoría: INSUMOS DE CAFETERIA | Tiempo de ejecución: 30 DIAS | Cantidad participantes: 11 | Posición: 2"
  }
];

// ─── Verificar duplicados y hacer upsert ───────────────────────────────────
async function importar() {
  console.log(`\n🚀 Iniciando importación de ${procesos.length} procesos del año 2026...\n`);

  // Verificar cuántos ya existen
  const numeroProcesos = procesos.map(p => p.numero_proceso).filter(Boolean);
  const { data: existentes, error: errExist } = await supabase
    .from('procesos')
    .select('numero_proceso')
    .in('numero_proceso', numeroProcesos);

  if (errExist) {
    console.error('❌ Error al verificar duplicados:', errExist.message);
    process.exit(1);
  }

  const existentesSet = new Set((existentes || []).map(e => e.numero_proceso));
  const nuevos = procesos.filter(p => !existentesSet.has(p.numero_proceso));
  const duplicados = procesos.filter(p => existentesSet.has(p.numero_proceso));

  if (duplicados.length > 0) {
    console.log(`⚠️  ${duplicados.length} proceso(s) ya existen en la BD (se omitirán):`);
    duplicados.forEach(p => console.log(`   - ${p.numero_proceso}`));
    console.log();
  }

  if (nuevos.length === 0) {
    console.log('✅ Todos los procesos ya estaban registrados. Nada que importar.');
    return;
  }

  console.log(`📥 Insertando ${nuevos.length} proceso(s) nuevo(s)...`);

  // Insertar en lotes de 10
  const BATCH_SIZE = 10;
  let insertados = 0;
  let errores = 0;

  for (let i = 0; i < nuevos.length; i += BATCH_SIZE) {
    const lote = nuevos.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase.from('procesos').insert(lote).select('id, numero_proceso');

    if (error) {
      console.error(`❌ Error en lote ${Math.floor(i/BATCH_SIZE)+1}:`, error.message);
      errores += lote.length;
    } else {
      insertados += data.length;
      data.forEach(d => console.log(`   ✔ ${d.numero_proceso}`));
    }
  }

  console.log(`\n─────────────────────────────────────────`);
  console.log(`✅ Importación completada`);
  console.log(`   Insertados: ${insertados}`);
  console.log(`   Omitidos (ya existían): ${duplicados.length}`);
  if (errores > 0) console.log(`   Errores: ${errores}`);
  console.log(`─────────────────────────────────────────\n`);
}

importar().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
