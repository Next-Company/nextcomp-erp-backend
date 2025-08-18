import { Router } from "express";
import AlmacenController from "../Controladores/almacenController.js";

const ALMACEN_ROUTER = new Router()

ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)
ALMACEN_ROUTER.get('/listarmovimientos',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.put('/saveguiamovimiento',AlmacenController.saveGuia)

export default ALMACEN_ROUTER