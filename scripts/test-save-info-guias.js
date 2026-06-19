/**
 * Characterization test for ProduccionModel.saveInfoGuias() — TLL path
 *
 * Locks in:
 *   1. Happy path returns { ok: true } and persists rows across 3 tables
 *   2. On failure mid-write, transaction rolls back: no partial rows in any table
 *
 * Run: node --env-file .env.staging scripts/test-save-info-guias.js
 *
 * Requires staging DB (mysql_staging on port 3307) and
 * tbl2_fases_prod_ordenes.idx = 201 with tallasbase = 0000000001.
 */

import mysql from 'mysql2/promise'
import { configs } from '../Main/utils.js'
import { ProduccionModel } from '../Produccion/Servicios/produccion.js'

let passed = 0
let failed = 0

function assert(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${name}${detail ? ' — ' + detail : ''}`)
    failed++
  }
}

const db = await mysql.createConnection(configs[1])

async function counts() {
  const [[{ cab }]] = await db.query('SELECT COUNT(*) as cab FROM tbl2_guias_traslado_cab')
  const [[{ det }]] = await db.query('SELECT COUNT(*) as det FROM tbl2_guias_traslado_det')
  const [[{ frac }]] = await db.query('SELECT COUNT(*) as frac FROM tbl2_guias_traslado_det_fracciones')
  const [[{ adi }]] = await db.query('SELECT COUNT(*) as adi FROM tbl2_guias_traslado_adi')
  const [[{ rep }]] = await db.query('SELECT COUNT(*) as rep FROM tbl2_guias_traslado_reprogramacion')
  return { cab, det, frac, adi, rep }
}

// id_orden_CAB=201 exists in staging with tallasbase=0000000001
// tallas: st, xxs, xs, s, m, l, xl, xxl
const ORDEN_CAB = 201

const cabecera = {
  tipo: 'TLL',
  id_orden_CAB: ORDEN_CAB,
  orden_ref: '__TEST__',
  servicio: 'TEST-CHAR',
  fec_emision: '2026-06-19',
  proveedor: 'PROVEEDOR TEST',
  responsable: 'TEST RUNNER',
}

// Articulo with talla keys matching template → fracciones will be non-empty
const articuloConTallas = {
  articulo: 'ART-TEST-001',
  cantidad: 10,
  isprototipo: 0,
  id_combo: null,
  st: 1, xxs: 1, xs: 1, s: 2, m: 2, l: 1, xl: 1, xxl: 1,
}

// Articulo with NO talla keys → fracciones=[] → SQL error after cab+det written
const articuloSinTallas = {
  articulo: 'ART-FAIL-001',
  cantidad: 5,
  isprototipo: 0,
  id_combo: null,
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 1: Happy path — new insert, tipo=TLL
// ────────────────────────────────────────────────────────────────────────────
console.log('\nTest 1: Happy path (new insert, tipo=TLL)')

const before1 = await counts()

const result1 = await ProduccionModel.saveInfoGuias({
  info: JSON.stringify(cabecera),
  detalle: JSON.stringify([articuloConTallas]),
})

const after1 = await counts()

assert('returns ok:true', result1.ok === true, JSON.stringify(result1))
assert('message is "Registro completo"', result1.message === 'Registro completo')
assert('one new row in tbl2_guias_traslado_cab', after1.cab === before1.cab + 1,
  `before=${before1.cab} after=${after1.cab}`)
assert('one new row in tbl2_guias_traslado_det', after1.det === before1.det + 1,
  `before=${before1.det} after=${after1.det}`)
assert('fracciones inserted (≥1)', after1.frac > before1.frac,
  `before=${before1.frac} after=${after1.frac}`)

// Find inserted cab row and verify contents
const [cabRows] = await db.query(
  "SELECT * FROM tbl2_guias_traslado_cab WHERE orden_ref = '__TEST__' ORDER BY idx DESC LIMIT 1"
)
assert('cab row has correct orden_ref', cabRows.length === 1 && cabRows[0].orden_ref === '__TEST__')
assert('cab row has correct tipo', cabRows.length > 0 && cabRows[0].tipo === 'TLL')

const insertedCabId = cabRows[0]?.idx
if (insertedCabId) {
  const [detRows] = await db.query(
    'SELECT * FROM tbl2_guias_traslado_det WHERE id_guia_CAB = ?', [insertedCabId]
  )
  assert('det row references correct cab', detRows.length === 1 && detRows[0].id_guia_CAB == insertedCabId)
  assert('det row has correct articulo', detRows.length > 0 && detRows[0].articulo === 'ART-TEST-001')

  const [fracRows] = await db.query(
    'SELECT * FROM tbl2_guias_traslado_det_fracciones WHERE id_guia_DET = ?', [detRows[0]?.idx]
  )
  assert('fracciones rows reference correct det', fracRows.length > 0)
}

// Cleanup test data
if (insertedCabId) {
  const [detForCleanup] = await db.query(
    'SELECT idx FROM tbl2_guias_traslado_det WHERE id_guia_CAB = ?', [insertedCabId]
  )
  for (const d of detForCleanup) {
    await db.query('DELETE FROM tbl2_guias_traslado_det_fracciones WHERE id_guia_DET = ?', [d.idx])
  }
  await db.query('DELETE FROM tbl2_guias_traslado_det WHERE id_guia_CAB = ?', [insertedCabId])
  await db.query('DELETE FROM tbl2_guias_traslado_cab WHERE idx = ?', [insertedCabId])
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 2: Rollback — failure mid-write (fracciones vacías → SQL error after
//         cab and det rows are already written inside the transaction)
// ────────────────────────────────────────────────────────────────────────────
console.log('\nTest 2: Rollback on mid-write failure')

const before2 = await counts()

const result2 = await ProduccionModel.saveInfoGuias({
  info: JSON.stringify({ ...cabecera, orden_ref: '__TEST_ROLLBACK__' }),
  detalle: JSON.stringify([articuloSinTallas]),
})

const after2 = await counts()

assert('returns ok:false', result2.ok === false, JSON.stringify(result2))
assert('no new cab rows (rollback held)', after2.cab === before2.cab,
  `before=${before2.cab} after=${after2.cab}`)
assert('no new det rows (rollback held)', after2.det === before2.det,
  `before=${before2.det} after=${after2.det}`)
assert('no new frac rows (rollback held)', after2.frac === before2.frac,
  `before=${before2.frac} after=${after2.frac}`)
assert('no new adi rows', after2.adi === before2.adi)
assert('no new reprog rows', after2.rep === before2.rep)

// Verify no orphan test rows leaked (defensive check)
const [orphans] = await db.query(
  "SELECT COUNT(*) as n FROM tbl2_guias_traslado_cab WHERE orden_ref = '__TEST_ROLLBACK__'"
)
assert('no orphan cab rows for __TEST_ROLLBACK__', orphans[0].n === 0,
  `found ${orphans[0].n}`)

// ────────────────────────────────────────────────────────────────────────────
await db.end()

console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${passed} passed  |  ${failed} failed`)
console.log('─'.repeat(50))

if (failed > 0) process.exit(1)
