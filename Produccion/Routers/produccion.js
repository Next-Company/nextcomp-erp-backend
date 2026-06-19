import { Router } from "express";
import { ProduccionController } from "../Controladores/produccion.js";
import { authorize } from "../../Main/middleware/authorize.js";

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
produccionRouter.delete('/borrarmuestra/:id', authorize(1), ProduccionController.eliminarInfoMuestras)

produccionRouter.get('/getListaGuias', ProduccionController.getListaGuias)
produccionRouter.get('/getListaGuias/:search', ProduccionController.getListaGuias)
produccionRouter.get('/guia/:id', ProduccionController.getInfoGuias)

produccionRouter.put('/guardarguia', ProduccionController.saveInfoGuias)
produccionRouter.delete('/borrarguia/:id', authorize(1), ProduccionController.eliminarInfoGuias)
produccionRouter.delete('/anularguia/:id', authorize(1), ProduccionController.anularInfoGuias)

produccionRouter.put('/guardarguiaglb', ProduccionController.saveInfoGuiasGLB)
produccionRouter.delete('/borrarguiaglb/:id', authorize(1), ProduccionController.eliminarInfoGuiasGLB)
produccionRouter.delete('/anularguiaglb/:id', authorize(1), ProduccionController.anularInfoGuiasGLB)

produccionRouter.put('/guardarguiaxpq', ProduccionController.saveInfoGuiasXPQ)
produccionRouter.delete('/borrarguiaxpq/:id', authorize(1), ProduccionController.eliminarInfoGuiasXPQ)
produccionRouter.delete('/anularguiaxpq/:id', authorize(1), ProduccionController.anularInfoGuiasXPQ)

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
produccionRouter.delete('/borrarpedido/:id', authorize(1), ProduccionController.eliminarInfoPedidos)
produccionRouter.get('/showinformepedido/:id', ProduccionController.ShowInformePedido)

produccionRouter.get('/getListaDespachos/:tipo', ProduccionController.getListaDespachos)
produccionRouter.get('/getListaDespachos/:tipo/:search', ProduccionController.getListaDespachos)
produccionRouter.get('/despacho/:id', ProduccionController.getInfoDespachos)
produccionRouter.put('/guardardespachopedido', ProduccionController.saveInfoDespachosPedido)
produccionRouter.put('/guardardespachoguia', ProduccionController.saveInfoDespachosGuia)
produccionRouter.put('/guardardespachoguiaglb', ProduccionController.saveInfoDespachosGuiaGLB)
produccionRouter.put('/guardardespachoguiaxpq', ProduccionController.saveInfoDespachosGuiaXPQ)

produccionRouter.delete('/borrardespachopedido/:id', authorize(1), ProduccionController.eliminarInfoDespachosPedido)
produccionRouter.delete('/borrardespachoguia/:id', authorize(1), ProduccionController.eliminarInfoDespachosGuia)
produccionRouter.delete('/borrardespachoguiaglb/:id', authorize(1), ProduccionController.eliminarInfoDespachosGuiaGLB)
produccionRouter.delete('/borrardespachoguiaxpq/:id', authorize(1), ProduccionController.eliminarInfoDespachosGuiaXPQ)

produccionRouter.get('/getListaRetiros', ProduccionController.getListaRetiros)
produccionRouter.get('/getListaRetiros/:search', ProduccionController.getListaRetiros)
produccionRouter.get('/retiros/:id', ProduccionController.getInfoRetiros)
produccionRouter.put('/saveinforetiro', ProduccionController.saveInfoRetiro)

produccionRouter.get('/getListaEstampados', ProduccionController.getListaEstampados)
produccionRouter.get('/estampado/:id', ProduccionController.getInfoEstampado)
produccionRouter.put('/guardarestampado', ProduccionController.saveInfoEstampado)
produccionRouter.delete('/borrarestampado/:id', authorize(1), ProduccionController.eliminarInfoEstampado)
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
produccionRouter.delete('/:id', authorize(1), ProduccionController.deleteOrden)

produccionRouter.get('/informe/:id', ProduccionController.ShowInforme)

produccionRouter.get('/proveedoreslist/:limit', ProduccionController.getListaProveedores)
produccionRouter.get('/searchproveedor/:info', ProduccionController.searchProveedor)
produccionRouter.get('/searchproveedorbyid/:id', ProduccionController.searchProveedorById)

produccionRouter.get('/clienteslist', ProduccionController.getListaClientes)
produccionRouter.get('/clienteslist/:search', ProduccionController.getListaClientes)

produccionRouter.post('/vistarapidapedidoavios/:mode', ProduccionController.VistaRapidaPedidoAvios)
produccionRouter.get('/vistarapidapedidoavios/:id/:mode', ProduccionController.VistaRapidaPedidoAvios)
produccionRouter.post('/vistarapidapedidotelas/:mode', ProduccionController.VistaRapidaPedidoTelas)
produccionRouter.get('/vistarapidapedidotelas/:id/:mode', ProduccionController.VistaRapidaPedidoTelas)

produccionRouter.get('/vistarapidacuadretelas/:id/:mode', ProduccionController.VistaRapidaCuadreTelas)

produccionRouter.post('/vistapreviapedido/:tipo', ProduccionController.VistaPreviaPedido)
produccionRouter.post('/vistapreviapedidoavios/:tipo', ProduccionController.VistaPreviaPedidoAvios)

produccionRouter.get('/getListaDespachosAcabados/:tipo', ProduccionController.getListaDespachosAcabados)
produccionRouter.get('/getListaDespachosAcabados/:tipo/:search', ProduccionController.getListaDespachosAcabados)
produccionRouter.post('/saveRecepcionAcabados',ProduccionController.saveRecepcionAcabados)
produccionRouter.put('/updateRecepcionAcabados',ProduccionController.updateRecepcionAcabados)
produccionRouter.delete('/borrardespachoempaquetado/:id', authorize(1), ProduccionController.eliminarRecepcionAcabados)
produccionRouter.get('/getInfoEmpaquetado/:id',ProduccionController.getInfoEmpaquetado)
produccionRouter.get('/getAcabadosPendientes/:id',ProduccionController.getAcabadosPendientes)
produccionRouter.get('/verdespachoacabados/:id/:idorden/:condicion', ProduccionController.verInfoDespachoAcabados)

produccionRouter.get('/getAcabadosDisponible/:id',ProduccionController.getAcabadosDisponible)
