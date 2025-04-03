import { Router } from "express";
import AbonoController from "../Controladores/abonoController.js";

export const AbonoRouter = new Router();

AbonoRouter.get('/listacuentasbancos/:search', AbonoController.getCuentasList)
AbonoRouter.get('/listacuentasbancos', AbonoController.getCuentasList)
AbonoRouter.get('/:limit',AbonoController.getAbonosList)
AbonoRouter.get('/getabono/:idabono',AbonoController.getAbonoById)
AbonoRouter.get('/getabonobyservicio/:idservicio',AbonoController.getAbonoByServicio)
AbonoRouter.get('/getsaldos/:idproveedor',AbonoController.getSaldosServicio)
AbonoRouter.put('/saveabono',AbonoController.saveAbono)
AbonoRouter.delete('/deleteabono/:idabono',AbonoController.deleteAbono)
AbonoRouter.get('/servicios/:limit',AbonoController.getServiciosStatus)
AbonoRouter.get('/statusdetalle/:idguia',AbonoController.getServiciosStatusDetalle)
AbonoRouter.get('/test', AbonoController.getServiciosStatus)
