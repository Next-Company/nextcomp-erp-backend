import { Router } from "express";
import { SoporteController } from "../Controladores/soporte.js";

export const soporteRouter = Router()
// console.log(SoporteController.getAll())
soporteRouter.get('/',SoporteController.getAll)