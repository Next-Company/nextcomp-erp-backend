// Main/helpers/v2Produccion.js
// [v2 2026-06-24 10:58] Adaptadores centralizados para el cableado de las guías
//   de Producción (familia "con tallas") al diseño v2. Campos anclados a los que
//   ya leen las planas views/guia_despacho_acabados.handlebars y
//   views/guia_despacho_muestra.handlebars (probados en producción).
//   ⚠️ Validar en staging con documentos reales antes del corte 2026-07-01.

export { seleccionarPlantilla } from './v2Despacho.js'

// Tallas estándar (la plana de acabados las imprime fijas en este orden).
export const TALLAS_STD = ['XS/26', 'S/28', 'M/30', 'L/32', 'XL/34', 'XXL/36']

/** timestamp (created_at) → 'YYYY-MM-DD' en hora local (para getTemplateVersion). */
export function fechaTimestampISO(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  if (isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Guía de PREDESPACHO de acabados (con matriz de tallas + Ing/Icp/Cdo). */
export function adaptDespachoAcabados(detalle) {
  const rows = (detalle ?? []).map((it) => ({
    articulo: it.articulo ?? '',
    qty: it.cantidad ?? '',
    valores: it.fracciones_despacho_cantidad ?? [],
    um: 'NIU',
    ing: it.despacho ?? '',
    icp: it.incompletos ?? '',
    cdo: it.caidos ?? '',
  }))
  return { detalle: rows }
}

/** Guía de ingreso de muestras (sin tallas: solo Qty/Ingreso + adicionales). */
export function adaptDespachoMuestra(detalle) {
  const rows = (detalle ?? []).map((it) => ({
    articulo: it.articulo ?? '',
    um: 'NIU',
    qty: it.cantidad ?? '',
    ingreso: it.despacho ?? '',
  }))
  return { detalle: rows }
}
