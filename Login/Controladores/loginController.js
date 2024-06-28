import { SECRET_JWT_KEY } from "../../Main/config.js";
import { jwt } from "../../Main/utils.js";
import { LoginModel } from "../Servicios/loginServicio.js";
// import jwt from 'jsonwebtoken'
export class LoginController{
  static async validarLogin(req,resp){
    try {
      const info = await LoginModel.validarLogin({usu:req.body.email,paz:req.body.password})
      const token = jwt.sign(
        {id:info.datos.idx,username:info.datos.nom},
        SECRET_JWT_KEY,
        {
          expiresIn: '1h'
        }
      )
      resp
      .cookie('access_token',token,{
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 30
      })
      .send(info)
    } catch (error) {
      resp.json(error)
    }
  }
}