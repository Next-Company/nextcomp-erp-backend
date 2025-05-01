import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class PrestamoService{
  static async getListaPrestamos(){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] =  await conn.query("SELECT *FROM tbl2_prestamos_cab LIMIT 100")
      return result
    } catch (error) {
      if(conn){
        conn.rollback()
        await conn.end()
      }
    } finally{
      if(conn){
        // conn.rollback()
        conn.commit()
        await conn.end()
      }
    }
    return 
  }
  static async getInfoPrestamoById(id){

    return 0
  }
  static async updatePrestamo(data){
    // console.log("La info enviada del frontend:",data,data.info,JSON.parse(data.info))
    // console.log("La detalle enviada del frontend:",data,data.detalle,JSON.parse(data.detalle))
    let conn
    const results = { ok: true, message: 'test' }
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.registros)
    console.log('Info cabecera:', cabecera)
    console.log('Info articulos:', articulos)
    try {
      conn = await mysql.createConnection(config[1])
      await conn.connect()
      conn.beginTransaction()
      
      if(cabecera.idx){
        console.log("Actualizacion de nuevo prestamo")
      }else{
        console.log("Creacion de nuevo prestamo ")
        try {
          const [res, fields] = await conn.query('INSERT INTO tbl2_prestamos_cab(ruc_,tipo_tasa_intereses,id_proveedor_CAB,proveedor,moneda,tcea,plazo_pago,numero_cuotas,fec_solicutud,fec_ultimo_vencimiento,monto_capital,monto_intereses,monto_prestamo,estado_prestamo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', ['20522094120',cabecera.tipo_tasa_intereses,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.moneda,cabecera.tcea,cabecera.plazo_pago,cabecera.numero_cuotas,cabecera.fec_solicutud,cabecera.fec_ultimo_vencimiento,cabecera.monto_capital,cabecera.monto_intereses,cabecera.monto_prestamo,cabecerea.estado_prestamo])

        } catch (err) {
          console.log("error en la consulta", err)
        }

        try {
          let data_insert = articulos.forEach(row=>{
            let row_format = [res.insertId,row.nro_cuota,row.fec_vencimiento,row.monto_cuota]
            data_insert.push(row_format)
          })
          let [result_detail] = await conn.query('INSERT INTO tbl2_prestamos_det(id_prestamo_CAB,nro_cuota,fec_vencimiento,monto_cuota,estado_cuota) VALUES ? ',data_insert)
          
        } catch (error) {
          console.log("error en la consulta", err)
        }
        
  
      }
      
    } catch (error) {
      if(conn){
        conn.rollback()
        await conn.end()
      }
    } finally{
      if(conn){
        // conn.rollback()
        conn.commit()
        await conn.end()
        return results
      }
    }
    // return results
  }
  static async deletePrestamoById(id){
    
    return 0
  }

}