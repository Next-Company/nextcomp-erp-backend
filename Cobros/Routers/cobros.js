import { Router } from "express";
import CobrosController from "../Controladores/cobros.js";

export const COBROS_ROUTER = Router()

COBROS_ROUTER.get('/getlista',CobrosController.getLista)
COBROS_ROUTER.get('/getlista/:search',CobrosController.getLista)