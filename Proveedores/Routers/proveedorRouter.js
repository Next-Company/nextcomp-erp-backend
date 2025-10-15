import { Router } from "express";
import ProveedorController from "../Controllers/proveedorController.js";

const PROVEEDOR_ROUTER = new Router()

PROVEEDOR_ROUTER.get('/listarproveedores',ProveedorController.getListaProveedores)
PROVEEDOR_ROUTER.get('/listarproveedores/:search',ProveedorController.getListaProveedores)
PROVEEDOR_ROUTER.get('/getproveedorbyid/:id',ProveedorController.getProveedorById)
PROVEEDOR_ROUTER.post('/saveproveedor/',ProveedorController.saveInfoProveedor)
PROVEEDOR_ROUTER.put('/updateproveedor/:id',ProveedorController.updateInfoProveedor)
PROVEEDOR_ROUTER.delete('/deleteproveedor/:id',ProveedorController.deleteInfoProveedor)

export default PROVEEDOR_ROUTER