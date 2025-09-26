import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class MantenimientoService {
  static async getListaColores(search = '') {
    console.log("Dentro de la consulta lista de colores")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(codigo),''),' ',COALESCE(TRIM(nom),''),' ',COALESCE(TRIM(detalle),''))) > 0").join(" ") : ""

      let query = `SELECT *FROM tbl2_colores where ruc = '20522094120' ${extra} limit 100`
      console.log("La consulta generada es la lsiguiente:", query)
      let [colores] = await conn.query(query);

      return colores
    } catch (err) {
      console.log(err)
      return { ok: false, mensaje: 'Error en la consulta' }
    } finally {
      if(conn) await conn.end()
      // Cualquier limpieza si es necesaria
    }
  }
}