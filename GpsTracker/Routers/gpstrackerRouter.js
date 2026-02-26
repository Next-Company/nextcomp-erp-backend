import { Router } from "express";
import GpsTrackerController from "../Controladores/gpstrackerController.js";

const GPS_ROUTER = Router()

GPS_ROUTER.get('/getinfo/:search',GpsTrackerController.getInfo)
GPS_ROUTER.get('/getinfo',GpsTrackerController.getInfo)

export default GPS_ROUTER;