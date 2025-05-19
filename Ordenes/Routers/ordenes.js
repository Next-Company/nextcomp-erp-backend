import { Router } from "express";
import { OrdenesController } from "../Controladores/ordenes.js";

export const ordenesRouter = Router()

ordenesRouter.get("/",OrdenesController.getOrdenes)
ordenesRouter.post("/",OrdenesController.saveInfoOrdenes)