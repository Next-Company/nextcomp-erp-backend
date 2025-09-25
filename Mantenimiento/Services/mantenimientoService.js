import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class MantenimientoService {
  static async getListaColores(search = '') {
    const conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [colores] = await conn.query("SELECT *FROM tbl2_colores where ruc = '20522094120' limit 100");

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