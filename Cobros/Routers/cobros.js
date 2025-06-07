import { Router } from "express";
import CobrosController from "../Controladores/cobros.js";

export const COBROS_ROUTER = Router()

COBROS_ROUTER.get('/getlista',CobrosController.getLista)
COBROS_ROUTER.get('/getlista/:search',CobrosController.getLista)
COBROS_ROUTER.get('/getlistabyid/:id',CobrosController.getListaById)
COBROS_ROUTER.get('/getabonos/',CobrosController.getAbonos)
COBROS_ROUTER.get('/getabonos/:search',CobrosController.getAbonos)

COBROS_ROUTER.put('/savecobro',CobrosController.saveCobro)
COBROS_ROUTER.delete('/deletecobro/:idabono',CobrosController.deleteCobro)