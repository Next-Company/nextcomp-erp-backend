import { Router } from "express";
import { ProductosController } from "../Controladores/productosController.js";

export const ProductosRouter = new Router();

ProductosRouter.get("/productoslist/:search",ProductosController.getProductosList)
ProductosRouter.get("/productoslist",ProductosController.getProductosList)
ProductosRouter.get("/recetaslist",ProductosController.getRecetasList)
ProductosRouter.get("/recetaslist/:search",ProductosController.getRecetasList)

ProductosRouter.get('/searchproducto/:info',ProductosController.searchProducto)
ProductosRouter.get('/searchproducto/',ProductosController.searchProducto)

ProductosRouter.put('/updateProducto',ProductosController.updateProducto)
ProductosRouter.post('/generateProducto',ProductosController.generateProducto)
ProductosRouter.get('/searchproductobyid/:id',ProductosController.searchProductoById)
ProductosRouter.post('/createnewproduct',ProductosController.createNewProduct)
ProductosRouter.post('/createnewcolor',ProductosController.createNewColor)

ProductosRouter.get('/rubroslist/:limit',ProductosController.getRubrosList)
ProductosRouter.get('/getrubro/',ProductosController.searchRubro)
ProductosRouter.get('/getrubro/:search',ProductosController.searchRubro)
ProductosRouter.get('/unidadeslist/:limit',ProductosController.getUnidadesList)
ProductosRouter.get('/getunidad/',ProductosController.searchUnidad)
ProductosRouter.get('/getunidad/:search',ProductosController.searchUnidad)

ProductosRouter.post('/productosConStock',ProductosController.getProductosConStock)
ProductosRouter.post('/productosConStock/:search',ProductosController.getProductosConStock)
ProductosRouter.get('/productosTotal',ProductosController.getProductosTotal)
ProductosRouter.get('/productosTotal/:search',ProductosController.getProductosTotal)
ProductosRouter.post('/productosTotal',ProductosController.getProductosTotal)
ProductosRouter.post('/productosTotal/:search',ProductosController.getProductosTotal)
// ProductosRouter.get('/productosCon',ProductosController.getProductosTotal)
// ProductosRouter.get('/productosTotal/:search',ProductosController.getProductosTotal)

ProductosRouter.get('/productosEstilo',ProductosController.getProductosEstilo)
ProductosRouter.get('/productosEstilo/:search',ProductosController.getProductosEstilo)
ProductosRouter.get('/productosBase',ProductosController.getProductosBase)
ProductosRouter.get('/productosBase/:search',ProductosController.getProductosBase)
ProductosRouter.get('/productosMarca',ProductosController.getProductosMarca)
ProductosRouter.get('/productosMarca/:search',ProductosController.getProductosMarca)
ProductosRouter.get('/productosPresentacion',ProductosController.getProductosPresentacion)
ProductosRouter.get('/productosPresentacion/:search',ProductosController.getProductosPresentacion)


