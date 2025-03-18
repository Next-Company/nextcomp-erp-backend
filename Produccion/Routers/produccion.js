import { Router } from "express";
import { ProduccionController } from "../Controladores/produccion.js";

export const produccionRouter = Router()
produccionRouter.get('/',ProduccionController.getOrdenes)
produccionRouter.get('/print',ProduccionController.printOrdenes)
produccionRouter.post('/exportavios',ProduccionController.exportPedidoAvios)
produccionRouter.post('/exporttelas',ProduccionController.exportPedidoTelas)
produccionRouter.post('/exportestampado/:id',ProduccionController.exportInfoEstampado)
produccionRouter.post('/exportguia/:id',ProduccionController.exportInfoGuia)

produccionRouter.get('/getListaGuias',ProduccionController.getListaGuias)
produccionRouter.get('/getListaGuias/:search',ProduccionController.getListaGuias)
produccionRouter.get('/guia/:id',ProduccionController.getInfoGuias)
produccionRouter.put('/guardarguia',ProduccionController.saveInfoGuias)
produccionRouter.delete('/borrarguia/:id',ProduccionController.eliminarInfoGuias)
produccionRouter.get('/estadoguia/:id',ProduccionController.getStatusGuia)
produccionRouter.get('/showinformeservicio/:id',ProduccionController.ShowInformeServicio)
produccionRouter.get('/showinformeservicio2/:id',ProduccionController.ShowInformeServicio2)

produccionRouter.get('/getListaPedidos/:limit',ProduccionController.getListaPedidos)
produccionRouter.get('/pedido/:id',ProduccionController.getInfoPedidos)
produccionRouter.put('/guardarpedido',ProduccionController.saveInfoPedidos)
produccionRouter.delete('/borrarpedido/:id',ProduccionController.eliminarInfoPedidos)
produccionRouter.get('/showinformepedido/:id',ProduccionController.ShowInformePedido)

produccionRouter.get('/getListaDespachos',ProduccionController.getListaDespachos)
produccionRouter.get('/despacho/:id',ProduccionController.getInfoDespachos)
produccionRouter.put('/guardardespacho',ProduccionController.saveInfoDespachos)
produccionRouter.delete('/borrardespacho/:id',ProduccionController.eliminarInfoDespachos)

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

produccionRouter.get('/informe/:id',ProduccionController.ShowInforme)

produccionRouter.get('/proveedoreslist/:limit',ProduccionController.getListaProveedores)
produccionRouter.get('/searchproveedor/:info',ProduccionController.searchProveedor)
produccionRouter.get('/searchproveedorbyid/:id',ProduccionController.searchProveedorById)

// produccionRouter.get('/guiaslist/:limit',ProduccionController.getListaGuias)
// produccionRouter.get('/searchproveedor/:info',ProduccionController.searchProveedor)
// produccionRouter.get('/searchproveedorbyid/:id',ProduccionController.searchProveedorById)

produccionRouter.post('/vistapreviapedido/:tipo',ProduccionController.VistaPreviaPedido)
// produccionRouter.post('/vistapreviapedidoavios/:tipo',ProduccionController.VistaPreviaPedidoAvios)



