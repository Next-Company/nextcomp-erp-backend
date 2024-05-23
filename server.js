import express,{json} from "express";
import { soporteRouter } from "./Soporte/Routers/soporte.js";
import cors from 'cors'

const PORT_DEFAULT = 4000
const app = express()

app.use(json())
app.use(cors())
app.disable('x-powered-by')
app.use('/soporte',soporteRouter)

app.listen(PORT_DEFAULT,()=>{
  console.log('Servidor corriendo en el puerto 4000')
})