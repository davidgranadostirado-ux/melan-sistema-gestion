import type { Proceso, Gasto, Venta, PerfilDocumento } from '@/types'
import { formatCurrency, MESES } from '@/lib/utils'

export type NotificacionNivel = 'urgente' | 'aviso' | 'info'
export type NotificacionGrupo = 'fechas' | 'documental' | 'financiero' | 'actividad'

export interface Notificacion {
  id: string
  grupo: NotificacionGrupo
  nivel: NotificacionNivel
  titulo: string
  detalle: string
  /** Fecha ISO usada para ordenar (más reciente / más urgente primero) */
  orden: string
  href: string
}

/** Fecha de hoy en formato YYYY-MM-DD según la hora local */
function hoyISO(): string {
  const d = new Date()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${mm}-${dd}`
}

/** Días entre hoy y una fecha YYYY-MM-DD (negativo = ya pasó) */
function diasHasta(fecha: string): number {
  const a = new Date(hoyISO() + 'T00:00:00')
  const b = new Date(fecha.slice(0, 10) + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / 86_400_000)
}

/** Días transcurridos desde un timestamp */
function diasDesde(timestamp: string): number {
  const t = new Date(timestamp).getTime()
  if (Number.isNaN(t)) return 999
  return Math.floor((Date.now() - t) / 86_400_000)
}

function etiquetaRelativa(dias: number): string {
  if (dias <= 0) return 'hoy'
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 14) return 'hace una semana'
  return `hace ${Math.floor(dias / 7)} semanas`
}

const ESTADOS_PENDIENTES = ['Pendiente', 'A Presentar', 'Borrador', 'Estudio de Mercado']

interface Entrada {
  procesos: Proceso[]
  gastos: Gasto[]
  ventas: Venta[]
  documentos: PerfilDocumento[]
  /** id de usuario → nombre, para la actividad reciente */
  nombresPorId: Record<string, string>
}

/** Días de anticipación para avisar el vencimiento de un documento */
const DIAS_ALERTA_DOCUMENTO = 15

export function construirNotificaciones({
  procesos, gastos, ventas, documentos, nombresPorId,
}: Entrada): Notificacion[] {
  const out: Notificacion[] = []

  // ============================================================
  // 1. FECHAS DE PRESENTACIÓN
  // ============================================================
  for (const p of procesos) {
    if (!p.fecha_presentacion) continue
    if (!ESTADOS_PENDIENTES.includes(p.estado_proceso)) continue

    const dias = diasHasta(p.fecha_presentacion)
    const entidad = p.entidad || 'Sin entidad'

    if (dias < 0 && dias >= -30) {
      out.push({
        id: `venc-${p.id}`,
        grupo: 'fechas',
        nivel: 'urgente',
        titulo: 'Fecha de presentación vencida',
        detalle: `${entidad} — venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'} y sigue en "${p.estado_proceso}"`,
        orden: p.fecha_presentacion,
        href: '/procesos',
      })
    } else if (dias >= 0 && dias <= 7) {
      const cuando = dias === 0 ? 'vence hoy' : dias === 1 ? 'vence mañana' : `vence en ${dias} días`
      out.push({
        id: `prox-${p.id}`,
        grupo: 'fechas',
        nivel: dias <= 2 ? 'urgente' : 'aviso',
        titulo: `Presentación ${cuando}`,
        detalle: `${entidad} — ${p.objeto_proceso?.slice(0, 70) ?? ''}`,
        orden: p.fecha_presentacion,
        href: '/procesos',
      })
    }
  }

  // ============================================================
  // 2. PERFIL DOCUMENTAL (vencimiento de documentos)
  // ============================================================
  for (const d of documentos) {
    if (!d.aplica || !d.fecha_vencimiento) continue
    const dias = diasHasta(d.fecha_vencimiento)

    if (dias < 0 && dias >= -120) {
      out.push({
        id: `doc-venc-${d.id}`,
        grupo: 'documental',
        nivel: 'urgente',
        titulo: `Documento vencido: ${d.documento}`,
        detalle: `Venció hace ${Math.abs(dias)} ${Math.abs(dias) === 1 ? 'día' : 'días'} — reemplázalo en Perfil Documental`,
        orden: d.fecha_vencimiento,
        href: '/perfil-documental',
      })
    } else if (dias >= 0 && dias <= DIAS_ALERTA_DOCUMENTO) {
      const cuando = dias === 0 ? 'vence hoy' : dias === 1 ? 'vence mañana' : `vence en ${dias} días`
      out.push({
        id: `doc-prox-${d.id}`,
        grupo: 'documental',
        nivel: dias <= 5 ? 'urgente' : 'aviso',
        titulo: `Documento ${cuando}: ${d.documento}`,
        detalle: `Renueva ${d.documento} antes de la fecha de vencimiento`,
        orden: d.fecha_vencimiento,
        href: '/perfil-documental',
      })
    }
  }

  // ============================================================
  // 3. FINANCIERO (Ingresos y Gastos)
  // ============================================================
  const porMes = new Map<string, { ingresos: number; gastos: number }>()
  const acumular = (fecha: string, campo: 'ingresos' | 'gastos', valor: number) => {
    if (!fecha) return
    const key = fecha.slice(0, 7)
    if (!porMes.has(key)) porMes.set(key, { ingresos: 0, gastos: 0 })
    porMes.get(key)![campo] += valor
  }
  ventas.forEach((v) => acumular(v.fecha, 'ingresos', Number(v.valor ?? 0)))
  gastos.forEach((g) => acumular(g.fecha, 'gastos', Number(g.valor ?? 0)))

  // Últimos 3 meses con movimiento
  const mesesOrdenados = Array.from(porMes.entries()).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 3)
  for (const [key, m] of mesesOrdenados) {
    if (m.gastos <= m.ingresos) continue
    const nombreMes = `${MESES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`
    const perdida = m.gastos - m.ingresos
    out.push({
      id: `perdida-${key}`,
      grupo: 'financiero',
      nivel: 'aviso',
      titulo: `${nombreMes} cerró en pérdida`,
      detalle: `Gastos ${formatCurrency(m.gastos)} vs. ingresos ${formatCurrency(m.ingresos)} — diferencia de ${formatCurrency(perdida)}`,
      orden: `${key}-28`,
      href: '/finanzas',
    })
  }

  // Balance global
  const totalIngresos = ventas.reduce((s, v) => s + Number(v.valor ?? 0), 0)
  const totalGastos = gastos.reduce((s, g) => s + Number(g.valor ?? 0), 0)
  if (totalGastos > totalIngresos && (totalIngresos > 0 || totalGastos > 0)) {
    out.push({
      id: 'balance-global',
      grupo: 'financiero',
      nivel: 'aviso',
      titulo: 'Los gastos superan los ingresos',
      detalle: `Acumulado: gastos ${formatCurrency(totalGastos)} vs. ingresos ${formatCurrency(totalIngresos)}`,
      orden: hoyISO(),
      href: '/finanzas',
    })
  }

  // ============================================================
  // 3. ACTIVIDAD RECIENTE DEL EQUIPO (últimos 7 días)
  // ============================================================
  const quien = (id?: string) => (id ? (nombresPorId[id] ?? 'Alguien') : 'Alguien')

  for (const p of procesos) {
    const dias = diasDesde(p.created_at)
    if (dias > 7) continue
    out.push({
      id: `act-proc-${p.id}`,
      grupo: 'actividad',
      nivel: 'info',
      titulo: `${quien(p.created_by)} cargó un proceso`,
      detalle: `${p.entidad || 'Sin entidad'} — ${formatCurrency(p.cuantia_proceso)} · ${etiquetaRelativa(dias)}`,
      orden: p.created_at,
      href: '/procesos',
    })
  }

  for (const v of ventas) {
    const dias = diasDesde(v.created_at)
    if (dias > 7) continue
    out.push({
      id: `act-venta-${v.id}`,
      grupo: 'actividad',
      nivel: 'info',
      titulo: `${quien(v.created_by)} registró una venta`,
      detalle: `${v.cliente} — ${formatCurrency(Number(v.total ?? 0))} · ${etiquetaRelativa(dias)}`,
      orden: v.created_at,
      href: '/finanzas',
    })
  }

  for (const g of gastos) {
    const dias = diasDesde(g.created_at)
    if (dias > 7) continue
    out.push({
      id: `act-gasto-${g.id}`,
      grupo: 'actividad',
      nivel: 'info',
      titulo: `${quien(g.created_by)} registró un gasto`,
      detalle: `${g.proveedor} — ${g.categoria} · ${formatCurrency(Number(g.total ?? 0))} · ${etiquetaRelativa(dias)}`,
      orden: g.created_at,
      href: '/finanzas',
    })
  }

  // Orden: primero urgentes, luego avisos, luego actividad (más reciente arriba)
  const peso: Record<NotificacionNivel, number> = { urgente: 0, aviso: 1, info: 2 }
  out.sort((a, b) => {
    if (peso[a.nivel] !== peso[b.nivel]) return peso[a.nivel] - peso[b.nivel]
    if (a.nivel === 'info') return b.orden.localeCompare(a.orden)  // actividad: más reciente primero
    return a.orden.localeCompare(b.orden)                          // fechas: más próxima primero
  })

  return out.slice(0, 40)
}
