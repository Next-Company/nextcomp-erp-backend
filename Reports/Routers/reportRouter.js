import { Router } from "express";
import ReportController from "../Controladores/reportController.js";
export const ReportRouter = Router()

ReportRouter.post('/letras',ReportController.getInformeLetras)
ReportRouter.post('/resumenconsolidado',ReportController.getResumenConsolidado)
ReportRouter.post('/import',ReportController.setImportLetras)