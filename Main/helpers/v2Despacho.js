// Main/helpers/v2Despacho.js
// [v2 2026-06-24 10:30] Adaptadores centralizados para el cableado de las guías
//   de Almacén al diseño v2. Mapean la forma cruda (filas de getMovimientosAlmacenById)
//   al contrato normalizado que consumen las plantillas views/v2/*. Los campos
//   usados son los MISMOS que leen los helpers `foo` de los controladores flat
//   (probados en producción): nom, color, num_lote, rollos, peso, metros,
//   comprometido, unidad, Cant_despacho_DET.
//   ⚠️ Fidelidad pendiente de validar en staging: las guías de telas flat
//   despliegan sub-filas por rollo (item.info_rollos) que aún no se replican aquí.

import { getTemplateVersion } from './dates.js'

const _num = (v) => parseFloat(v) || 0
const _sumSalida = (rows) => rows.reduce((a, r) => a + _num(r.salida), 0).toFixed(2)

/** 'DD/MM/YYYY[ hh:mm:ss]' → 'YYYY-MM-DD' (formato que espera getTemplateVersion). */
export function fechaDocISO(fecEmisionDoc) {
  if (!fecEmisionDoc || typeof fecEmisionDoc !== 'string') return ''
  const [d, m, y] = fecEmisionDoc.split(' ')[0].split('/')
  return (y && m && d) ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
}

/** Guía de MOVIMIENTO de almacén (telas). */
export function adaptMovimiento(detalle) {
  const rows = (detalle ?? []).map((it) => ({
    descripcion: `${it.nom ?? ''} ${it.color ?? ''}(#Lt-${it.num_lote ?? ''})`.trim(),
    rollos: it.rollos ?? '',
    metros: it.metros ?? '',
    cantidad: it.comprometido ?? '',
    unidad: it.unidad ?? '',
    salida: it.Cant_despacho_DET ?? '',
  }))
  return { detalle: rows, totalSalida: _sumSalida(rows) }
}

/** Guía de DESPACHO de almacén — avíos (Suc_Tienda 508) o telas. */
export function adaptDespachoAlmacen(detalle, isAvios) {
  const rows = (detalle ?? []).map((it) => isAvios
    ? {
        descripcion: it.nom ?? '',
        cantSolicitada: it.comprometido ?? '',
        unidad: it.unidad ?? '',
        salida: it.Cant_despacho_DET ?? '',
      }
    : {
        descripcion: `${it.nom ?? ''} ${it.color ?? ''}(#Lt-${it.num_lote ?? ''})`.trim(),
        rollos: it.rollos ?? '',
        peso: it.peso ?? '',
        cantidad: it.comprometido ?? '',
        unidad: it.unidad ?? '',
        salida: it.Cant_despacho_DET ?? '',
      })
  return { detalle: rows, totalSalida: _sumSalida(rows) }
}

/**
 * Selecciona plantilla flat vs v2 por fecha de emisión.
 * @param {string} fechaISO  fecha de emisión 'YYYY-MM-DD'
 * @param {string} flat      nombre de la plantilla plana
 * @param {string} v2        nombre de la plantilla v2 (con prefijo 'v2/')
 * @param {boolean} habilitarV2  si false, fuerza la plana (ej. modo no soportado en v2)
 */
export function seleccionarPlantilla(fechaISO, flat, v2, habilitarV2 = true) {
  return habilitarV2 ? getTemplateVersion(fechaISO, flat, v2) : flat
}
