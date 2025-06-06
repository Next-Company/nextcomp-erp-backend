import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class CobrosServices{
  static async getLista(search){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      // let [result] = await conn.query(`
      //   select 
      //   tcc.DOCUMENTO,
      //   (select tc.nom from tbl2_cliente tc where tc.idx = tcc.CLIENTES ) as cliente,
      //   tcc.NUMERO,tcc.fec_ope ,tcc.tip_mon,tcc2.* from tbl2_CDP_cab tcc 
      //   join tbl2_CDP_ADI tca on tcc.idx = tca.idx_
      //   join tbl2_CDP_CREDITOS tcc2 on tcc2.CDP = tcc.idx 
      //   where tcc.ruc_ = '20522094120' and tcc.anexo = 390 and tca.condicion_pago = 'pe' and tcc.DOCUMENTO = 'FA'
      //   order by tcc.idx desc
      // `)

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tc.nro),''),' ',COALESCE(TRIM(tc.nom),''),' ',COALESCE(TRIM(tcc.numero),''))) > 0").join(" ") : ""

      console.log("F8iltro de busuda",extra,search)

      let [result] = await conn.query(`
        select 
        tcc.idx,
        tcc.DOCUMENTO,
        tc.nom as cliente,
        tc.nro,
        tcc.NUMERO,DATE_FORMAT(tcc.fec_ope,'%d/%m/%Y') as fec_ope,tcc.tip_mon,tcc.vta_gra,tcc.sum_igv,tcc.tot_vta
        from tbl2_CDP_cab tcc 
        join tbl2_CDP_ADI tca on tcc.idx = tca.idx_
        join tbl2_cliente tc on tc.idx = tcc.CLIENTES and tc.ruc_ = tcc.ruc_
        where tcc.ruc_ = '20522094120' and tcc.anexo = 390 and tca.condicion_pago = 'pe' and tcc.DOCUMENTO = 'FA' ${extra}
        order by tcc.idx desc limit 100
      `)

      return result
    } catch (error) {
      return error
    } finally {
      if(conn) await conn.end()
    }
  }
}