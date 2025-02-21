import { Router } from "express";
import { ProductosController } from "../Controladores/productosController.js";

export const ProductosRouter = new Router();

ProductosRouter.get("/productoslist/:limit",ProductosController.getProductosList)