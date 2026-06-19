import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise"
import bcrypt from 'bcryptjs'

export class LoginModel {
  static async validarLogin({ usu, paz }) {
    let conn = undefined
    const resp = { ok: false, message: 'Credenciales incorrectas' }

    conn = await mysql.createConnection(configs[1])
    await conn.connect()

    const [results] = await conn.query(
      `SELECT tu.*, now() as current, t2.modules
      FROM tbl_user tu
      JOIN tbl_user_modules_access t2 ON tu.idx = t2.id_user
      WHERE tu.usu = ?`,
      [usu.split('@')[0]]
    )

    await conn.end()

    if (!results.length) return resp

    const user = results[0]
    // DEPLOYMENT DEPENDENCY: scripts/migrate-passwords.js must be run before this code goes live.
    // If the migration has not run, ALL logins will fail.
    const valid = await bcrypt.compare(paz, user.paz)
    if (!valid) return resp

    resp.ok = true
    resp.message = 'Credenciales correctas'
    resp.datos = user
    return resp
  }

  static async actualizarLogin() {}
  static async registrarLogin() {}
}
