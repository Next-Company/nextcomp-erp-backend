import { Router } from "express";
import { OrdenesController } from "../Controladores/ordenes.js";

export const ordenesRouter = Router()

ordenesRouter.get("/",OrdenesController.getOrdenes)
ordenesRouter.get('/:id', OrdenesController.getOrdenesById) 
ordenesRouter.post("/",OrdenesController.saveInfoOrdenes)
ordenesRouter.post("/getstatusgeneral/:id",OrdenesController.getStatusGeneral)
ordenesRouter.delete('/:id', OrdenesController.deleteOrden)