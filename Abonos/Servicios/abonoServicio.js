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
  static async getAbono(idabono){
    let conn
    try {
      console.log("Llegando a getAbonao",idabono)
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      let infodet = undefined
      let [infocab] = await conn.execute(`SELECT ta.*,tp.idx as id_proveedor_CAB,tp.nom as proveedor FROM tbl2_abonos ta left join tbl2_proveedor tp on tp.idx = ta.id_proveedor where ta.ruc_ = '20522094120' and ta.idx = ?`, [idabono])
      console.log("Informacion cabecera:",infocab)
      if(infocab[0].tipo == 'SERV'){
        [infodet] = await conn.execute(`
          select tc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo,sum(tgtd.cantidad*tgtc.costo) as importe 
          from tbl2_conciliaciones tc 
          join tbl2_guias_traslado_cab tgtc on tgtc.idx = tc.id_servicio_CAB 
          join tbl2_guias_traslado_det tgtd on tgtd.id_guia_CAB = tgtc.idx
          where tc.id_abono_CAB = ?
          group by tc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo`
          , [idabono])
      }else{
        // let [infodet] = await conn.execute(`select *from tbl2_conciliaciones tc join tbl2_guias_traslado_cab tgtc on tgtc.idx = tc.id_servicio_CAB where tc.id_abono_CAB = ?`, [idabono])
      }
      console.log("INformacion total:",[infocab[0],infodet])

      await conn.end()
      return [infocab[0],infodet]
    } catch (error) {
      console.log(error)
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
    console.log("EMpezamos el registro o la actualizacioxn")
    // return results
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      // if(data.id){
      if(data.id){
        await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion,parseInt(data.id)])

        const [res,fld] = await conn.query("SELECT *FROM tbl2_conciliaciones WHERE id_abono_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) )
        const insert = async ()=>{
          const fila = articulos.shift()
          if(fila){
            if(!fila.idx || fila.idx == ''){
              const [results,fields] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_servicio_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',fila.idx,parseInt(data.id)]);
            }
            await insert()
          }else{
            return Promise.resolve('')
          }
        }
        await insert()
        const eliminar = async ()=>{
          console.log("Dentro de elimiado")
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_conciliaciones` WHERE `id_abono_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar()

      }else{        
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion])

          const insert = async ()=>{
            const fila = articulos.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_servicio_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',fila.idx,res.insertId]);

              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()

        }catch(err){
          console.log("error en la consulta",err)
        }
      }
      console.log("Terminando consultas")
      // await conn.end();
      return {ok:true,message:'Se ha guardado el registros'}

    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) {
        console.log(err)
        conn.rollback()
        await conn.end();
      }
      return [err]
    } finally {
      if (conn) {
        conn.commit()
        // conn.rollback()
        await conn.end();
      }
    }
  }
  static async deleteAbono(idabono){
    let conn
    let resp
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()
      await conn.query('DELETE FROM tbl2_abonos WHERE idx = ?',[idabono])
      await conn.query(`DELETE FROM tbl2_conciliaciones WHERE ruc_ = ? and id_abono_CAB = ?`,['20522094120',idabono])

      // await conn.end()
      conn.commit()
      resp = {ok:true,message:'Se ha eliminado el registro'}
    } catch (error) {
      resp = error
      if(conn) conn.rollback()
    } finally {
      if(conn) conn.end()
      return resp

    }
  }
}