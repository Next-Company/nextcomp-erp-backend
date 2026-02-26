import { Router } from "express";
import LocalesController from "../Controladores/localesController.js";

const LOCAL_ROUTER = Router()

LOCAL_ROUTER.get('/getlocalesseguimiento/:search',LocalesController.getLocalesSeguimiento)
LOCAL_ROUTER.get('/getlocalesseguimiento',LocalesController.getLocalesSeguimiento)
LOCAL_ROUTER.get('/getprocesosencurso/:idlocal',LocalesController.getProcesosEnCurso)

export default LOCAL_ROUTER;