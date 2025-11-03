import { Router } from "express";
import MantenimientoController from "../Controllers/mantenimientoController.js";

const MANTENIMIENTO_ROUTER = Router()

MANTENIMIENTO_ROUTER.get('/getlistacolores',MantenimientoController.getListaColores)
MANTENIMIENTO_ROUTER.get('/getlistacolores/:search',MantenimientoController.getListaColores)

export default MANTENIMIENTO_ROUTER