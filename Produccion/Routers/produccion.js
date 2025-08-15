import { Router } from "express";
import { ProduccionController } from "../Controladores/produccion.js";

export const produccionRouter = Router()

produccionRouter.get('/inventario/:numero', ProduccionController.validaInventario)

produccionRouter.get('/', ProduccionController.getOrdenes)
produccionRouter.get('/getordenes/:search', ProduccionController.getOrdenes)
produccionRouter.get('/getordenes/', ProduccionController.getOrdenes)
produccionRouter.get('/print', ProduccionController.printOrdenes)
produccionRouter.post('/exportavios', ProduccionController.exportPedidoAvios)
produccionRouter.post('/exporttelas', ProduccionController.exportPedidoTelas)
produccionRouter.post('/exportestampado/:id', ProduccionController.exportInfoEstampado)
produccionRouter.get('/exportguia/:id/:modo', ProduccionController.exportInfoGuia)
// produccionRouter.get('/exportguiav2/:id/:modo', ProduccionController.exportInfoGuiaV2)

produccionRouter.get('/getListaGuias', ProduccionController.getListaGuias)
produccionRouter.get('/getListaGuias/:search', ProduccionController.getListaGuias)

produccionRouter.get('/getListaMuestras', ProduccionController.getListaMuestras)
produccionRouter.get('/getListaMuestras/:search', ProduccionController.getListaMuestras)

produccionRouter.get('/guia/:id', ProduccionController.getInfoGuias)
produccionRouter.put('/guardarguia', ProduccionController.saveInfoGuias)
produccionRouter.delete('/borrarguia/:id', ProduccionController.eliminarInfoGuias)
produccionRouter.delete('/anularguia/:id', ProduccionController.anularInfoGuias)
produccionRouter.get('/estadoguia/:id', ProduccionController.getStatusGuia)
produccionRouter.get('/showinformeservicio/:id', ProduccionController.ShowInformeServicio)
// produccionRouter.get('/showinformeservicio2/:id',ProduccionController.ShowInformeServicio2)
produccionRouter.get('/showinformeservicio2', ProduccionController.ShowInformeServicio2)
produccionRouter.get('/searchguia/:info', ProduccionController.searchGuia)

produccionRouter.get('/getListaPedidos', ProduccionController.getListaPedidos)
produccionRouter.get('/getListaPedidos/:search', ProduccionController.getListaPedidos)
produccionRouter.get('/pedido/:id', ProduccionController.getInfoPedidos)
produccionRouter.get('/nuevopedido', ProduccionController.getNuevoPedido)
produccionRouter.put('/guardarpedido', ProduccionController.saveInfoPedidos)
produccionRouter.delete('/borrarpedido/:id', ProduccionController.eliminarInfoPedidos)
produccionRouter.get('/showinformepedido/:id', ProduccionController.ShowInformePedido)

produccionRouter.get('/getListaDespachos/:tipo', ProduccionController.getListaDespachos)
produccionRouter.get('/getListaDespachos/:tipo/:search', ProduccionController.getListaDespachos)
// produccionRouter.get('/getListaDespachos/:search/:filtros',ProduccionController.getListaDespachos)
produccionRouter.get('/despacho/:id', ProduccionController.getInfoDespachos)
produccionRouter.put('/guardardespacho', ProduccionController.saveInfoDespachos)
produccionRouter.delete('/borrardespacho/:id', ProduccionController.eliminarInfoDespachos)

produccionRouter.get('/getListaRetiros', ProduccionController.getListaRetiros)
produccionRouter.get('/getListaRetiros/:search', ProduccionController.getListaRetiros)
produccionRouter.get('/retiros/:id', ProduccionController.getInfoRetiros)
produccionRouter.put('/saveinforetiro', ProduccionController.saveInfoRetiro)
// produccionRouter.delete('/deleteinforetiro/:id', ProduccionController.eliminarInfoRetiro)


produccionRouter.get('/getListaEstampados', ProduccionController.getListaEstampados)
produccionRouter.get('/estampado/:id', ProduccionController.getInfoEstampado)
produccionRouter.put('/guardarestampado', ProduccionController.saveInfoEstampado)
produccionRouter.delete('/borrarestampado/:id', ProduccionController.eliminarInfoEstampado)
produccionRouter.post('/exportdespacho/:id/:idguia', ProduccionController.exportInfoDespacho)
produccionRouter.get('/verdespacho/:id/:idguia/:condicion', ProduccionController.verInfoDespacho)

produccionRouter.post('/busqueda', ProduccionController.getOrdenesByParams)
produccionRouter.get('/getordenesbyid/:id', ProduccionController.getOrdenesById)
produccionRouter.get('/traer', ProduccionController.traerMultiSelect)
produccionRouter.post('/multi', ProduccionController.testMultiSelect)
produccionRouter.post('/', ProduccionController.pushItems)
produccionRouter.put('/:id/:data', ProduccionController.updateItems)
produccionRouter.delete('/:id', ProduccionController.deleteOrden)

produccionRouter.get('/informe/:id', ProduccionController.ShowInforme)

produccionRouter.get('/proveedoreslist/:limit', ProduccionController.getListaProveedores)
produccionRouter.get('/searchproveedor/:info', ProduccionController.searchProveedor)
produccionRouter.get('/searchproveedorbyid/:id', ProduccionController.searchProveedorById)

produccionRouter.get('/clienteslist', ProduccionController.getListaClientes)
produccionRouter.get('/clienteslist/:search', ProduccionController.getListaClientes)

// produccionRouter.get('/guiaslist/:limit',ProduccionController.getListaGuias)
// produccionRouter.get('/searchproveedor/:info',ProduccionController.searchProveedor)
// produccionRouter.get('/searchproveedorbyid/:id',ProduccionController.searchProveedorById)

produccionRouter.post('/vistarapidapedidoavios/:mode', ProduccionController.VistaRapidaPedidoAvios)
produccionRouter.get('/vistarapidapedidoavios/:id/:mode', ProduccionController.VistaRapidaPedidoAvios)
produccionRouter.post('/vistarapidapedidotelas/:mode', ProduccionController.VistaRapidaPedidoTelas)
produccionRouter.get('/vistarapidapedidotelas/:id/:mode', ProduccionController.VistaRapidaPedidoTelas)

produccionRouter.post('/vistapreviapedido/:tipo', ProduccionController.VistaPreviaPedido)
produccionRouter.post('/vistapreviapedidoavios/:tipo', ProduccionController.VistaPreviaPedidoAvios)
// produccionRouter.post('/vistapreviapedidoavios/:tipo',ProduccionController.VistaPreviaPedidoAvios)




