import { Router } from "express";
import ServiciosController from "../Controladores/serviciosController";

const SERVICIOS_ROUTER = Router()

SERVICIOS_ROUTER.get('/getServicios',ServiciosController.getServicios)
SERVICIOS_ROUTER.post('/saveServicio',ServiciosController.saveServicio)
SERVICIOS_ROUTER.put('/updateServicio/:id',ServiciosController.updateServicio)
SERVICIOS_ROUTER.delete('/deleteServicio/:id',ServiciosController.deleteServicio)
SERVICIOS_ROUTER.post('/printServicio/:id/:mode',ServiciosController.printServicio)

export default SERVICIOS_ROUTER;