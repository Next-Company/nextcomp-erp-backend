import { Router } from "express";
import LocalesController from "../Controladores/localesController.js";

const LOCAL_ROUTER = Router()

LOCAL_ROUTER.get('/getinfo/:search',LocalesController.getTalleres)
LOCAL_ROUTER.get('/getinfo',LocalesController.getTalleres)
LOCAL_ROUTER.get('/getlocaldetail',LocalesController.getLocalDetail)

export default LOCAL_ROUTER;