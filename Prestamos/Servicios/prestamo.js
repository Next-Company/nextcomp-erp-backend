import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class PrestamoService {
  static async getListaPrestamos() {
    //console.log("Obteniendo listado de prestamos")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.query(`
        SELECT 
          tb1.*,
          (
            SELECT COALESCE(sum(ta.importe),0) FROM tbl2_abonos ta 
            JOIN tbl2_conciliaciones tc ON ta.idx = tc.id_abono_CAB
            JOIN tbl2_prestamos_det tpd on tpd.idx = tc.id_prestamo_CAB
            WHERE tpd.id_prestamo_CAB = tb1.idx
          ) as abono,
          DATE_FORMAT(fec_solicitud,'%d/%m/%Y') as fec_solicitud_prestamo
        FROM tbl2_prestamos_cab tb1
        ORDER BY tb1.created_at DESC
        LIMIT 100
      `)
      return result
    } catch (error) {
      if (conn) {
        conn.rollback()
        await conn.end()
      }
    } finally {
      if (conn) {
        // conn.rollback()
        conn.commit()
        await conn.end()
      }
    }
    return
  }
  static async getInfoPrestamoById_back06052025(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()

      let [info_cab] = await conn.query("SELECT *FROM tbl2_prestamos_cab WHERE idx = ?",[id])
      let [info_det] = await conn.query("select *from tbl2_prestamos_det where id_prestamo_CAB = ?",[id])

      conn.commit()
    } catch (error) {
      if(conn){
        await conn.end()
      }
    } finally{
      if(conn){
        await conn.end()
        return {message:'Consulta ejecutada',error:''}
      }
    }
  }
  static async getInfoPrestamoById(idprestamo) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()

      let [info_cab] = await conn.query("SELECT *FROM tbl2_prestamos_cab WHERE idx = ?",[idprestamo])
      let [info_det] = await conn.query("select *from tbl2_prestamos_det where id_prestamo_CAB = ?",[idprestamo])

      //console.log("La informacion consultada es la siguiente:",info_cab,info_det)

      conn.commit()
      return {code:1,msg:'Proceso ejecuta con exito',data:{cab:info_cab,det:info_det}}
    } catch (error) {
      conn.rollback()
      return {code:0,msg:'Se producjo un error en la consulta',data:{}}
    } finally{
      if(conn){
        await conn.end()
      }
    }
  }
  static async updatePrestamo(data) {
    //console.log("La info que llega del fronted:",data)
    let conn
    const results = { ok: true, message: 'test' }
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.registros)
    //console.log('Info cabecera:', cabecera)
    //console.log('Info articulos:', articulos)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()

      if (data.id) {
        //console.log("Actualizacion de nuevo prestamos")
        try {

          let [rows,fields] = await conn.query("select *from tbl2_prestamos_det")                                                                                                                             
          let list_articulos_update = [];
          let list_articulos_insert = [];
          let list_articulos_delete = [];

          const new_fields = fields.map(row=>row.name).filter(column=>!['created_at','updated_at','estado_cuota'].includes(column))

          await conn.query('UPDATE tbl2_prestamos_cab SET id_proveedor_CAB=NULLIF(?, ""),tipo_tasa_interes=NULLIF(?, ""),proveedor=NULLIF(?, ""),id_cliente_CAB=NULLIF(?, ""),cliente=NULLIF(?, ""),moneda=NULLIF(?, ""),tcea=NULLIF(?, ""),plazo_pago=NULLIF(?, ""),numero_cuotas=NULLIF(?, ""),fec_solicitud=NULLIF(?, ""),fec_ultimo_vencimiento=NULLIF(?, ""),monto_capital=NULLIF(?, ""),monto_intereses=NULLIF(?, ""),monto_prestamo=NULLIF(?, ""),estado_prestamo=NULLIF(?, ""),observaciones=NULLIF(?, "") WHERE idx = ?', [cabecera.id_proveedor_CAB, cabecera.tipo_tasa_interes, cabecera.proveedor, cabecera.id_cliente_CAB, cabecera.cliente, cabecera.moneda, cabecera.tcea, cabecera.plazo_pago, cabecera.numero_cuotas, cabecera.fec_solicitud, cabecera.fec_ultimo_vencimiento, cabecera.monto_capital, cabecera.monto_intereses, cabecera.monto_prestamo, cabecera.estado_prestamo, cabecera.observaciones, parseInt(data.id)])
  
          let info_sanitized = articulos.map((propiedad,key)=>{
            let new_object = new_fields.reduce((row,field)=>{
              row[field] = (field == 'cantidad' ?  parseInt(propiedad[field]) : propiedad[field])
              return row
            },{})
            return new_object
          })
          //console.log("Info detalla prestamo sanitized:", info_sanitized)

          let keys_ = info_sanitized.filter(row=>row.idx).map(row=>{return row.idx})

          list_articulos_delete = rows.filter(row=>!keys_.includes(row.idx)).map(row=>{return row.idx})
          list_articulos_update = info_sanitized.filter(row=>row.idx && row.idx !== '').map(row=>{return row.idx})
          list_articulos_insert = info_sanitized.filter(row=>!row.idx)

          //console.log("Mastedes de arrays :",list_articulos_delete,list_articulos_update,list_articulos_insert)

          ////////////////////////////////////
          // COMIENZA EL ELIMINADO DE DATOS
          ////////////////////////////////////
          if(list_articulos_delete.length > 0){
            //console.log("Ejecutando eliminado de datos")
            let [delete_result] = await conn.query("DELETE FROM tbl2_prestamos_det WHERE idx in ("+ list_articulos_delete.join(',') +")")
          }
    
          ////////////////////////////////////
          // COMIENZA EL INSERTADO DE DATOS
          ////////////////////////////////////
          if(list_articulos_insert.length > 0){
            //console.log("Ejecutando insertado de datos")
            let values_insert = []
            list_articulos_insert.forEach(item=>{
              values_insert.push([data.id,item.nro_cuota,item.fec_vencimiento,item.monto_cuota])
            })
            try {
              await conn.query("INSERT INTO tbl2_prestamos_det(id_prestamo_CAB,nro_cuota,fec_vencimiento,monto_cuota) VALUES ?",[values_insert])
            } catch (error) {
              //console.log("Error al insertar registros:",error)
            }
          }
    
          ////////////////////////////////////
          // COMIENZA EL ACTUALIZADO DE DATOS
          ////////////////////////////////////
          if(list_articulos_update.length > 0){
            //console.log("Ejecutando actualizado de datos")
            try {
              //console.log("Acualizado sanitized:",info_sanitized,list_articulos_update  )
              let base_update = info_sanitized.filter(row=>list_articulos_update.includes(row.idx))
              let lista_case = [], texto = ''
              let condicional1 = `CASE `
              let base = ['nro_cuota','fec_vencimiento','monto_cuota']

              //console.log("Comienza el for each :",base_update)

              // base_update [{idx:...},{idx:...}]
              // base ['nro_cuota','fec_vencimiento','monto_cuota']

              // --
              // update table 
              //   set 
              //     campo1 = case when idx = 1 then valor1 when idx = 2 then valor2 else campo 1,
              //     campo2 = case when idx = 1 then valor1 when idx = 2 then valor2 else campo 1
              //     campo3 = case when idx = 1 then valor1 when idx = 2 then valor2 else campo 1
              //     .
              //     .
              //     .
              // where id_foreing = 22
              // --
              let acumulado = []
              base.forEach(campo=>{
                let text = `${campo} = CASE `
                base_update.forEach(row=>{
                  text += `WHEN idx = ${parseInt(row['idx'])} THEN '${row[campo]}' `
                })
                text += `ELSE ${campo} END`
                acumulado.push(text)
              })

              const query_update = `UPDATE tbl2_prestamos_det SET ${acumulado.join(',')} WHERE id_prestamo_CAB = ?`
              //console.log("Query final",query_update)
              await conn.query(query_update,[data.id])

            } catch (error) {
              //console.log("Errors proceso update :",error)
            }
          }
        
        } catch (error) {
          //console.log(error)
        }
          
        // let base_update = info_sanitized.filter(row=>articulos.includes(row.idx))
        // try {
        //   let condicional = `CASE `
        //   base_update.forEach(row=>{
        //     condicional += `WHEN idx = ${row['idx']} THEN ${parseInt(row['cantidad'])} `
        //   })
        //   condicional += ' ELSE cantidad END'
        //   //console.log("La condicional consolidada es :", condicional)
        // } catch (error) {
        //   //console.log("Errors proceso update :",error)
        // }

      } else {
        //console.log("Creacion de nuevo prestamo ")
        try {
          const [res, fields] = await conn.query('INSERT INTO tbl2_prestamos_cab(ruc_,tipo_tasa_interes,id_proveedor_CAB,proveedor,id_cliente_CAB,cliente,moneda,tcea,plazo_pago,numero_cuotas,fec_solicitud,fec_ultimo_vencimiento,monto_capital,monto_intereses,monto_prestamo,estado_prestamo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', ['20522094120', cabecera.tipo_tasa_interes, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.id_cliente_CAB, cabecera.cliente, cabecera.moneda, cabecera.tcea, cabecera.plazo_pago, cabecera.numero_cuotas, cabecera.fec_solicitud, cabecera.fec_ultimo_vencimiento, cabecera.monto_capital, cabecera.monto_intereses, cabecera.monto_prestamo, cabecera.estado_prestamo])

          let data_insert = []
          articulos.forEach(row => {
            let row_format = [res.insertId, row.nro_cuota, row.fec_vencimiento, row.monto_cuota]
            data_insert.push(row_format)
          })
          //console.log(data_insert)
          let [result_detail] = await conn.query('INSERT INTO tbl2_prestamos_det(id_prestamo_CAB,nro_cuota,fec_vencimiento,monto_cuota) VALUES ? ', [data_insert])

        } catch (err) {
          //console.log("error en la consulta", err)
        }
      }
      
      if (conn) conn.commit()
      // if (conn) conn.rollback()
      return {ok:true,message:'Proceso de registro de prestamo exitoso'} 
    } catch (error) {
      if (conn) conn.rollback()
      // return {msg:error}
      return error
    } finally {
      if (conn) await conn.end()
    }
  }
  static async deletePrestamoById(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()
      //console.log('Empieza el proceso de eliminado de :',id)  
      await conn.query("DELETE tb1,tb2 FROM tbl2_prestamos_cab tb1 JOIN tbl2_prestamos_det tb2 ON tb1.idx = tb2.id_prestamo_CAB WHERE tb1.idx = ?",[id])

      conn.commit()
      // conn.rollback()
      return 'Datos eliminados de forma correcta'
    } catch (error) {
      //console.log(error)
      if(conn){
        conn.rollback()
      }
      return 'Se produjo un error durante la ejecucion del proceso de eliminado'
    } finally {
      if(conn){
        await conn.end()
      }
    }
  }
}