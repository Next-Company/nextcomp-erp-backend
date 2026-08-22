import { Router } from "express";
import AlmacenController from "../Controladores/almacenController.js";

const ALMACEN_ROUTER = new Router()

// ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)
ALMACEN_ROUTER.get('/listarmovimientos',AlmacenController.getMovimientosAlmacen)
ALMACEN_ROUTER.get('/listarmovimientos/:search',AlmacenController.getMovimientosAlmacen)

ALMACEN_ROUTER.get('/listarinventario',AlmacenController.getInventarioProductos)
ALMACEN_ROUTER.get('/listarinventario/:search',AlmacenController.getInventarioProductos)

ALMACEN_ROUTER.get('/listaralmacenes',AlmacenController.getListaAlmacenes)
ALMACEN_ROUTER.get('/listaralmacenes/:search',AlmacenController.getListaAlmacenes)

// [feat 2026-06-26] Lista completa de almacenes (todos los tipos) para la pestaña "Almacenes".
//   Distinta de /listaralmacenes (que filtra tipo='C'). El filtro y la paginación van en el cliente.
ALMACEN_ROUTER.get('/listaralmacenesall',AlmacenController.getListaAlmacenesAll)

// [feat 2026-08-14] "Stock global" por almacén (total de unidades de prenda en vivo) para la
//   columna nueva de la pestaña "Almacenes". Endpoint aparte para no cargar el listado/selects
//   compartidos; el cliente lo trae en paralelo y lo fusiona por id.
ALMACEN_ROUTER.get('/stockglobalalmacen',AlmacenController.getStockGlobalPorAlmacen)

// [feat 2026-07-02] Stock por variante desglosado por almacén (pestaña "Productos").
//   Devuelve una fila por (variante, almacén) con existencias; el cliente agrupa y pagina.
ALMACEN_ROUTER.get('/stockporalmacen',AlmacenController.getStockPorAlmacen)

// [feat 2026-08-07] Stock EN VIVO de prendas desde tbl2_almacen_det (misma fuente que el POS).
//   Respalda la UI de escritura (Ingreso/Retiro/Traslado): muestra y valida contra este número.
ALMACEN_ROUTER.get('/stockprendalive',AlmacenController.getStockPrendaLive)

// [feat 2026-08-14] Stock en vivo PAGINADO EN SERVIDOR (por variante×almacén) para el selector de la
//   pestaña "Movimientos". Query: page, size, search. Devuelve { items, total }.
ALMACEN_ROUTER.get('/stockprendalivepaginado',AlmacenController.getStockPrendaLivePaginado)
// [feat 2026-08-14] Stock en vivo de UNA variante en UN almacén (bajo demanda: "stock en destino").
ALMACEN_ROUTER.get('/stockvariante',AlmacenController.getStockVarianteEnAlmacen)
// [feat 2026-08-14] Resuelve un EAN-13 escaneado a su variante (subproducto) por match de sku,
//   para el "Ingreso por lector".
ALMACEN_ROUTER.get('/resolvercodigo',AlmacenController.getSubproductoPorSku)

// [feat 2026-08-14] "Cargar fraccionamiento a acabados" (A2): preview + ejecución (INGR a ACABADOS).
ALMACEN_ROUTER.get('/fraccionamientoacabados/:idorden',AlmacenController.getFraccionamientoAcabados)
ALMACEN_ROUTER.post('/cargarfraccionamiento/:idorden',AlmacenController.cargarFraccionamientoAcabados)

// [feat 2026-08-08] Stock en vivo LIVIANO (con precio, sin id_subprod_CAB) para la matriz Variante×Almacén
//   de la pestaña "Productos" (rediseño). Más rápido que /stockprendalive para alto tráfico.
ALMACEN_ROUTER.get('/stockprendamatriz',AlmacenController.getStockPrendaMatriz)

// [feat 2026-08-14] Stock en vivo PAGINADO EN SERVIDOR (por producto) para la pestaña "Productos".
//   Query: page, size, search, orden. Devuelve { items, total }. Reemplaza el bajado completo cuando
//   se quiere no montar todo de golpe.
ALMACEN_ROUTER.get('/stockprendapaginado',AlmacenController.getStockPrendaPaginado)

ALMACEN_ROUTER.get('/getguiamovimiento/:idmov',AlmacenController.getGuia)
ALMACEN_ROUTER.put('/saveguia',AlmacenController.saveGuia)
ALMACEN_ROUTER.delete('/deleteguiamov/:idguia',AlmacenController.deleteGuia)

// [feat 2026-08-07] Escritura de stock de PRENDAS (Ingreso/Retiro/Traslado) — modelo POS 1 fila/unidad.
//   Pareja de escritura de la pestaña "Productos" (/stockporalmacen es su lectura).
ALMACEN_ROUTER.post('/movimientoprenda',AlmacenController.saveMovimientoPrenda)

ALMACEN_ROUTER.get('/getdespacho/:idmov',AlmacenController.getDespacho)
ALMACEN_ROUTER.post('/savedespacho',AlmacenController.saveDespacho)
ALMACEN_ROUTER.put('/updatedespacho/:idguia',AlmacenController.updateDespacho)
ALMACEN_ROUTER.delete('/deletedespacho/:idguia',AlmacenController.deleteDespacho)

ALMACEN_ROUTER.get('/disponibilidadreq/:idreq',AlmacenController.getDisponibilidadRequerimiento)
ALMACEN_ROUTER.get('/disponibilidadmod/:idmod',AlmacenController.getDisponibilidadModelo)
ALMACEN_ROUTER.get('/getmovimientobyid/:id', AlmacenController.getMovimientosAlmacenById)

ALMACEN_ROUTER.post('/vistapreviadespacho/:tipo', AlmacenController.VistaPreviaDespacho)
ALMACEN_ROUTER.post('/vistapreviadespachocorte_telas/:tipo', AlmacenController.VistaPreviaDespachoCorteTelas)
ALMACEN_ROUTER.post('/vistapreviadespachocorte_avios/:tipo', AlmacenController.VistaPreviaDespachoCorteAvios)
ALMACEN_ROUTER.post('/vistapreviaretiro/:tipo', AlmacenController.VistaPreviaRetiro)
ALMACEN_ROUTER.get('/infocuadretelas/:idmov',AlmacenController.getInfoCuadreTelas)
ALMACEN_ROUTER.put('/updateinfocuadretelas/:idmov',AlmacenController.updateInfoCuadreTelas)
ALMACEN_ROUTER.delete('/deleteinfocuadretelas/:idmov',AlmacenController.deleteInfoCuadreTelas)

ALMACEN_ROUTER.get('/getinfoetiqueta/:idprod',AlmacenController.getInfoEtiqueta)
ALMACEN_ROUTER.post('/imprimiretiquetas/:idprod',AlmacenController.printEtiquetas)
ALMACEN_ROUTER.post('/imprimiretiquetasbyorden/:idorden',AlmacenController.printEtiquetasByOrden)


export default ALMACEN_ROUTER