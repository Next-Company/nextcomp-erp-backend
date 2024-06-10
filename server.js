import fs from 'node:fs/promises'
import path from 'node:path';
import { fileURLToPath } from 'url';


import express,{json} from "express";
import { soporteRouter } from "./Soporte/Routers/soporte.js";
import cors from 'cors'
import { directorioRouter } from "./Directorio/Routers/directorios.js";
import multer from 'multer';
const PORT_DEFAULT = 4000
const app = express()

app.use(json())
app.use(cors())
app.use(multer().none())
app.disable('x-powered-by')
app.use('/soporte',soporteRouter)
app.use('/directorio',directorioRouter)

app.listen(PORT_DEFAULT,()=>{
  console.log('Servidor corriendo en el puerto 4000')
})