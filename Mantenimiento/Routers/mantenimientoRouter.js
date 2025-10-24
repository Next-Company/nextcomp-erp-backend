import { Router } from "express";
import MantenimientoController from "../Controllers/mantenimientoController.js";

const MANTENIMIENTO_ROUTER = Router()

MANTENIMIENTO_ROUTER.get('/getlistacolores',MantenimientoController.getListaColores)
MANTENIMIENTO_ROUTER.get('/getlistacolores/:search',MantenimientoController.getListaColores)
MANTENIMIENTO_ROUTER.get('/getlistatallas',MantenimientoController.getListaTallas)
MANTENIMIENTO_ROUTER.get('/getlistatallas/:search',MantenimientoController.getListaTallas)

export default MANTENIMIENTO_ROUTER