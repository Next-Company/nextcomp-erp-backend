import { Router } from "express";
import ProveedorController from "../Controllers/proveedorController.js";

const PROVEEDOR_ROUTER = new Router()

PROVEEDOR_ROUTER.get('/listarproveedores',ProveedorController.getListaProveedores)
PROVEEDOR_ROUTER.get('/listarproveedores/:search',ProveedorController.getListaProveedores)

export default PROVEEDOR_ROUTER