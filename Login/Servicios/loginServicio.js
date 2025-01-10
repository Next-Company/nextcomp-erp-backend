import { connection } from "../../Main/utils.js";
export class LoginModel{
  static async validarLogin({usu,paz}){
    const resp = {ok:false,message:'Credenciales incorrectas'}
    const [results,fields] = await connection.query(
      "SELECT tu.*, now() as current FROM tbl_user tu WHERE tu.usu = ? AND tu.paz = ?",
      [usu,paz]
    )
    console.log('Busquda de usuario :',results)
    if(results.length > 0){
      resp.ok = true
      resp.message = 'Credenciales correctas'
      resp.datos = results[0]
    }else{
      resp.ok = false
      resp.message = 'Credenciales incorrectas'
    }
    return resp
  }
  static async actualizarLogin(){


  }
  static async registrarLogin(){


  }
}
