// Main/helpers/dates.js

const VERSIONES = {
  V2: new Date('2026-07-01')
}

/**
 * Determina qué template usar según la fecha de emisión del documento.
 * @param {string} fechaStr - Fecha en formato ISO (YYYY-MM-DD), ej: '2026-05-27'
 * @param {string} templateBase - Template anterior a la versión V2, ej: 'guia_back'
 * @param {string} templateV2 - Template de la versión V2, ej: 'v2/guia_back'
 * @returns {string} Nombre del template a renderizar
 */
export function getTemplateVersion(fechaStr, templateBase, templateV2) {
  const fecha = new Date(fechaStr + 'T00:00:00')
  return fecha >= VERSIONES.V2 ? templateV2 : templateBase
}

/**
 * Parsea una fecha en formato 'YYYY-MM-DD' como fecha local,
 * evitando el desfase de zona horaria que ocurre con new Date(dateStr).
 * @param {string} dateStr - Fecha en formato 'YYYY-MM-DD'
 * @returns {Date} Objeto Date en hora local
 */
export function parseLocalDate(dateStr) {
  if (!dateStr) return null;
  
  const [year, month, day] = dateStr.split('-').map(Number);
  
  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}