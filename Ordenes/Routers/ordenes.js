import { Router } from "express";
import { OrdenesController } from "../Controladores/ordenes.js";

export const ordenesRouter = Router()

ordenesRouter.get('/getmaterialesproduccion',OrdenesController.getMaterialesProduccion)
ordenesRouter.get('/getfasesproduccion',OrdenesController.getFasesProduccion)
ordenesRouter.get('/getfasesproduccion/:categoria',OrdenesController.getFasesProduccion)
ordenesRouter.get("/getordenes/",OrdenesController.getOrdenes)
ordenesRouter.get("/getordenes/:search",OrdenesController.getOrdenes)
ordenesRouter.get("/getordenescorte/",OrdenesController.getOrdenesCorte)
ordenesRouter.get("/getordenescorte/:search",OrdenesController.getOrdenesCorte)
ordenesRouter.get('/:id', OrdenesController.getOrdenesById) 
ordenesRouter.post("/",OrdenesController.saveInfoOrdenes)
ordenesRouter.post("/getstatusgeneral/:id",OrdenesController.getStatusGeneral)
ordenesRouter.post("/getstatusgeneral2/:id",OrdenesController.getStatusGeneral2)
ordenesRouter.delete('/:id', OrdenesController.deleteOrden)
ordenesRouter.get('/updatecombos/combos', OrdenesController.updateCombos)
ordenesRouter.get('/extraeritemscaja/:id/:id_corte', OrdenesController.ExtraerItemsCaja)

ordenesRouter.post("/saveFaseOrden",OrdenesController.saveFaseOrden)
ordenesRouter.post("/saveFaseMolde",OrdenesController.saveFaseMolde)
ordenesRouter.post("/saveFaseCorte",OrdenesController.saveFaseCorte)

ordenesRouter.get("/lizzet/:id",OrdenesController.regulaLizzet)
ordenesRouter.get("/printsugerido/:idorden",OrdenesController.printSugeridoV3)

