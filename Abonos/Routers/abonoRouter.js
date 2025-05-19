import { Router } from "express";
import AbonoController from "../Controladores/abonoController.js";

export const AbonoRouter = new Router();


AbonoRouter.get('/letras',AbonoController.getLetrasStatus)
AbonoRouter.get('/servicios/:limit',AbonoController.getServiciosStatus)



AbonoRouter.get('/getabonoslist/:limit',AbonoController.getAbonosList)
AbonoRouter.get('/getabono/:idabono',AbonoController.getAbonoById)
AbonoRouter.get('/getabonobyservicio/:idservicio',AbonoController.getAbonoByServicio)


// AbonoRouter.put('/saveabono',AbonoController.saveAbono)
AbonoRouter.put('/saveabonoServicio',AbonoController.saveAbonoServicio)
AbonoRouter.put('/saveabonoLetra',AbonoController.saveAbonoLetra)
AbonoRouter.put('/saveabonoPrestamo',AbonoController.saveAbonoPrestamo)

AbonoRouter.delete('/deleteabono/:idabono',AbonoController.deleteAbono)

AbonoRouter.get('/serviciostatusdetalle/:idguia',AbonoController.getServiciosStatusDetalle)
AbonoRouter.get('/letrastatusdetalle/:idletra',AbonoController.getLetrasStatusDetalle)
AbonoRouter.get('/prestamostatusdetalle/:idprestamo',AbonoController.getPrestamoStatusDetalle)

AbonoRouter.get('/getsaldos/:idproveedor',AbonoController.getSaldosServicio)
AbonoRouter.get('/listacuentasbancos/:search', AbonoController.getCuentasList)
AbonoRouter.get('/listacuentasbancos', AbonoController.getCuentasList)
AbonoRouter.get('/test', AbonoController.getServiciosStatus)

AbonoRouter.get('/saveMovimientoCaja',AbonoController.saveMovimientoCaja)
AbonoRouter.get('/updateMovimientoCaja',AbonoController.updateMovimientoCaja)
AbonoRouter.get('/deleteMovimientoCaja',AbonoController.deleteMovimientoCaja)