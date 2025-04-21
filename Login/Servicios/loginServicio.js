import { connection } from "../../Main/utils.js";
import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise"
export class LoginModel {
  static async validarLogin({ usu, paz }) {
    let conn = undefined
    const resp = { ok: false, message: 'Credenciales incorrectas' }

    conn = await mysql.createConnection(configs[1])

    await conn.connect()
    const [results, fields] = await conn.query(
      "SELECT tu.*, now() as current FROM tbl_user tu WHERE tu.usu = ? AND tu.paz = ?",
      [usu.split('@')[0], paz]
    )
    // const [results,fields] = await connection.query(
    //   "SELECT tu.*, now() as current FROM tbl_user tu WHERE tu.usu = ? AND tu.paz = ?",
    //   [usu,paz]
    // )
    console.log('Busquda de usuario :', results)
    if (results.length > 0) {
      resp.ok = true
      resp.message = 'Credenciales correctas'
      resp.datos = results[0]
    } else {
      resp.ok = false
      resp.message = 'Credenciales incorrectas'
    }
    return resp
  }
  static async actualizarLogin() {


  }
  static async registrarLogin() {


  }
}
