import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'

export default class CajaServices{
  static async getResumenCaja(fecha,idcaja){
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      console.log("Info de los parametros :",fecha,idcaja)

      let [cajas] = await conn.query("SELECT *FROM tbl2_caja WHERE ruc_ = '20522094120' and visibilidad_caja = 1")

      let [apertura] = await conn.query(`SELECT sum(tcmc.saldo_final) as saldo_final FROM tbl2_caja_movimientos_cab tcmc WHERE tcmc.ruc_ = '20522094120' AND DATE(tcmc.fec_operacion) = DATE_ADD(DATE('${fecha}'),INTERVAL -1 DAY)` + (parseInt(idcaja) ? ' AND tcmc.idx = ' + idcaja : ''))

      let query_mov = `SELECT tcmc.saldo_inicial, tcmd.* FROM tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja_movimientos_det tcmd ON tcmc.idx = tcmd.id_cajamov_CAB WHERE tcmc.ruc_ = '20522094120' AND DATE(tcmc.fec_operacion) = '${fecha}'` + (parseInt(idcaja) ? ' AND tcmc.id_caja_CAB = ' + idcaja : '')
      console.log(query_mov)
      let [movimientos] = await conn.query(query_mov)

      return {'cajas':cajas,'movimientos':movimientos,'apertura':apertura}
    } catch (error) {
      if(conn) conn.end()
    } finally {
      if(conn) conn.end()
    }
    return 0
  }
}