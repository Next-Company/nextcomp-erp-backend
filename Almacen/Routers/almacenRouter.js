import { Router } from "express";
import AlmacenController from "../Controladores/almacenController.js";

const ALMACEN_ROUTER = new Router()

// ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)
ALMACEN_ROUTER.get('/listarmovimientos',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.get('/listarmovimientos/:search',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.get('/listarinventario',AlmacenController.getInventarioProductos)
ALMACEN_ROUTER.get('/listarinventario/:search',AlmacenController.getInventarioProductos)


ALMACEN_ROUTER.get('/getguiamovimiento/:idmov',AlmacenController.getGuia)
ALMACEN_ROUTER.put('/saveguiamovimiento',AlmacenController.saveGuia)
ALMACEN_ROUTER.put('/savemovimiento',AlmacenController.saveMovimiento)
ALMACEN_ROUTER.delete('/deleteguiamov/:idguia',AlmacenController.deleteGuia)


ALMACEN_ROUTER.get('/disponibilidadreq/:idreq',AlmacenController.getDisponibilidadRequerimiento)
ALMACEN_ROUTER.get('/disponibilidadmod/:idmod',AlmacenController.getDisponibilidadModelo)
ALMACEN_ROUTER.get('/getmovimientobyid/:id', AlmacenController.getMovimientosAlmacenById)

ALMACEN_ROUTER.post('/vistapreviaretiro/:tipo', AlmacenController.VistaPreviaRetiro)
ALMACEN_ROUTER.get('/infocuadretelas/:idmov',AlmacenController.getInfoCuadreTelas)
ALMACEN_ROUTER.put('/updateinfocuadretelas/:idmov',AlmacenController.updateInfoCuadreTelas)
ALMACEN_ROUTER.delete('/deleteinfocuadretelas/:idmov',AlmacenController.deleteInfoCuadreTelas)

export default ALMACEN_ROUTER