import { Router } from "express";
import PrestamoController from "../Controladores/prestamo.js";

export const prestamoRouter = Router()

prestamoRouter.get("/",PrestamoController.getListaPrestamos)
prestamoRouter.get('/:id', PrestamoController.getInfoPrestamoById)
prestamoRouter.put('/', PrestamoController.updatePrestamo)
prestamoRouter.delete('/:id', PrestamoController.deletePrestamoById)