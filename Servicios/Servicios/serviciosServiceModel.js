import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
import { connectBidiOverCdp } from 'puppeteer-core/internal/bidi/BidiOverCdp.js'
export default class ServiciosServiceModel{
  static async getServicios(search = ""){
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      const extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tipo),''),' ',COALESCE(TRIM(orden_ref),''),' ',COALESCE(TRIM(proveedor),''),' ',COALESCE(TRIM(responsable),''),' ',COALESCE(TRIM(destino),''))) > 0").join(" ") : ""

      const [busqueda] = await conn.execute(`SELECT *FROM tbl2_ordenes_servicio_cab WHERE 1=1 ${extra} AND ruc_ = '20522094120' LIMIT 100`)

      return busqueda
    } catch (error) {
      console.log(error)
      throw new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveServicio(data){
    console.log("Dentro del proceso de guardado de la orden del servicio")
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      console.log("Info del formulario:", data)
      const results = { ok: true, message: 'test' }
      const cabecera = JSON.parse(data.info)
      const insumos = JSON.parse(data.insumos)
      const adicionales = JSON.parse(data.adicionales)

      const [d1,fields1] = await conn.query('SELECT *FROM tbl2_ordenes_servicio_cab LIMIT 1')
      const info_sanitized1 = Object.keys(cabecera).reduce((c,v)=>{
        fields1.includes(v) && (c[v] = cabecera[v])
        return c
      },{})
      info_sanitized1['ruc_'] = '20522094120'
      const [res] = await conn.query(`INSERT INTO tbl2_ordenes_servicio_cab(${Object.keys(info_sanitized1).join(',')}) VALUES(${Object.keys(info_sanitized1).map(row=>'NULLIF(?,"")').join(',')})`, Object.values(info_sanitized1))

      const [d2,fields2] = await conn.query('SELECT *FROM tbl2_ordenes_servicio_costosextra LIMIT 1')
      for(let adicional of [...adicionales]){
        adicional = Object.keys(adicional).reduce((c,v)=>{
          fields2.includes(v) && (c[v] = adicional[v])
          return c
        },{})
        adicional['id_ordenservicio_CAB'] = res.insertId
        const [res2] = await conn.query(`INSERT INTO tbl2_ordenes_servicio_costosextra(${Object.keys(adicional).join(',')}) VALUES(${Object.keys(adicional).map(row=>'NULLIF(?,"")').join(',')})`, Object.values(adicional))
      }

      if(conn) conn.commit()
      // if(conn) conn.rollback()
      return results
    } catch (error) {
      if(conn) conn.rollback()
      console.log("Mostrando error:",error)
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async updateServicio(id,info){
    let conn = null
    try {
      conn = await mysql.createConection(configs[1])
      await conn.connect()
      const extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      const [busqueda] = await conn.execute(`SELECT *FROM tbl2_ordenes_servicio_cab WHERE 1=1 ${extra} AND ruc_ = '20522094120' LIMIT 100`)

      return busqueda
    } catch (error) {
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteServicio(id){
    let conn = null
    try {
      conn = await mysql.createConection(configs[1])
      await conn.connect()
      const extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      const [busqueda] = await conn.execute(`SELECT *FROM tbl2_ordenes_servicio_cab WHERE 1=1 ${extra} AND ruc_ = '20522094120' LIMIT 100`)

      return busqueda
    } catch (error) {
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
}