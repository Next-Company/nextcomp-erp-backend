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

produccionRouter.get('/getListaMuestras', ProduccionController.getListaMuestras)
produccionRouter.get('/getListaMuestras/:search', ProduccionController.getListaMuestras)
produccionRouter.get('/muestra/:id', ProduccionController.getInfoMuestras)
produccionRouter.put('/guardarmuestra', ProduccionController.saveInfoMuestras)
produccionRouter.delete('/borrarmuestra/:id', ProduccionController.eliminarInfoMuestras)

produccionRouter.get('/getListaGuias', ProduccionController.getListaGuias)
produccionRouter.get('/getListaGuias/:search', ProduccionController.getListaGuias)
produccionRouter.get('/guia/:id', ProduccionController.getInfoGuias)

produccionRouter.put('/guardarguia', ProduccionController.saveInfoGuias)
produccionRouter.delete('/borrarguia/:id', ProduccionController.eliminarInfoGuias)
produccionRouter.delete('/anularguia/:id', ProduccionController.anularInfoGuias)

produccionRouter.put('/guardarguiaglb', ProduccionController.saveInfoGuiasGLB)
produccionRouter.delete('/borrarguiaglb/:id', ProduccionController.eliminarInfoGuiasGLB)
produccionRouter.delete('/anularguiaglb/:id', ProduccionController.anularInfoGuiasGLB)

produccionRouter.put('/guardarguiaxpq', ProduccionController.saveInfoGuiasXPQ)
produccionRouter.delete('/borrarguiaxpq/:id', ProduccionController.eliminarInfoGuiasXPQ)
produccionRouter.delete('/anularguiaxpq/:id', ProduccionController.anularInfoGuiasXPQ)

produccionRouter.get('/estadoguia/:id', ProduccionController.getStatusGuia)
produccionRouter.get('/showinformeservicio/:id', ProduccionController.ShowInformeServicio)
produccionRouter.get('/showinformeservicio2', ProduccionController.ShowInformeServicio2)
produccionRouter.get('/searchguia/:info', ProduccionController.searchGuia)

produccionRouter.get('/getListaPedidos', ProduccionController.getListaPedidos)
produccionRouter.get('/getListaPedidos/:search', ProduccionController.getListaPedidos)
produccionRouter.get('/pedido/:id', ProduccionController.getInfoPedidos)
produccionRouter.get('/nuevopedido', ProduccionController.getNuevoPedido)
produccionRouter.put('/guardarpedidoavios', ProduccionController.saveInfoPedidosAvios)
produccionRouter.put('/guardarpedidoadicionales', ProduccionController.saveInfoPedidosAdicionales)
produccionRouter.put('/guardarpedidotelas', ProduccionController.saveInfoPedidosTelas)
produccionRouter.delete('/borrarpedido/:id', ProduccionController.eliminarInfoPedidos)
produccionRouter.get('/showinformepedido/:id', ProduccionController.ShowInformePedido)

produccionRouter.get('/getListaDespachos/:tipo', ProduccionController.getListaDespachos)
produccionRouter.get('/getListaDespachos/:tipo/:search', ProduccionController.getListaDespachos)
produccionRouter.get('/despacho/:id', ProduccionController.getInfoDespachos)
// produccionRouter.get('/getListaDespachos/:search/:filtros',ProduccionController.getListaDespachos)
// produccionRouter.put('/guardardespacho', ProduccionController.saveInfoDespachos)
produccionRouter.put('/guardardespachopedido', ProduccionController.saveInfoDespachosPedido)
produccionRouter.put('/guardardespachoguia', ProduccionController.saveInfoDespachosGuia)
produccionRouter.put('/guardardespachoguiaglb', ProduccionController.saveInfoDespachosGuiaGLB)
produccionRouter.put('/guardardespachoguiaxpq', ProduccionController.saveInfoDespachosGuiaXPQ)

produccionRouter.delete('/borrardespachopedido/:id', ProduccionController.eliminarInfoDespachosPedido)
produccionRouter.delete('/borrardespachoguia/:id', ProduccionController.eliminarInfoDespachosGuia)
produccionRouter.delete('/borrardespachoguiaglb/:id', ProduccionController.eliminarInfoDespachosGuiaGLB)
produccionRouter.delete('/borrardespachoguiaxpq/:id', ProduccionController.eliminarInfoDespachosGuiaXPQ)

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
produccionRouter.get('/verdespachoguia/:id/:idguia/:condicion', ProduccionController.verInfoDespachoGuia)
produccionRouter.get('/verdespachoguiaglb/:id/:idguia/:condicion', ProduccionController.verInfoDespachoGuiaGLB)
produccionRouter.get('/verdespachomuestra/:id/:idguia/:condicion', ProduccionController.verInfoDespachoMuestra)
produccionRouter.get('/verdespachopedido/:id/:idpedido/:condicion', ProduccionController.verInfoDespachoPedido)

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

produccionRouter.get('/vistarapidacuadretelas/:id/:mode', ProduccionController.VistaRapidaCuadreTelas)

produccionRouter.post('/vistapreviapedido/:tipo', ProduccionController.VistaPreviaPedido)
produccionRouter.post('/vistapreviapedidoavios/:tipo', ProduccionController.VistaPreviaPedidoAvios)
// produccionRouter.post('/vistapreviapedidoavios/:tipo',ProduccionController.VistaPreviaPedidoAvios)

produccionRouter.get('/getListaDespachosAcabados/:tipo', ProduccionController.getListaDespachosAcabados)
produccionRouter.get('/getListaDespachosAcabados/:tipo/:search', ProduccionController.getListaDespachosAcabados)
produccionRouter.post('/saveRecepcionAcabados',ProduccionController.saveRecepcionAcabados)
produccionRouter.put('/updateRecepcionAcabados',ProduccionController.updateRecepcionAcabados)
produccionRouter.delete('/borrardespachoempaquetado/:id',ProduccionController.eliminarRecepcionAcabados)
produccionRouter.get('/getInfoEmpaquetado/:id',ProduccionController.getInfoEmpaquetado)
produccionRouter.get('/getAcabadosPendientes/:id',ProduccionController.getAcabadosPendientes)
produccionRouter.get('/verdespachoacabados/:id/:idorden/:condicion', ProduccionController.verInfoDespachoAcabados)

produccionRouter.get('/getAcabadosDisponible/:id',ProduccionController.getAcabadosDisponible)

