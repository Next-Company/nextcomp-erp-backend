import { Router } from "express";
import { LetrasController } from "../Controladores/letrasController.js";

export const LetrasRouter = Router()

LetrasRouter.get('/',LetrasController.getLetrasLista)
LetrasRouter.put('/saveLetra',LetrasController.saveInfoLetra)
LetrasRouter.get('/getLetraById/:id',LetrasController.getLetraById)
LetrasRouter.get('/getfacturasbyproveedor/:idproveedor',LetrasController.getFacturasByProveedor)
LetrasRouter.delete('/borrarletra/:id',LetrasController.deleteLetraById)

