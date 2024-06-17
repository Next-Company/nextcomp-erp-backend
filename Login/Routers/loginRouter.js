import { Router } from "express";
import { LoginController } from "../Controladores/loginController.js";

export const loginRouter = Router()
loginRouter.post('/',LoginController.validarLogin)