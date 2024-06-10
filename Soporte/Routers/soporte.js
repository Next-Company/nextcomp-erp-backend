import { Router } from "express";
import { SoporteController } from "../Controladores/soporte.js";

export const soporteRouter = Router()
// console.log(SoporteController.getAll())
soporteRouter.get('/',SoporteController.getAll)
soporteRouter.post('/',SoporteController.pushItems)
soporteRouter.put('/:id/:data',SoporteController.updateItems)
soporteRouter.delete('/:id',SoporteController.deleteItems)