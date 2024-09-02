// import fs from 'node:fs/promises'
// import path from 'node:path';
// import { fileURLToPath } from 'url';

import express, { json } from "express";
import cookieParser from "cookie-parser";
import { soporteRouter } from "./Soporte/Routers/soporte.js";
import { directorioRouter } from "./Directorio/Routers/directorios.js";
import { loginRouter } from './Login/Routers/loginRouter.js';
import { homeRouter } from './Home/Routers/home.js';
import cors from 'cors'
import multer from 'multer';
import { PORT_DEFAULT, SECRET_JWT_KEY, SECRET_JWT_KEY2, ORIGINS } from './Main/config.js';
import { jwt } from './Main/utils.js';
const app = express()

app.use(json())
app.use(cors({
  origin: ORIGINS,
  credentials: true
}))
app.use(cookieParser())
app.use(multer({ dest: 'uploads/' }).single('filenext'))
app.disable('x-powered-by')

app.use((req, resp, next) => {
  const token = req.cookies.access_token
  const token2 = req.cookies.refresh_token
  req.session = { user: null }
  // console.log(token2)
  console.log(req.url)
  if (req.url !== '/login') {
    console.log("success", req.url)
    try {
      const data = jwt.verify(token, SECRET_JWT_KEY)
      const data2 = jwt.verify(token2, SECRET_JWT_KEY2)
      // console.log(data)
      req.session = { id: data.id, username: data.username, niv: data.niv }
      const new_token = jwt.sign(
        { id: data.id, username: data.username, niv: data.niv },
        SECRET_JWT_KEY,
        {
          expiresIn: '30m'
        }
      )
      resp.cookie('access_token', new_token, {
        httpOnly: true,
        // sameSite: 'None',
        // secure:true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 30
      })
      next()
    } catch (error) {
      console.log("Error:" + error)
      let info = {
        ok: false,
        message: 'Expiro el token de session.'
      }
      resp.status(401).send(info)
    }
  } else {
    next()
  }

})

app.use('/login', loginRouter)
app.use('/home', homeRouter)
app.use('/soporte', soporteRouter)
app.use('/directorio', directorioRouter)

app.listen(PORT_DEFAULT, () => {
  console.log('Servidor corriendo en el puerto 4000')
})