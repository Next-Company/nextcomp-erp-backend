import { Router } from "express";
import { DirectorioController } from "../Controladores/directorios.js";
export const directorioRouter = Router()
directorioRouter.get('/',DirectorioController.getAll)
directorioRouter.post('/:path',DirectorioController.getPath)
directorioRouter.post('/upload/:path',DirectorioController.uploadFile)
directorioRouter.post('/delete/:file',DirectorioController.deleteFile)