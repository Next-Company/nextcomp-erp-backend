import { LoginModel } from "../Servicios/loginServicio.js";

export class LoginController{
  static async validarLogin(req,resp){
    try {
      const consulta = await LoginModel.validarLogin()  
      resp
      .cookie('access_token',1,{
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 30
      })
      .send(consulta)
    } catch (error) {
      resp.json(error)
    }
  }
}