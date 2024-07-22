import { Router } from "express";
import { HomeControlador } from "../Controladores/home.js";

export const homeRouter = Router()
homeRouter.post('/', HomeControlador.getData)