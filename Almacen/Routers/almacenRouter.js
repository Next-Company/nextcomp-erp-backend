import { Router } from "express";
import AlmacenController from "../Controladores/almacenController.js";

const ALMACEN_ROUTER = new Router()

// ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)
ALMACEN_ROUTER.get('/listarmovimientos',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.get('/listarmovimientos/:search',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.get('/listarinventario',AlmacenController.getInventarioProductos)
ALMACEN_ROUTER.put('/saveguiamovimiento',AlmacenController.saveGuia)
ALMACEN_ROUTER.delete('/deleteguiamov/:idguia',AlmacenController.deleteGuia)
ALMACEN_ROUTER.get('/disponibilidadreq/:idreq',AlmacenController.getDisponibilidadRequerimiento)
ALMACEN_ROUTER.post('/getmovimientobyid/:id', AlmacenController.getMovimientosAlmacenById)
ALMACEN_ROUTER.post('/vistapreviaretiro/:tipo', AlmacenController.VistaPreviaRetiro)

export default ALMACEN_ROUTER