import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
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
  static async saveServicio(info){
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