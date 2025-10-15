import { Router } from "express"
import CajaController from "../Controladores/caja.js"
export const CAJA_ROUTER = Router()

CAJA_ROUTER.get('/:idcaja/:fecha',CajaController.getResumenCaja)