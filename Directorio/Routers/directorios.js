import { Router } from "express";
import { DirectorioController } from "../Controladores/directorios.js";
export const directorioRouter = Router()
// directorioRouter.post('/upload/:path', DirectorioController.uploadFile)
directorioRouter.post('/upload/', DirectorioController.uploadFile)
directorioRouter.post('/create/', DirectorioController.createFolder)
directorioRouter.get('/download/:info', DirectorioController.downloadFile)
directorioRouter.post('/:path', DirectorioController.getPath)
directorioRouter.delete('/:file', DirectorioController.removeElement)
directorioRouter.get('/', DirectorioController.getAll)
// directorioRouter.post('/delete/:file', DirectorioController.deleteFile);