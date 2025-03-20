import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class AbonoServicio{
  static async getAbonosList(limit){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      let [rows] = await conn.execute(`SELECT * FROM tbl2_abonos where ruc_ = '20522094120' LIMIT ?`, [limit])
      await conn.end()
      return rows
    } catch (error) {
      
    } finally {
      if(conn) conn.end()
    }
  }
  static async getSaldosServicios(idproveedor){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      let [rows] = await conn.execute(`SELECT tgtc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo,sum(tgtd.cantidad*tgtc.costo) as importe,0 as saldo from tbl2_guias_traslado_cab tgtc 
      JOIN tbl2_guias_traslado_det tgtd ON tgtc.idx = tgtd.id_guia_CAB 
      WHERE tgtc.id_proveedor_CAB = ? GROUP BY tgtc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo`,[idproveedor])
      await conn.end()
      return rows
    } catch (error) {
      console.log(error)   
    } finally {
      if(conn) conn
    }
  }
  static async saveAbono(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    // return results
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()
      if(data.id){
        // await conn.query('UPDATE tbl2_despachos_cab SET fec_emision_guia=NULLIF(?, ""),fec_despacho=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),id_guia_origen=NULLIF(?, ""),nro_guia_origen=NULLIF(?, ""),id_pedido_origen=NULLIF(?, ""),nro_pedido_origen=NULLIF(?, ""),observaciones=NULLIF(?, ""),nro_guia=NULLIF(?, ""),nro_factura=NULLIF(?, ""),imp_factura=NULLIF(?, "") WHERE idx = ?',[cabecera.fec_emision_guia,cabecera.fec_despacho,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.id_guia_origen,cabecera.nro_guia_origen,cabecera.id_pedido_origen,cabecera.nro_pedido_origen,cabecera.observaciones,cabecera.nro_guia,cabecera.nro_factura,cabecera.imp_factura,parseInt(data.id)])

        // const [res,fld] = await conn.query("SELECT *FROM tbl2_despachos_det WHERE id_despacho_CAB = "+ parseInt(data.id))
        // const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 

        // const insert = async ()=>{
        //   const fila = articulos.shift()
        //   if(fila){
        //     if(fila.idx && fila.idx !== ''){
        //       const [results, fields] = await conn.query('UPDATE tbl2_despachos_det SET precio=NULLIF(?, ""),despacho=NULLIF(?, ""),caidos=NULLIF(?, "") WHERE id_item = ? and id_despacho_CAB = ?',[fila.precio,fila.despacho,fila.caidos,fila.idx,parseInt(data.id)]);
        //     }else{
        //       const [results,fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.id_item,fila.despacho,fila.caidos]);
        //     }
        //     await insert()
        //   }else{
        //     console.log("Devolviendo resolve")
        //     return Promise.resolve('')
        //   }
        // }
        // await insert()
        // const eliminar = async ()=>{
        //   const fila = ids_delete.shift()
        //   if(fila){
        //     await conn.query('DELETE FROM `tbl2_despachos_det` WHERE `id_despacho_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
        //     await eliminar()
        //   }else{
        //     return Promise.resolve('')
        //   }
        // }
        // await eliminar()
      }else{
        // console.log("La info de cabecera es:",cabecera)
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_documento_ref,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.documento_ref,cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe])

          const insert = async ()=>{
            const fila = articulos.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,precio,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.idx,fila.precio,parseFloat(fila.despacho),parseFloat(fila.caidos)]);

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
        return {ok:true,message:'Se ha guardado el registro'}
      }

    } catch (err) {
      if (conn) {
        console.log(err)
        conn.rollback()
        await conn.end();
      }
      return [err]
    } finally {
      if (conn) {
        console.log("Terminando consultas")
        // conn.commit()
        conn.rollback()
        await conn.end();
      }
    }
  }
}