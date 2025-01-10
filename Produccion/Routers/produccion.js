import { Router } from "express";
import { ProduccionController } from "../Controladores/produccion.js";

export const produccionRouter = Router()
produccionRouter.get('/',ProduccionController.getOrdenes)
produccionRouter.get('/print',ProduccionController.printOrdenes)
produccionRouter.post('/exportavios',ProduccionController.exportPedidoAvios)
produccionRouter.post('/exporttelas',ProduccionController.exportPedidoTelas)

produccionRouter.get('/getListaEstampados',ProduccionController.getListaEstampados)
produccionRouter.get('/estampado/:id',ProduccionController.getInfoEstampado)
produccionRouter.put('/guardarestampado',ProduccionController.saveInfoEstampado)
produccionRouter.delete('/borrarestampado/:id',ProduccionController.eliminarInfoEstampado)

produccionRouter.post('/busqueda',ProduccionController.getOrdenesByParams)
produccionRouter.get('/:id',ProduccionController.getOrdenesById)
produccionRouter.get('/traer',ProduccionController.traerMultiSelect)
produccionRouter.post('/multi',ProduccionController.testMultiSelect)
produccionRouter.post('/',ProduccionController.pushItems)
produccionRouter.put('/:id/:data',ProduccionController.updateItems)
produccionRouter.delete('/:id',ProduccionController.deleteOrden)