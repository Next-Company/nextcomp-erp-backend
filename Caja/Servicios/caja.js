import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'

export default class CajaServices{
  static async getResumenCaja(fecha){
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let [cajas] = await conn.query("SELECT *FROM tbl2_caja WHERE ruc_ = '20522094120' and visibilidad_caja = 1")
      let [movimientos] = await conn.query("SELECT tcmc.saldo_inicial, tcmd.* FROM tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja_movimientos_det tcmd ON tcmc.idx = tcmd.id_cajamov_CAB WHERE tcmc.ruc_ = '20522094120' AND tcmc.id_caja_CAB = 17 AND DATE(tcmc.fec_operacion) = '2025-06-17'")

      return {'cajas':cajas,'movimientos':movimientos}
    } catch (error) {
      if(conn) conn.end()
    } finally {
      if(conn) conn.end()
    }
    return 0
  }
}