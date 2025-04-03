import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class ReporteService{
  static async getInformeLetras(){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      const [result] = await conn.query(`select tb1.*,MONTH(tb1.fec_emision) as mes from tbl2_letras_cab tb1 where tb1.estado = 'EMIT'`)
      console.log(result)
      await conn.end()
      return result
    } catch (error) {
      console.log(error)
    } finally{
      if(conn) conn.end()
    }
  }
}