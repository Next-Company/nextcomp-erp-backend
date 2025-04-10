import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class ReporteService{
  static async getInformeLetras(filters){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      // const [result] = await conn.query(`select tb1.*,MONTH(tb1.fec_emision) as mes from tbl2_letras_cab tb1 where tb1.estado = 'EMIT'`)
      const [result] = await conn.query(`
        SELECT tb1.proveedor,MONTH(tb1.fec_vencimiento) as mes,tb1.documentos_ref,tb1.num_letra,DATE_FORMAT(tb1.fec_emision,'%d/%m/%Y') as fec_emision,DATE_FORMAT(tb1.fec_vencimiento,'%d/%m/%Y') as fec_vencimiento,IF(tb1.moneda = 'MN',tb1.importe,0) AS importe_soles,IF(tb1.moneda = 'USD',tb1.importe,0) AS importe_dolares,GROUP_CONCAT(CONCAT(IF(tda.tipodoc = 1,'FT','NC'),tda.serie,'-',tda.numero)) as facturas_ref
        FROM tbl2_letras_cab tb1
        LEFT JOIN tbl2_letras_adi tla on tb1.idx = tla.id_letra_CAB 
        LEFT JOIN tbl2_despachos_adi tda on tda.idx = tla.id_factura_CAB 
        WHERE tb1.estado = 'EMIT'
        GROUP BY tb1.proveedor,tb1.moneda,tb1.documentos_ref,tb1.num_letra,tb1.fec_emision,tb1.fec_vencimiento ,tb1.importe
      `)
      await conn.end()
      return result
    } catch (error) {
      console.log(error)
    } finally{
      if(conn) conn.end()
    }
  }
}