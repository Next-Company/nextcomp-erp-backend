import { Router } from "express";
import { DirectorioController } from "../Controladores/directorios.js";
export const directorioRouter = Router()
directorioRouter.get('/',DirectorioController.getAll)
directorioRouter.post('/:path',DirectorioController.getPath)
directorioRouter.post('/postFile',DirectorioController.postFile)