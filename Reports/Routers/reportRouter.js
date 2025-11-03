import { Router } from "express";
import ReportController from "../Controladores/reportController.js";
export const ReportRouter = Router()

ReportRouter.post('/letras',ReportController.getInformeLetras)
ReportRouter.post('/resumenconsolidado',ReportController.getResumenConsolidado)
ReportRouter.post('/despachosconsolidado',ReportController.getDespachosConsolidado)
ReportRouter.post('/import',ReportController.setImportLetras)

ReportRouter.post('/vistapreviaretiro/:tipo', ReportController.VistaPreviaRetiro)

// ReportRouter.post('/vistarapidapedidoavios/:mode', ProduccionController.VistaRapidaPedidoAvios)
// ReportRouter.get('/vistarapidapedidoavios/:id/:mode', ProduccionController.VistaRapidaPedidoAvios)
// ReportRouter.post('/vistarapidapedidotelas/:mode', ProduccionController.VistaRapidaPedidoTelas)
// ReportRouter.get('/vistarapidapedidotelas/:id/:mode', ProduccionController.VistaRapidaPedidoTelas)
// ReportRouter.post('/vistapreviapedidoavios/:tipo', ProduccionController.VistaPreviaPedidoAvios)