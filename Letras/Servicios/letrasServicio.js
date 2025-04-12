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
      // let [result] = await conn.query(`SELECT tlc.*,COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_letras_cab tlc WHERE 1=1 ORDER BY tlc.idx DESC LIMIT 100`)
      let [result] = await conn.query(`
        SELECT tlc.idx,tlc.id_proveedor_CAB,tlc.proveedor,tlc.documentos_ref,tlc.num_letra,tlc.moneda,DATE_FORMAT(tlc.fec_emision,'%d/%m/%Y') as fec_emision,DATE_FORMAT(tlc.fec_vencimiento,'%d/%m/%Y') as fec_vencimiento,
        tlc.importe,tlc.estado,tlc.observaciones,
        COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
        COALESCE(GROUP_CONCAT(CONCAT(CASE WHEN tda.tipodoc = 1 THEN 'FT' WHEN tda.tipodoc = 2 THEN 'NC' ELSE 'ND' END,tda.serie,tda.numero)),'') as facturas_ref,
        (
          SELECT COALESCE(sum(COALESCE(importe,0)),0) as cancelado FROM tbl2_conciliaciones tc  
          JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
          WHERE tlc.idx = tc.id_letra_CAB
        ) as cancelado
        FROM tbl2_letras_cab tlc 
        LEFT JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
        LEFT JOIN tbl2_despachos_adi tda on tda.idx = tla.id_factura_CAB 
        WHERE 1=1 
        group by tlc.idx,tlc.id_proveedor_CAB,tlc.proveedor,tlc.documentos_ref,tlc.num_letra,tlc.moneda,tlc.fec_emision,tlc.fec_vencimiento,tlc.importe,tlc.estado,tlc.observaciones
        ORDER BY tlc.idx DESC
        LIMIT 100
        `)
      // console.log(result)

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
      let [result2] = await conn.query(`SELECT tda.* FROM tbl2_letras_adi tla
        JOIN tbl2_despachos_adi tda ON tla.id_factura_CAB = tda.idx
        WHERE tla.id_letra_CAB = ? LIMIT 100`,[id])

      return [result,result2]
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
    const detalle = JSON.parse(data.registros)
    console.log("Muestra info cabecera :",cabecera)
    console.log("Muestra info detalle :",detalle)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()
      if(data.id){
        await conn.query('UPDATE tbl2_letras_cab SET id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),documentos_ref=NULLIF(?, ""),num_letra=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_vencimiento=NULLIF(?, ""),importe=NULLIF(?, ""),estado=NULLIF(?, ""),observaciones=NULLIF(?, ""),moneda=NULLIF(?, "") WHERE idx = ?',[cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.documentos_ref,cabecera.num_letra,cabecera.fec_emision,cabecera.fec_vencimiento,cabecera.importe,cabecera.estado,cabecera.observaciones,cabecera.moneda,parseInt(data.id)])

        const [res,fld] = await conn.query("SELECT *FROM tbl2_letras_adi WHERE id_letra_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !detalle.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 
        const insert = async ()=>{
          const fila = detalle.shift()
          if(fila){
            if(fila.idx && fila.idx !== ''){
              console.log("Detro de la actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_letras_adi SET id_factura_CAB=NULLIF(?, "") WHERE idx = ? and id_letra_CAB = ?',[fila.precio,fila.despacho,fila.caidos,fila.idx,parseInt(data.id)]);
            }else{
              const [results,fields] = await conn.query('INSERT INTO tbl2_letras_adi(id_letra_CAB,id_factura_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.id_item,fila.despacho,fila.caidos]);
            }
            await insert()
          }else{
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert();
        const eliminar = async ()=>{
          console.log("Eliminando")
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_letras_adi` WHERE `id_letra_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar();
        
      }else{
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_letras_cab(ruc_,id_proveedor_CAB,proveedor,documentos_ref,num_letra,fec_emision,fec_vencimiento,importe,estado,observaciones,moneda) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.documentos_ref,cabecera.num_letra,cabecera.fec_emision,cabecera.fec_vencimiento,cabecera.importe,cabecera.estado,cabecera.observaciones,cabecera.moneda])

          const insert = async ()=>{
            const fila = detalle.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_letras_adi(id_letra_CAB,id_factura_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.idx]);
              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()
          
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
  static async getFacturasByProveedor(idproveedor){
    let conn = undefined
    console.log("Consultando facturas por proveedor:",idproveedor)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      // let [result] = await conn.query(`
      //   SELECT tp.nom,tpic.orden_ref,tdc.nro_guia as guia_ingreso,tda.* 
      //   FROM tbl2_proveedor tp 
      //   JOIN tbl2_pedidos_insumos_cab tpic ON tp.idx = tpic.id_proveedor_CAB 
      //   JOIN tbl2_despachos_cab tdc ON tdc.id_pedido_origen = tpic.idx
      //   JOIN tbl2_despachos_adi tda ON tdc.idx = tda.id_despacho_CAB 
      //   WHERE tp.idx = ?
      // `,[idproveedor])
      let [result] = await conn.query(`
        SELECT tp.nom,tpic.orden_ref,tdc.nro_guia as guia_ingreso,tda.*,
        (
          SELECT COALESCE(sum(tlc.importe),0) FROM tbl2_letras_cab tlc 
          JOIN tbl2_letras_adi tla ON tlc.idx = tla.id_letra_CAB
          WHERE tla.id_factura_CAB = tda.idx
        ) as cancelado
        FROM tbl2_proveedor tp 
        JOIN tbl2_pedidos_insumos_cab tpic ON tp.idx = tpic.id_proveedor_CAB 
        JOIN tbl2_despachos_cab tdc ON tdc.id_pedido_origen = tpic.idx
        JOIN tbl2_despachos_adi tda ON tdc.idx = tda.id_despacho_CAB 
        WHERE tp.idx = ?
        `,[idproveedor])
      return result 
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
      // return 0
    }
  }
}