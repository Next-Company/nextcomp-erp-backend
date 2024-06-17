import fs from 'node:fs/promises'
import path from 'node:path';
import { fileURLToPath } from 'url';

import express,{json} from "express";
import cookieParser from "cookie-parser";
import { soporteRouter } from "./Soporte/Routers/soporte.js";
import { directorioRouter } from "./Directorio/Routers/directorios.js";
import { loginRouter } from './Login/Routers/loginRouter.js';
import cors from 'cors'
import multer from 'multer';
const PORT_DEFAULT = 4000
const app = express()

app.use(json())
app.use(cors({
  origin: 'http://localhost:5173', // Cambia esto al dominio de tu frontend
  credentials: true
}))
app.use(cookieParser())
app.use(multer().none())
app.disable('x-powered-by')
app.use('/login',loginRouter)
app.use('/soporte',soporteRouter)
app.use('/directorio',directorioRouter)

app.listen(PORT_DEFAULT,()=>{
  console.log('Servidor corriendo en el puerto 4000')
})