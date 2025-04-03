import { Router } from "express";
import ReportController from "../Controladores/reportController.js";
export const ReportRouter = Router()

ReportRouter.get('/letras',ReportController.getInformeLetras)