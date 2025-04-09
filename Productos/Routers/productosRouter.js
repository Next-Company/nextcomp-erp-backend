import { Router } from "express";
import { ProductosController } from "../Controladores/productosController.js";

export const ProductosRouter = new Router();

ProductosRouter.get("/productoslist/:limit",ProductosController.getProductosList)
ProductosRouter.get('/searchproducto/:info',ProductosController.searchProducto)
ProductosRouter.get('/searchproducto/',ProductosController.searchProducto)
ProductosRouter.get('/searchproductobyid/:id',ProductosController.searchProductoById)