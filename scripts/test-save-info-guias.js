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
// TEST 3: SERVICIOS happy path — tipo=SERVICIOS inserts guia tables AND calls
//         UpdateMasterProduccion without error.
//
//         Strategy: use id_combo=9999999 (non-existent in hojacorte_combos).
//         The UPDATE inside UpdateMasterProduccion affects 0 rows (no FK
//         constraint on id_combo). The validation query returns the real
//         aggregate for orden 201 (146+2+0=148, not > 148) → passes.
//         We assert the hojacorte aggregate is UNCHANGED to confirm
//         UpdateMasterProduccion was called but was a no-op.
// ────────────────────────────────────────────────────────────────────────────
console.log('\nTest 3: SERVICIOS happy path (new insert, tipo=SERVICIOS)')

const [[hojaBefore]] = await db.query(`
  SELECT sum(produccion_total) as p_tot, sum(caidos_total) as c_tot,
         sum(incompletos_total) as i_tot
  FROM tbl2_fases_prod_hojacorte_combos_fracciones
  WHERE id_combo_CAB IN (1392,1393,1394,1395,1396)`)

const before3 = await counts()

const articuloServiciosHappy = {
  articulo: 'ART-SERV-001',
  cantidad: 10,
  isprototipo: 0,
  id_combo: 9999999, // non-existent → UPDATE is no-op; no FK constraint on this column
  st: 1, xxs: 1, xs: 1, s: 2, m: 2, l: 1, xl: 1, xxl: 1,
}

const result3 = await ProduccionModel.saveInfoGuias({
  info: JSON.stringify({ ...cabecera, tipo: 'SERVICIOS', orden_ref: '__TEST_SERV__' }),
  detalle: JSON.stringify([articuloServiciosHappy]),
})

const after3 = await counts()

assert('SERV: returns ok:true', result3.ok === true, JSON.stringify(result3))
assert('SERV: message is "Registro completo"', result3.message === 'Registro completo')
assert('SERV: one new row in tbl2_guias_traslado_cab', after3.cab === before3.cab + 1,
  `before=${before3.cab} after=${after3.cab}`)
assert('SERV: one new row in tbl2_guias_traslado_det', after3.det === before3.det + 1)
assert('SERV: fracciones inserted (>=1)', after3.frac > before3.frac)

const [cabRows3] = await db.query(
  "SELECT * FROM tbl2_guias_traslado_cab WHERE orden_ref = '__TEST_SERV__' ORDER BY idx DESC LIMIT 1")
assert('SERV: cab row has tipo=SERVICIOS', cabRows3.length > 0 && cabRows3[0].tipo === 'SERVICIOS')

// Verify UpdateMasterProduccion was called but didn't corrupt hojacorte data
// (id_combo=9999999 matched 0 rows in hojacorte_combos_fracciones)
const [[hojaAfter]] = await db.query(`
  SELECT sum(produccion_total) as p_tot, sum(caidos_total) as c_tot,
         sum(incompletos_total) as i_tot
  FROM tbl2_fases_prod_hojacorte_combos_fracciones
  WHERE id_combo_CAB IN (1392,1393,1394,1395,1396)`)
assert('SERV: UpdateMasterProduccion ran without side effects on hojacorte',
  String(hojaBefore.p_tot) === String(hojaAfter.p_tot) &&
  String(hojaBefore.c_tot) === String(hojaAfter.c_tot) &&
  String(hojaBefore.i_tot) === String(hojaAfter.i_tot),
  `before p/c/i=${hojaBefore.p_tot}/${hojaBefore.c_tot}/${hojaBefore.i_tot} ` +
  `after=${hojaAfter.p_tot}/${hojaAfter.c_tot}/${hojaAfter.i_tot}`)

// Cleanup test 3
const cabId3 = cabRows3[0]?.idx
if (cabId3) {
  const [det3] = await db.query('SELECT idx FROM tbl2_guias_traslado_det WHERE id_guia_CAB = ?', [cabId3])
  for (const d of det3) {
    await db.query('DELETE FROM tbl2_guias_traslado_det_fracciones WHERE id_guia_DET = ?', [d.idx])
  }
  await db.query('DELETE FROM tbl2_guias_traslado_det WHERE id_guia_CAB = ?', [cabId3])
  await db.query('DELETE FROM tbl2_guias_traslado_cab WHERE idx = ?', [cabId3])
}

// ────────────────────────────────────────────────────────────────────────────
// TEST 4: SERVICIOS rollback — same trigger as TLL (empty fracciones → SQL
//         error after cab+det written). UpdateMasterProduccion is NOT reached
//         because the failure happens inside the main insert loop (line ~1265),
//         before the tipo==SERVICIOS block at line 1268.
// ────────────────────────────────────────────────────────────────────────────
console.log('\nTest 4: SERVICIOS rollback on mid-write failure (empty fracciones)')

const before4 = await counts()

const result4 = await ProduccionModel.saveInfoGuias({
  info: JSON.stringify({ ...cabecera, tipo: 'SERVICIOS', orden_ref: '__TEST_SERV_ROLLBACK__' }),
  detalle: JSON.stringify([articuloSinTallas]),
})

const after4 = await counts()

assert('SERV rollback: returns ok:false', result4.ok === false, JSON.stringify(result4))
assert('SERV rollback: no new cab rows', after4.cab === before4.cab,
  `before=${before4.cab} after=${after4.cab}`)
assert('SERV rollback: no new det rows', after4.det === before4.det)
assert('SERV rollback: no new frac rows', after4.frac === before4.frac)
assert('SERV rollback: no new adi rows', after4.adi === before4.adi)
assert('SERV rollback: no new reprog rows', after4.rep === before4.rep)

const [orphans4] = await db.query(
  "SELECT COUNT(*) as n FROM tbl2_guias_traslado_cab WHERE orden_ref = '__TEST_SERV_ROLLBACK__'")
assert('SERV rollback: no orphan cab rows', orphans4[0].n === 0, `found ${orphans4[0].n}`)

// ────────────────────────────────────────────────────────────────────────────
await db.end()

console.log(`\n${'─'.repeat(50)}`)
console.log(`  ${passed} passed  |  ${failed} failed`)
console.log('─'.repeat(50))

if (failed > 0) process.exit(1)
