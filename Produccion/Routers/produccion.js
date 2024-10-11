import { Router } from "express";
import { ProduccionController } from "../Controladores/produccion.js";

export const produccionRouter = Router()
produccionRouter.get('/',ProduccionController.getOrdenes)
produccionRouter.get('/:id',ProduccionController.getOrdenesById)
produccionRouter.post('/',ProduccionController.pushItems)
produccionRouter.put('/:id/:data',ProduccionController.updateItems)
produccionRouter.delete('/:id',ProduccionController.deleteOrden)