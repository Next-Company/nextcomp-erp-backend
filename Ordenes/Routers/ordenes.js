import { Router } from "express";
import { OrdenesController } from "../Controladores/ordenes.js";

export const ordenesRouter = Router()

ordenesRouter.get("/getPlantillasTallas",OrdenesController.getPlantillasTallas)
ordenesRouter.get('/getmaterialesproduccion',OrdenesController.getMaterialesProduccion)
ordenesRouter.get('/getfasesproduccion',OrdenesController.getFasesProduccion)
ordenesRouter.get('/getfasesproduccion/:categoria',OrdenesController.getFasesProduccion)
ordenesRouter.get("/getordenes/",OrdenesController.getOrdenes)
ordenesRouter.get("/getordenes/:search",OrdenesController.getOrdenes)
ordenesRouter.get("/getordenescorte/",OrdenesController.getOrdenesCorte)
ordenesRouter.get("/getordenescorte/:search",OrdenesController.getOrdenesCorte)

ordenesRouter.get("/getordenesfull/",OrdenesController.getOrdenesFull)
ordenesRouter.get("/getordenesfull/:search",OrdenesController.getOrdenesFull)

ordenesRouter.get('/:id', OrdenesController.getOrdenesById) 
ordenesRouter.post("/",OrdenesController.saveInfoOrdenes)
ordenesRouter.post("/getstatusgeneral/:id",OrdenesController.getStatusGeneral)
ordenesRouter.post("/getstatusgeneral2/:id",OrdenesController.getStatusGeneral2)
ordenesRouter.delete('/:id', OrdenesController.deleteOrden)
ordenesRouter.get('/updatecombos/combos', OrdenesController.updateCombos)
// ordenesRouter.get('/extraeritemscaja/:id/:id_corte', OrdenesController.ExtraerItemsCaja)
// ordenesRouter.get('/extraermodelosdisponible/:id', OrdenesController.ExtraerModelosDisponible)
ordenesRouter.get('/extraerdisponible/:id', OrdenesController.ExtraerDisponible)
ordenesRouter.get('/extraerdisponible/:id/:id_corte', OrdenesController.ExtraerDisponible)

ordenesRouter.post("/saveFaseOrden",OrdenesController.saveFaseOrden)
ordenesRouter.put("/updateFaseOrden",OrdenesController.updateFaseOrden)
ordenesRouter.put("/saveFaseMolde",OrdenesController.saveFaseMolde)
ordenesRouter.put("/saveFaseCorte",OrdenesController.saveFaseCorte)
ordenesRouter.put("/saveFaseMateriales",OrdenesController.saveFaseMateriales)
ordenesRouter.put("/saveFaseFraccionamiento",OrdenesController.saveFaseFraccionamiento)
ordenesRouter.put("/updateSkuModels/:idorden",OrdenesController.updateSkuModels)
ordenesRouter.put("/saveFasePrecios",OrdenesController.saveFasePrecios)

ordenesRouter.get("/lizzet/:id",OrdenesController.regulaLizzet)
ordenesRouter.get("/printhojacorte/:idorden",OrdenesController.printHojaCorte)
// ordenesRouter.get("/printsugerido/:idorden",OrdenesController.printSugeridoV3)
ordenesRouter.get("/insumosorden/:idorden/:idalmacen",OrdenesController.getInsumosOrden)

ordenesRouter.get("/getCorrelativoProduccionPreview/:tipo",OrdenesController.getCorrelativoProduccionPreview)

