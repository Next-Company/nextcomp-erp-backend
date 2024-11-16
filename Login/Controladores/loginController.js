import { SECRET_JWT_KEY, SECRET_JWT_KEY2 } from "../../Main/config.js";
import { jwt } from "../../Main/utils.js";
import { LoginModel } from "../Servicios/loginServicio.js";
// import jwt from 'jsonwebtoken'
export class LoginController {
  static async validarLogin(req, resp) {
    try {
      const info = await LoginModel.validarLogin({ usu: req.body.email, paz: req.body.password })
      if (info.ok) {
        const token = jwt.sign(
          { id: info.datos.idx, username: info.datos.usu, niv: info.datos.niv },
          SECRET_JWT_KEY,
          {
            expiresIn: '1h'
          }
        )
        const token2 = jwt.sign(
          { type: 'refresh' },
          SECRET_JWT_KEY2,
          {
            expiresIn: '24h'
          }
        )
        resp
          .cookie('access_token', token, {
            httpOnly: true,
            // sameSite: 'None',
            // secure:true,
            sameSite: 'strict',
            // domain: 'http:192.168.18.20:5173',
            maxAge: 1000 * 60 * 30
          })
          .cookie('refresh_token', token2, {
            httpOnly: true,
            // sameSite: 'None',
            // secure:true,
            sameSite: 'strict',
            // domain: 'http:192.168.18.20:5173',
            maxAge: 1000 * 60 * 60 * 24
          })
          .send(info)
      } else {
        resp.send(info)
      }

    } catch (error) {
      resp.json(error)
    }
  }
}