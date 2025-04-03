// import { mysql2 } from 'mysql2'
import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise"
export class LetrasService{
  static async getLetrasLista(search){
    console.log("Cosultando letras registrasdsd")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.query(`SELECT tlc.*,COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_letras_cab tlc WHERE 1=1 LIMIT 100`)
      console.log(result)

      // await conn.end()
      return result 

    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
      // return 0
    }
  }
  static async getLetraById(id){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.query(`SELECT tlc.*,COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_letras_cab tlc WHERE idx = ? LIMIT 100`,[id])

      return result 
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteLetraById(id){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.query(`DELETE FROM tbl2_letras_cab WHERE idx = ?`,[id])

      return [{ok:true,resp:'ok'}]
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveInfoLetra(data){
    let conn
    console.log("Info del formulario:",data)
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    console.log("Muestra info cabecera : ",cabecera)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()
      if(data.id){
        await conn.query('UPDATE tbl2_letras_cab SET id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),documentos_ref=NULLIF(?, ""),num_letra=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_vencimiento=NULLIF(?, ""),importe=NULLIF(?, ""),estado=NULLIF(?, ""),observaciones=NULLIF(?, ""),moneda=NULLIF(?, "") WHERE idx = ?',[cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.documentos_ref,cabecera.num_letra,cabecera.fec_emision,cabecera.fec_vencimiento,cabecera.importe,cabecera.estado,cabecera.observaciones,cabecera.moneda,parseInt(data.id)])
      }else{
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_letras_cab(ruc_,id_proveedor_CAB,proveedor,documentos_ref,num_letra,fec_emision,fec_vencimiento,importe,estado,observaciones,moneda) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.documentos_ref,cabecera.num_letra,cabecera.fec_emision,cabecera.fec_vencimiento,cabecera.importe,cabecera.estado,cabecera.observaciones,cabecera.moneda])
        }catch(err){
          console.log("error en la consulta",err)
        }
        // await conn.end();
      }
      return results
    } catch (err) {
      console.log(err)
      conn.rollback()
      return [err]
    } finally {
      if (conn) {
        conn.commit()
        // conn.rollback()
        await conn.end();
      }
    }
  }
}