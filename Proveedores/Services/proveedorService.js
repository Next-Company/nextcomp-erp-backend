import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
export default class ProveedorService{
  static async getListaProveedores(search = ''){
    console.log("Dentro de la consulta lista de proveeores")
    // Lógica para obtener la lista de proveedores desde la base de datos
    // Puedes usar el parámetro 'search' para filtrar los resultados si es necesario
    let conn = undefined
    conn = await mysql.createConnection(configs[1])
    await conn.connect()
    const [proveedores] = await conn.query("SELECT * FROM tbl2_proveedor WHERE ruc_ = ? LIMIT 60",['20522094120']);
    if(conn) await conn.end()
    return proveedores;
  }
}