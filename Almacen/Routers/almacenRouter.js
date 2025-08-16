import { Router } from "express";
import AlmacenController from "../Controladores/almacenController.js";

const ALMACEN_ROUTER = new Router()

ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)

export default ALMACEN_ROUTER