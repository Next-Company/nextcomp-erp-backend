import { Router } from "express";
import AbonoController from "../Controladores/abonoController.js";

export const AbonoRouter = new Router();

AbonoRouter.get('/:limit',AbonoController.getAbonosList)
AbonoRouter.get('/getsaldos/:idproveedor',AbonoController.getSaldosServicio)
AbonoRouter.put('/saveabono',AbonoController.saveAbono)
