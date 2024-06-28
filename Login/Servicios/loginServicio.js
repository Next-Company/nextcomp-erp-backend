import { connection } from "../../Main/utils.js";
export class LoginModel{
  static async validarLogin({usu,paz}){
    const resp = {ok:false,message:'Credenciales incorrectas'}
    const [results,fields] = await connection.query(
      "SELECT *FROM tbl_user WHERE usu = ? AND paz = ?",
      [usu,paz]
    )
    if(results.length > 0){
      resp.ok = true
      resp.message = 'Credenciales correctas'
      resp.datos = results[0]
    }
    return resp
  }
  static async actualizarLogin(){


  }
  static async registrarLogin(){


  }
}
