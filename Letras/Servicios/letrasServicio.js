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
        COALESCE(GROUP_CONCAT(CONCAT(CASE WHEN tda.tipodoc = 1 THEN 'FA' WHEN tda.tipodoc = 2 THEN 'NC' ELSE 'ND' END,tda.serie,'-',tda.numero)),'') as facturas_ref,
        (
          SELECT COALESCE(sum(COALESCE(importe,0)),0) as cancelado FROM tbl2_conciliaciones tc  
          JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
          WHERE tlc.idx = tc.id_letra_CAB
        ) as cancelado
        FROM tbl2_letras_cab tlc 
        LEFT JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
        LEFT JOIN tbl2_despachos_cab tdc on tdc.id_pedido_origen =  tla.id_pedido_CAB
        LEFT JOIN tbl2_despachos_adi tda on tda.id_despacho_CAB = tdc.idx
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
      // let [result2] = await conn.query(`SELECT tda.* FROM tbl2_letras_adi tla
      //   JOIN tbl2_despachos_adi tda ON tla.id_factura_CAB = tda.idx
      //   WHERE tla.id_letra_CAB = ? LIMIT 100`,[id])
      
      const [result2, fields] = await conn.query(`
        SELECT tla.idx,tb1.idx as idpedido,tb1.orden_ref,tb1.tipo,tb1.proveedor,tb1.fec_emision,tb1.fec_retorno,COALESCE(DATEDIFF(tb1.fec_retorno,tb1.fec_emision),'') as tiempo_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,tb1.forma_pago,tb1.estado,
        (
          SELECT SUM(COALESCE(cantidad,0)) FROM tbl2_pedidos_insumos_det tpid 
          WHERE tpid.id_pedido_CAB = tb1.idx
        ) as cantidad,
        (
          SELECT SUM(COALESCE(cantidad,0)*COALESCE(precio,0)) FROM tbl2_pedidos_insumos_det tpid 
          WHERE tpid.id_pedido_CAB = tb1.idx
        ) as importe,
        (
          SELECT COALESCE(sum(despacho),0) as despacho FROM tbl2_despachos_cab tdc
          JOIN tbl2_despachos_det tdd ON tdc.idx = tdd.id_despacho_CAB
          WHERE tdc.id_pedido_origen = tb1.idx
        ) as despacho,
        ( 
          select COALESCE(SUM(COALESCE(importe_total,0)),0) FROM tbl2_despachos_cab tdc
          JOIN tbl2_despachos_adi tda ON tda.id_despacho_CAB = tdc.idx
          where tdc.id_pedido_origen = tb1.idx 
        ) as importe_despacho,
        (
          SELECT COALESCE(sum(COALESCE(tlc.importe,0)),0) 
          FROM tbl2_letras_cab tlc 
          JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB
          WHERE tla.id_pedido_CAB = tb1.idx
        ) as cancelado
        FROM tbl2_pedidos_insumos_cab tb1
        JOIN tbl2_letras_adi tla ON tla.id_pedido_CAB = tb1.idx
        WHERE tla.id_letra_CAB = ?
        `,[id]);
        console.log("Consultando info cancela pedido:",result2)

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
      let [result2] = await conn.query(`DELETE FROM tbl2_letras_adi WHERE id_letra_CAB = ?`,[id])
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
              const [results, fields] = await conn.query('UPDATE tbl2_letras_adi SET id_pedido_CAB=NULLIF(?, "") WHERE idx = ? and id_letra_CAB = ?',[fila.idpedido,fila.idx,parseInt(data.id)]);
            }else{
              const [results,fields] = await conn.query('INSERT INTO tbl2_letras_adi(id_letra_CAB,id_pedido_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.idpedido]);
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
              const [results,fields] = await conn.query('INSERT INTO tbl2_letras_adi(id_letra_CAB,id_pedido_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.idpedido]);
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

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return results
    } catch (err) {
      if (conn) conn.rollback()
      return [err]
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getFacturasByProveedor(idproveedor){
    let conn = undefined
    console.log("Consultando facturas por proveedor:",idproveedor)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let extra = idproveedor !== '' ? `and tp.idx = ${idproveedor}` : ''
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
        WHERE 1=1 ${extra} LIMIT 100
        `,[idproveedor])
      return result 
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
      // return 0
    }
  }
  static async getFacturasByPedido(idpedido){
    let conn = undefined
    console.log("Consultando facturas por proveedor:",idpedido)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let extra = idpedido !== '' ? `and tpic.idx = ${idpedido}` : ''
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
        WHERE 1=1 ${extra} LIMIT 100
        `,[idpedido])
      return result 
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
      // return 0
    }
  }
  static async getPedidosByProveedor(idproveedor){
    let conn = undefined
    console.log("Consultando facturas por proveedor:",idproveedor)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      // let extra = (search !== '' && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(orden_ref),' ',TRIM(proveedor),' ',TRIM(produccion),' ',TRIM(estado))) > 0").join(" ") : ""

      const [results] = await conn.query(`
        SELECT 
          cc.idx,
          cc.orden_ref,
          cc.tipo,
          cc.proveedor,
          cc.fec_emision,
          cc.fec_retorno,
          cc.tiempo_produccion,
          cc.dias_pendientes,
          cc.forma_pago,
          cc.estado,
          sum(cc.cantidad) as cantidad,
          sum(cc.importe) as importe,
          sum(cc.despacho) as despacho,
          sum(cc.cancelado) as cancelado,
          sum(if(cc.facturado = 0,cc.importe_sugerido,cc.importe_despacho)) as importe_despacho
        FROM
        (
          select
          tpic.idx,
          tpic.orden_ref,
          tpic.tipo,
          tpic.proveedor,
          tpic.fec_emision,
          tpic.fec_retorno,
          COALESCE(DATEDIFF(tpic.fec_retorno,tpic.fec_emision),'') as tiempo_produccion,
          COALESCE(DATEDIFF(STR_TO_DATE(tpic.fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
          tpic.forma_pago,
          tpic.estado,
          tdc.facturado,
          (
            SELECT SUM(COALESCE(cantidad,0)) FROM tbl2_pedidos_insumos_det tpid 
            WHERE tpid.id_pedido_CAB = tpic.idx
          ) as cantidad,
          (
            SELECT SUM(COALESCE(cantidad,0)*COALESCE(precio,0)) FROM tbl2_pedidos_insumos_det tpid 
            WHERE tpid.id_pedido_CAB = tpic.idx
          ) as importe,
          (
            SELECT COALESCE(sum(despacho),0) as despacho FROM tbl2_despachos_cab tdc
            JOIN tbl2_despachos_det tdd ON tdc.idx = tdd.id_despacho_CAB
            WHERE tdc.id_pedido_origen = tpic.idx
          ) as despacho,
          (
            SELECT COALESCE(sum(COALESCE(tlc.importe,0)),0) 
            FROM tbl2_letras_cab tlc 
            JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
            WHERE tla.id_pedido_CAB = tpic.idx
          ) as cancelado,
          (
            select COALESCE(SUM(IF(tda.tipodoc = '2',COALESCE(tda.importe_total,0)*-1,COALESCE(tda.importe_total,0))),0) FROM tbl2_despachos_adi tda
            where tda.id_despacho_CAB = tdc.idx
          ) as importe_despacho,
          (
            select COALESCE(SUM(COALESCE(tdd.precio,0)*COALESCE(tdd.despacho,0)),0) from tbl2_despachos_det tdd
            where tdd.id_despacho_CAB = tdc.idx
          ) as importe_sugerido
          from tbl2_despachos_cab tdc 
          join tbl2_pedidos_insumos_cab tpic on tdc.id_pedido_origen = tpic.idx
          where tdc.tipo like '%PEDIDOS%' and tdc.id_proveedor_CAB = ?
        ) as cc
        group by
        cc.idx,
        cc.orden_ref,
        cc.tipo,
        cc.proveedor,
        cc.fec_emision,
        cc.fec_retorno,
        cc.tiempo_produccion,
        cc.dias_pendientes,
        cc.forma_pago,
        cc.estado
      `,[idproveedor])

      // const [results, fields] = await conn.query(`
      //   SELECT tb1.idx,tb1.orden_ref,tb1.tipo,tb1.proveedor,tb1.fec_emision,tb1.fec_retorno,COALESCE(DATEDIFF(tb1.fec_retorno,tb1.fec_emision),'') as tiempo_produccion,
      //   COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,tb1.forma_pago,tb1.estado,
      //   (
      //     SELECT SUM(COALESCE(cantidad,0)) FROM tbl2_pedidos_insumos_det tpid 
      //     WHERE tpid.id_pedido_CAB = tb1.idx
      //   ) as cantidad,
      //   (
      //     SELECT SUM(COALESCE(cantidad,0)*COALESCE(precio,0)) FROM tbl2_pedidos_insumos_det tpid 
      //     WHERE tpid.id_pedido_CAB = tb1.idx
      //   ) as importe,
      //   (
      //     SELECT COALESCE(sum(despacho),0) as despacho FROM tbl2_despachos_cab tdc
      //     JOIN tbl2_despachos_det tdd ON tdc.idx = tdd.id_despacho_CAB
      //     WHERE tdc.id_pedido_origen = tb1.idx
      //   ) as despacho,
      //   ( 
      //     select COALESCE(SUM(IF(tipodoc = '2',COALESCE(importe_total,0)*-1,COALESCE(importe_total,0))),0) FROM tbl2_despachos_cab tdc
      //     JOIN tbl2_despachos_adi tda ON tda.id_despacho_CAB = tdc.idx
      //     where tdc.id_pedido_origen = tb1.idx 
      //   ) as importe_despacho,
      //   (
      //     SELECT COALESCE(sum(COALESCE(tlc.importe,0)),0) 
      //     FROM tbl2_letras_cab tlc 
      //     JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
      //     WHERE tla.id_pedido_CAB = tb1.idx
      //   ) as cancelado
      //   FROM tbl2_pedidos_insumos_cab tb1
      //   WHERE tb1.id_proveedor_CAB = ? AND tb1.estado <> 'ANULADO'
      //   ORDER BY created_at DESC 
      //   LIMIT 100
      //   `,[idproveedor]);
      
      return results
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
      // return 0
    }
  }
}