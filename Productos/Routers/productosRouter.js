import { Router } from "express";
import { ProductosController } from "../Controladores/productosController.js";

export const ProductosRouter = new Router();

ProductosRouter.get("/productoslist/:limit",ProductosController.getProductosList)
ProductosRouter.get('/searchproducto/:info',ProductosController.searchProducto)
ProductosRouter.get('/searchproducto/',ProductosController.searchProducto)
ProductosRouter.get('/searchproductobyid/:id',ProductosController.searchProductoById)
ProductosRouter.get('/rubroslist/:limit',ProductosController.getRubrosList)
ProductosRouter.get('/getrubro/',ProductosController.searchRubro)
ProductosRouter.get('/getrubro/:search',ProductosController.searchRubro)
ProductosRouter.get('/unidadeslist/:limit',ProductosController.getUnidadesList)
ProductosRouter.get('/getunidad/',ProductosController.searchUnidad)
ProductosRouter.get('/getunidad/:search',ProductosController.searchUnidad)
ProductosRouter.post('/generateProducto',ProductosController.generateProducto)
ProductosRouter.post('/createnewproduct',ProductosController.createNewProduct)
ProductosRouter.post('/createnewcolor',ProductosController.createNewColor)