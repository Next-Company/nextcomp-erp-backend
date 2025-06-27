import { Router } from "express";
import { OrdenesController } from "../Controladores/ordenes.js";

export const ordenesRouter = Router()

ordenesRouter.get("/getordenes/",OrdenesController.getOrdenes)
ordenesRouter.get("/getordenes/:search",OrdenesController.getOrdenes)
ordenesRouter.get('/:id', OrdenesController.getOrdenesById) 
ordenesRouter.post("/",OrdenesController.saveInfoOrdenes)
ordenesRouter.post("/getstatusgeneral/:id",OrdenesController.getStatusGeneral)
ordenesRouter.delete('/:id', OrdenesController.deleteOrden)
ordenesRouter.get('/updatecombos/combos', OrdenesController.updateCombos)


ordenesRouter.post("/saveFaseOrden",OrdenesController.saveFaseOrden)
ordenesRouter.post("/saveFaseMolde",OrdenesController.saveFaseMolde)
ordenesRouter.post("/saveFaseCorte",OrdenesController.saveFaseCorte)