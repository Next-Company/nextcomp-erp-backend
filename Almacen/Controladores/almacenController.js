import AlmacenModel from "../Servicios/almacenService.js"
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises'
import { exit } from "node:process";
import { ReplaySubject } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
// import {JsBarcode} from "../../JsBarcode.js";
import JsBarcode from "jsbarcode";
import { Canvas } from "canvas";
import { createRequire } from "node:module";
import { releaseObject } from "puppeteer-core";
import { configs, numControlBarcode } from "../../Main/utils.js";
import mysql from 'mysql2/promise'
import { Console } from "node:console";
import { ProductosService } from "../../Productos/Servicios/productosService.js";
// [v2 2026-06-24 10:05] Selección de plantilla flat vs v2 por fecha de emisión.
import { getTemplateVersion } from "../../Main/helpers/dates.js";
// [v2 2026-06-24 10:35] Adaptadores centralizados de guías de almacén a v2.
import { fechaDocISO, adaptMovimiento, adaptDespachoAlmacen, seleccionarPlantilla } from "../../Main/helpers/v2Despacho.js";

export default class AlmacenController{
  static async getListaAlmacenes(req,reply){
    const search = req.params.search ?? ''
    const data = await AlmacenModel.getListaAlmacenes(search)
    reply.send(data)
  }
  /**
   * [feat 2026-06-26] Endpoint de la pestaña "Almacenes": devuelve TODOS los almacenes
   * de la empresa (todos los tipos). El filtrado y la paginación se resuelven en el cliente.
   * Solo lectura. Ruta: GET /almacen/listaralmacenesall
   */
  static async getListaAlmacenesAll(req,reply){
    const data = await AlmacenModel.getListaAlmacenesAll()
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] Endpoint de la columna "Stock global" de la pestaña "Almacenes":
   * total de unidades de prenda en vivo por almacén (tbl2_almacen_det tipo='P', estado=1).
   * Se consume en paralelo a /listaralmacenesall y se fusiona por id en el cliente.
   * Solo lectura. Ruta: GET /almacen/stockglobalalmacen
   */
  static async getStockGlobalPorAlmacen(req,reply){
    const data = await AlmacenModel.getStockGlobalPorAlmacen()
    reply.send(data)
  }
  /**
   * [feat 2026-07-02] Endpoint de la pestaña "Productos": stock de cada variante
   * (producto+color+talla) desglosado por almacén. El cliente agrupa por variante y
   * despliega el detalle almacén→stock. Solo lectura. Ruta: GET /almacen/stockporalmacen
   */
  static async getStockPorAlmacen(req,reply){
    const data = await AlmacenModel.getStockPorAlmacen()
    reply.send(data)
  }
  /**
   * [feat 2026-08-07] Stock EN VIVO de prendas (tbl2_almacen_det), fuente de la UI de escritura.
   * Solo lectura. Ruta: GET /almacen/stockprendalive
   */
  static async getStockPrendaLive(req,reply){
    const data = await AlmacenModel.getStockPrendaLive()
    reply.send(data)
  }
  /**
   * [feat 2026-08-08] Stock en vivo LIVIANO (con precio, sin id_subprod_CAB) para la matriz de
   * la pestaña "Productos". Solo lectura. Ruta: GET /almacen/stockprendamatriz
   */
  static async getStockPrendaMatriz(req,reply){
    const data = await AlmacenModel.getStockPrendaMatriz()
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] Stock en vivo PAGINADO EN SERVIDOR (pestaña "Productos"). Query params:
   *   page, size, search, orden (stock|nombre). Devuelve { items, total }. Solo lectura.
   *   Ruta: GET /almacen/stockprendapaginado
   */
  static async getStockPrendaPaginado(req,reply){
    const { page, size, search, orden } = req.query ?? {}
    const data = await AlmacenModel.getStockPrendaPaginado({ page, size, search, orden })
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] Stock en vivo PAGINADO EN SERVIDOR (pestaña "Movimientos"). Query: page, size,
   *   search. Devuelve { items, total }. Solo lectura. Ruta: GET /almacen/stockprendalivepaginado
   */
  static async getStockPrendaLivePaginado(req,reply){
    const { page, size, search } = req.query ?? {}
    const data = await AlmacenModel.getStockPrendaLivePaginado({ page, size, search })
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] Stock en vivo de UNA variante en UN almacén (bajo demanda para "Movimientos").
   *   Query: prod, color, talla, cond, almacen. Devuelve { stock }. Ruta: GET /almacen/stockvariante
   */
  static async getStockVarianteEnAlmacen(req,reply){
    const { prod, color, talla, cond, almacen } = req.query ?? {}
    const data = await AlmacenModel.getStockVarianteEnAlmacen({ prod, color, talla, cond, almacen })
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] Resuelve un EAN-13 escaneado a su variante (subproducto) por match de `sku`,
   *   para el "Ingreso por lector". Query: sku. Devuelve { ok, variante }. Ruta: GET /almacen/resolvercodigo
   */
  static async getSubproductoPorSku(req,reply){
    const { sku } = req.query ?? {}
    const data = await AlmacenModel.getSubproductoPorSku(sku)
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] PREVIEW del "cargar fraccionamiento a acabados" (A2): cantidades fraccionadas por
   *   variante + si ya fue cargada. Solo lectura. Ruta: GET /almacen/fraccionamientoacabados/:idorden
   */
  static async getFraccionamientoAcabados(req,reply){
    const { idorden } = req.params ?? {}
    const data = await AlmacenModel.getFraccionamientoParaAcabados(idorden)
    reply.send(data)
  }
  /**
   * [feat 2026-08-14] EJECUTA el "cargar fraccionamiento a acabados" (A2): INGR de lo fraccionado a
   *   ACABADOS (idempotente). Ruta: POST /almacen/cargarfraccionamiento/:idorden
   */
  static async cargarFraccionamientoAcabados(req,reply){
    const { idorden } = req.params ?? {}
    const data = await AlmacenModel.cargarFraccionamientoAcabados(idorden)
    reply.send(data)
  }
  static async getMovimientosAlmacen(req,reply){
    const search = req.params.search ?? ''
    const data = await AlmacenModel.getMovimientosAlmacen(search)
    reply.send(data)
  }
  static async getMovimientosAlmacenById(req,reply){
    const id = req.params.id
    const data = await AlmacenModel.getMovimientosAlmacenById(id)
    reply.send(data)
  }
  static async getInventarioProductos(req,reply){
    const search = req.params.search ?? ''
    const data = await AlmacenModel.getInventarioProductos(search)
    reply.send(data)
  }
  static async getGuia(req,reply){
    let id = req.params.idmov
    const data = await AlmacenModel.getGuia(id)
    reply.send(data)
  }
  static async getDespacho(req,reply){
    let id = req.params.idmov
    const data = await AlmacenModel.getDespacho(id)
    reply.send(data)
  }
  static async saveGuia(req,reply){
    let info = req.body
    const data = await AlmacenModel.saveGuia(info)
    reply.send(data)
  }
  static async saveDespacho(req,reply,next){
    let info = req.body
    let session = req.session ?? {id:0}
    const data = await AlmacenModel.saveDespacho(info,session)
    reply.send(data)
  }
  static async updateDespacho(req,reply,next){
    let info = req.body
    let idguia = req.params.idguia
    let session = req.session ?? {id:0}
    const data = await AlmacenModel.updateDespacho(info,session,idguia)
    reply.send(data)
  }
  /**
   * [feat 2026-08-07] Escritura DIRECTA de stock de PRENDAS terminadas (tipo='P') replicando el POS:
   * Ingreso (INGR) / Retiro (RETR) / Traslado (ENVI) en modelo 1 fila = 1 unidad.
   * Ruta: POST /almacen/movimientoprenda
   * Body: { operacion:'INGR'|'RETR'|'ENVI', almacen_origen?, almacen_destino?, observaciones?,
   *         articulos:[{ id_subprod_CAB, cantidad }] }
   */
  static async saveMovimientoPrenda(req,reply){
    let info = req.body
    const data = await AlmacenModel.saveMovimientoPrenda(info)
    reply.send(data)
  }
  static async deleteGuia(req,reply){
    let id = req.params.idguia
    const data = await AlmacenModel.deleteGuia(id)
    reply.send(data)
  }
  static async deleteDespacho(req,reply){
    let id = req.params.idguia
    const data = await AlmacenModel.deleteDespacho(id)
    reply.send(data)
  }
  static async getDisponibilidadRequerimiento(req,reply){
    const idreq = req.params.idreq
    const data = await AlmacenModel.getDisponibilidadRequerimiento(idreq)
    reply.send(data)
  }
  static async getDisponibilidadModelo(req,reply){
    const idmod = req.params.idmod
    const data = await AlmacenModel.getDisponibilidadModelo(idmod)
    reply.send(data)
  }
  static async VistaPreviaRetiro(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    let requerimiento = []
    let cuadre = []
    let consulta = null

    if (data.id) {
      // cabecera = (await AlmacenModel.getMovimientoCab(data.id))[0]
      // detalle = await AlmacenModel.getMovimientoDet(data.id)
      [cabecera,requerimiento,detalle,cuadre] = await AlmacenModel.getMovimientosAlmacenById(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }

    console.log("La informacion consultada es la siguiente:",cabecera, detalle, cuadre)
    // return {ok:true,message:'ok'}
    // res.send({ ok: true, message: 'ok' })
    // exit()
    // console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho.png')
    const BINARY_CHUNKS4 = await fs.readFile('public/images/cuadre_tela.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El tipo de pedido es :", tipo)

    // ════════════════════════════════════════════════════════════════════════
    // [v2 2026-06-24 10:05] ADAPTADOR + AUTO-SWITCH a la guía de traslado v2.
    //   Por qué: views/v2/guia_traslado.handlebars consume datos NORMALIZADOS.
    //   Se mapean usando los MISMOS campos que ya lee el helper `foo` del flat
    //   (producto/color/rollos/cantidad/unidad/despacho) — probados en producción.
    //   Seguridad: solo conmuta a v2 si NO es avíos (v2/guia_traslado cubre solo
    //   telas) y la fecha de emisión es >= 2026-07-01 (getTemplateVersion). Para
    //   fechas previas o modo avíos se mantiene la plana 'guia_traslado'.
    //   ⚠️ PENDIENTE antes del corte: validar en staging con un documento real;
    //   falta cubrir el modo avíos en v2.
    // ════════════════════════════════════════════════════════════════════════
    const _fmtISO = (ddmmyyyy) => {
      if (!ddmmyyyy || typeof ddmmyyyy !== 'string') return ''
      const [d, m, y] = ddmmyyyy.split(' ')[0].split('/')
      return (y && m && d) ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : ''
    }
    const _fechaEmisionISO = _fmtISO(cabecera.fec_Emision_DOC)
    const _detalleV2 = (detalle ?? []).map(item => ({
      descripcion: `${item.producto ?? ''} ${item.color ?? ''}`.trim(),
      rollos: item.rollos ?? '',
      cantidad: item.cantidad ?? '',
      unidad: item.unidad ?? '',
      salida: item.despacho ?? '',
    }))
    const _totalSalidaV2 = _detalleV2
      .reduce((acc, it) => acc + (parseFloat(it.salida) || 0), 0)
      .toFixed(2)
    const _plantillaGuiaTraslado = (tipo !== 'avios')
      ? getTemplateVersion(_fechaEmisionISO, 'guia_traslado', 'v2/guia_traslado')
      : 'guia_traslado'
    const _usaV2 = _plantillaGuiaTraslado.startsWith('v2/')
    console.log('[v2] guia_traslado → plantilla:', _plantillaGuiaTraslado, '| fechaISO:', _fechaEmisionISO)

    res.render(
      // [v2 2026-06-24 10:05] plantilla por fecha/modo (antes fijo: 'guia_traslado')
      _plantillaGuiaTraslado,
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        datos: requerimiento,
        // [v2 2026-06-24 10:05] detalle normalizado si la plantilla es v2; crudo si es plana.
        detalle: _usaV2 ? _detalleV2 : detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
        // [v2 2026-06-24 10:05] Contexto adicional para v2/guia_traslado (la plana lo ignora):
        documentTitle: 'GUÍA DE TRASLADO',
        documentNumber: requerimiento?.nro_requerimiento ?? '',
        documentDate: cabecera.fec_Emision_DOC ?? '',
        tipoDocumento: 'guia-traslado',
        proveedor: { nom: requerimiento?.proveedor ?? '', ruc: requerimiento?.ruc ?? '' },
        cabecera: { orden_ref: requerimiento?.nro_requerimiento ?? '' },
        totalSalida: _totalSalidaV2,
        firmas: ['AUXILIAR DE ALMACEN', 'JEFE DE CORTE'],
        date: _fechaEmisionISO,
        time: '',
        helpers: {
          fechaCorta(fechaStr) {
            let formateo = ''
            if (fechaStr) {
              const partes = fechaStr.split('/');
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const anio = parseInt(partes[2], 10);

              const fecha = new Date(anio, mes, dia);
              const nombreMes = fecha.toLocaleString('es-ES', { month: 'short' });
              formateo = `${dia}-${nombreMes}`;
              console.log("La fecha corta es:", nombreMes)
            }
            return formateo
          },
          foo(items) {
            let itemsAsHtml = null
            let extra = 20 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;">` + `${item['producto']} ${item['color']}` + `</td>
                <td style="width:60px;text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['despacho'] + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:left;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width: 60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width: 60px;text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['despacho']); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                <td style="width:60px;text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          },
          fuu(items) {
            let itemsAsHtml = null
            let extra = 20 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td>` + `${item['producto']} ${item['color']}` + `</td>
                <td style="text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['tizado'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['peso'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['panios'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) ) + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['liquidacion'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['merma'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) + (item['liquidacion'] && 0) + (item['merma'] && 0)) + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:left;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += (valor['tizado'] ?? 0)*(valor['panios'] ?? 0) + (valor['liquidacion'] && 0) + (valor['merma'] && 0); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                <td style="text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          }
        },

      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            // format: 'A4',
            width: '20cm',
            height: '27.94cm',
            landscape: false,
            printBackground: true,
            margin: {
              left: 0,
              right: 0
            }
            , scale: 1
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async VistaPreviaDespacho(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    let requerimiento = []
    let cuadre = []
    let consulta = null

    if (data.id) {
      // cabecera = (await AlmacenModel.getMovimientoCab(data.id))[0]
      // detalle = await AlmacenModel.getMovimientoDet(data.id)
      [cabecera,requerimiento,detalle,cuadre] = await AlmacenModel.getMovimientosAlmacenById(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }

    console.log("La informacion consultada es la siguiente:",cabecera, detalle, cuadre)
    // return {ok:true,message:'ok'}
    // res.send({ ok: true, message: 'ok' })
    // exit()
    // console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    // const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho_title.png')
    const BINARY_CHUNKS4 = await fs.readFile('public/images/cuadre_tela.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El tipo de pedido es :", tipo)
    // [v2 2026-06-24 10:35] Auto-switch a v2/guia_movimiento_almacen (telas) por fecha.
    //   Solo telas (tipo != 'avios') con emisión >= 2026-07-01 conmuta a v2.
    const _fechaMovISO = fechaDocISO(cabecera.fec_Emision_DOC)
    // [fix 2026-06-26] V2 consistente en el preview: si no hay fecha de emisión (documento aún no
    //   emitido), se selecciona la plantilla con la fecha de HOY -> v2. Igual criterio que avíos.
    const _fechaTplMovISO = _fechaMovISO || new Date().toLocaleDateString('en-CA')
    const _tplMov = seleccionarPlantilla(_fechaTplMovISO, 'guia_movimiento_almacen', 'v2/guia_movimiento_almacen', tipo !== 'avios')
    const _movV2 = adaptMovimiento(detalle)
    const _usaV2Mov = _tplMov.startsWith('v2/')
    res.render(
      _tplMov, // [v2 2026-06-24 10:35] antes fijo: 'guia_movimiento_almacen'
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        // [v2 2026-06-24 10:35] cabecera normalizada si v2; cruda si plana (la plana usa el helper encabezado).
        cabecera: _usaV2Mov
          ? { tipoMov: cabecera.cod_comprobante == 'INGR' ? 'INGRESO' : 'RETIRO', orden_ref: requerimiento?.nro_requerimiento ?? '' }
          : cabecera,
        datos: requerimiento,
        detalle: _usaV2Mov ? _movV2.detalle : detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
        // [v2 2026-06-24 10:35] contexto v2 (la plana lo ignora):
        documentTitle: 'GUÍA DE MOVIMIENTO DE ALMACÉN',
        documentNumber: requerimiento?.nro_requerimiento ?? '',
        documentDate: cabecera.fec_Emision_DOC ?? '',
        tipoDocumento: 'guia-movimiento',
        proveedor: { nom: cabecera.Raz_social_DOC ?? '', ruc: cabecera.Nro_Doc_Prov ?? '' },
        // [feat 2026-06-26] Bloque UNIFICADO compacto para el formato DOBLE de la guía de
        //   movimiento (telas): además de lo que ya trae el partial compacto, incluye fecha de
        //   pedido/entrega, producción, número de contacto y forma de pago (del requerimiento).
        despachoInfo: _usaV2Mov ? {
          tipoMov: cabecera.cod_comprobante == 'INGR' ? 'INGRESO' : 'RETIRO',
          nroOrden: cabecera.oc ?? '',
          modelo: cabecera.modelo ?? '',
          articulo: cabecera.articulo ?? '',
          giradoPor: cabecera.usuario ?? '',
          fechaPedido: requerimiento?.fec_emision ?? '',
          fechaEntrega: requerimiento?.fec_retorno ?? '',
          produccion: requerimiento?.produccion ?? '',
          contacto: requerimiento?.nro_contacto ?? '',
          formaPago: requerimiento?.forma_pago ?? '',
        } : null,
        datosUnificados: _usaV2Mov,
        totalSalida: _movV2.totalSalida,
        firmas: ['AUXILIAR DE ALMACEN', 'JEFE DE CORTE'],
        date: _fechaMovISO,
        time: '',
        helpers: {
          fechaCorta(fechaStr) {
            let formateo = ''
            if (fechaStr) {
              const partes = fechaStr.split('/');
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const anio = parseInt(partes[2], 10);

              const fecha = new Date(anio, mes, dia);
              const nombreMes = fecha.toLocaleString('es-ES', { month: 'short' });
              formateo = `${dia}-${nombreMes}`;
              console.log("La fecha corta es:", nombreMes)
            }
            return formateo
          },
          encabezado(datos){
            let info = undefined
            let motivo = datos.motivo ?? 'ajt'
            if(motivo == 'crt'){
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">PROVEEDOR: </strong>`+ datos.Raz_social_DOC +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">OP: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">RUC: </strong>` + datos.Nro_Doc_Prov + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO CORTE: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO REQUERIMIENTO: </strong>`+ datos.nro_requerimiento +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>-</td>
              </tr>`
            }else{
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">PROVEEDOR: </strong>`+ datos.Raz_social_DOC +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">TIPO MOV.: </strong>`+ (datos.cod_comprobante == 'INGR' ? 'INGRESO' : 'RETIRO') +`</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">RUC: </strong>` + datos.Nro_Doc_Prov + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>` + datos.usuario + `</td>
              </tr>
              `
            }
            return info
          },
          foo(items) {
            let itemsAsHtml = null
            let extra = 20 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;font-size:10px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;font-size:12px;">` + `${item['nom']} ${item['color']}(#Lt-${item['num_lote']})` + `</td>
                <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['metros'] ? item['metros'] : '') + `</td>
                <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['comprometido'] + `</td>
                <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="font-size:12px;text-align: center;background-color:#ddebf7;">` + item['Cant_despacho_DET'] + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:left;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width: 60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width: 60px;text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(tipo == 'avios' ? valor['despacho'] : valor['Cant_despacho_DET']); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                <td style="width:60px;text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          },
          fuu(items) {
            let itemsAsHtml = null
            let extra = 20 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td>` + `${item['producto']} ${item['color']}` + `</td>
                <td style="text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['tizado'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['peso'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['panios'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) ) + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['liquidacion'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['merma'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) + (item['liquidacion'] && 0) + (item['merma'] && 0)) + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:left;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += (valor['tizado'] ?? 0)*(valor['panios'] ?? 0) + (valor['liquidacion'] && 0) + (valor['merma'] && 0); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                <td style="text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          }
        },

      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          // [feat 2026-06-26] En v2 (formato DOBLE) la hoja va HORIZONTAL (apaisada), igual que el
          //   despacho de avíos; la plana (fallback) se mantiene vertical.
          const pdfOptions = _usaV2Mov
            ? {
                width: '27.94cm',
                height: '20cm',
                landscape: true,
                printBackground: true,
                margin: { left: 0, right: 0 },
                scale: 1
              }
            : {
                // format: 'A4',
                width: '20cm',
                height: '27.94cm',
                landscape: false,
                printBackground: true,
                margin: {
                  left: 0,
                  right: 0
                }
                , scale: 1
              };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async VistaPreviaDespachoCorteTelas(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    let requerimiento = []
    let cuadre = []
    let consulta = null

    if (data.id) {
      // cabecera = (await AlmacenModel.getMovimientoCab(data.id))[0]
      // detalle = await AlmacenModel.getMovimientoDet(data.id)
      [cabecera,requerimiento,detalle,cuadre] = await AlmacenModel.getMovimientosAlmacenById(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }

    console.log("La informacion consultada es la siguiente:",cabecera, detalle, cuadre)
    // return {ok:true,message:'ok'}
    // res.send({ ok: true, message: 'ok' })
    // exit()
    // console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    // const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho_title.png')
    const BINARY_CHUNKS4 = await fs.readFile('public/images/cuadre_tela.png')
    const BINARY_CHUNKS5 = await fs.readFile('public/images/requerimiento.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El reporte dei imporesion de desoacho de tellas")
    console.log("El tipo de pedido es :", tipo)
    // [v2 2026-06-24 10:40] Auto-switch a v2 despacho de almacén (avíos/telas) por fecha.
    //   avíos/telas se decide por Suc_Tienda==508 (igual que el ternario flat).
    const _isAviosDesp = cabecera.Suc_Tienda == '508'
    const _flatDesp = _isAviosDesp ? 'guia_despacho_almacen_avios_v2' : 'guia_despacho_almacen_telas'
    const _v2Desp = _isAviosDesp ? 'v2/guia_despacho_almacen_avios_v2' : 'v2/guia_despacho_almacen_telas'
    const _fechaDespISO = fechaDocISO(cabecera.fec_Emision_DOC)
    const _tplDesp = seleccionarPlantilla(_fechaDespISO, _flatDesp, _v2Desp)
    const _despV2 = adaptDespachoAlmacen(detalle, _isAviosDesp)
    const _usaV2Desp = _tplDesp.startsWith('v2/')
    res.render(
      _tplDesp, // [v2 2026-06-24 10:40] antes: ternario Suc_Tienda 508 fijo
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        BINARY_CHUNKS5: BINARY_CHUNKS5.toString('base64'),
        // [v2 2026-06-24 10:40] cabecera normalizada si v2; cruda si plana (helper encabezado).
        cabecera: _usaV2Desp ? { orden_ref: requerimiento?.nro_requerimiento ?? '' } : cabecera,
        datos: requerimiento,
        detalle: _usaV2Desp ? _despV2.detalle : detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
        // [v2 2026-06-24 10:40] contexto v2 (la plana lo ignora):
        documentTitle: _isAviosDesp ? 'GUÍA DE DESPACHO - AVÍOS' : 'GUÍA DE DESPACHO - TELAS',
        documentNumber: requerimiento?.nro_requerimiento ?? '',
        documentDate: cabecera.fec_Emision_DOC ?? '',
        tipoDocumento: 'guia-despacho',
        proveedor: { nom: cabecera.Raz_social_DOC ?? '', ruc: cabecera.Nro_Doc_Prov ?? '' },
        totalSalida: _despV2.totalSalida,
        firmas: ['ALMACÉN', 'RECIBE'],
        date: _fechaDespISO,
        time: '',
        helpers: {
          fechaCorta(fechaStr) {
            let formateo = ''
            if (fechaStr) {
              const partes = fechaStr.split('/');
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const anio = parseInt(partes[2], 10);

              const fecha = new Date(anio, mes, dia);
              const nombreMes = fecha.toLocaleString('es-ES', { month: 'short' });
              formateo = `${dia}-${nombreMes}`;
              console.log("La fecha corta es:", nombreMes)
            }
            return formateo
          },
          encabezado(datos){
            let info = undefined
            let motivo = datos.motivo ?? 'ajt'
            if(motivo == 'crt'){
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">PROVEEDOR: </strong>`+ datos.Raz_social_DOC +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">OP: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">RUC: </strong>` + datos.Nro_Doc_Prov + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO CORTE: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO REQUERIMIENTO: </strong>`+ datos.nro_requerimiento +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>-</td>
              </tr>`
            }else{
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">OP.: </strong>`+ datos.oc +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">ARTICULO: </strong>`+ datos.articulo +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">MODELO: </strong>`+ datos.modelo +`</td>
              </tr>
              <tr >
              <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">TIPO MOV.: </strong>`+ (datos.cod_comprobante == 'INGR' ? 'INGRESO' : 'RETIRO') + `</td>
              <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>` + datos.usuario + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;"></strong></td>
              </tr>
              `
            }
            return info
          },
          foo(items) {
            let itemsAsHtml = null
            let extra = 30 - items.length
            if (tipo == 'AVIOS') {
              // itemsAsHtml = items.map((item, key) => `
              // <tr style="height:22px;">
              //   <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
              //   <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
              //   <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
              //   <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
              //   <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
              //   <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
              //   <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
              //   <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
              //   <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              // </tr>`)
              console.log("Dentro de la generacion de reporte de avios")
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:160px;text-align: center;">` + item['nom'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['comprometido'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['Cant_despacho_DET'] + `</td>
              </tr>`)
            } else {
              console.log("Dentro de la generacion de reporte de telas")
              console.log("HOlalaa",items[0].info_rollos)
              itemsAsHtml = items.map((item, key) =>{
                return `<tr style="height:22px;font-size:10px;">
                  <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                  <td style="width:60px;font-size:12px;">` + `${item['nom']} ${item['color']}(#Lt-${item['num_lote']})` + `</td>
                  <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                  <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['peso'] ? item['peso'] : '') + `</td>
                  <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['comprometido'] + `</td>
                  <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                  <td style="font-size:12px;text-align: center;background-color:#ddebf7;">` + item['Cant_despacho_DET'] + `</td>
                </tr>
                ${
                  item.info_rollos.map((row,key)=>`
                    <tr>
                      <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                      <td style="width:60px;font-size:10px;text-align:right;">${item['nom']}(${row.partida ?? '-'}) Rollo # ${key + 1}</td>
                      <td style="width:60px;font-size:10px;text-align:center;background-color:#ddebf7;">-</td>
                      <td style="width:60px;font-size:10px;text-align:center;background-color:#ddebf7;">${row.peso}</td>
                      <td style="width:60px;font-size:10px;text-align: center;background-color:#ddebf7;">-</td>
                      <td style="width:60px;font-size:10px;text-align: center;background-color:#ddebf7;">-</td>
                      <td style="font-size:10px;text-align: center;background-color:#ddebf7;">${row.cantidad}</td>
                    </tr>
                  `).join("\n")
                }
                `
              })
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'AVIOS'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:left;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(tipo == 'avios' ? valor['despacho'] : valor['Cant_despacho_DET']); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'AVIOS' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                ${tipo == 'AVIOS' ? '<td style="width:60px;text-align: center;"></td>' : ''}
                <td style="width:60px;text-align: center;"></td>
                ${tipo == 'AVIOS' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'AVIOS' ? '<td style="width:60px;text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          },
          fuu(items) {
            let itemsAsHtml = null
            let extra = 20 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td>` + `${item['producto']} ${item['color']}` + `</td>
                <td style="text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['tizado'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['peso'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['panios'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) ) + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['liquidacion'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['merma'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) + (item['liquidacion'] && 0) + (item['merma'] && 0)) + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:left;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += (valor['tizado'] ?? 0)*(valor['panios'] ?? 0) + (valor['liquidacion'] && 0) + (valor['merma'] && 0); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                <td style="text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          }
        },

      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            // format: 'A4',
            width: '20cm',
            height: '27.94cm',
            landscape: false,
            printBackground: true,
            margin: {
              left: 0,
              right: 0
            }
            , scale: 1
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async VistaPreviaDespachoCorteAvios(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    let requerimiento = []
    let cuadre = []
    let consulta = null

    if (data.id) {
      // cabecera = (await AlmacenModel.getMovimientoCab(data.id))[0]
      // detalle = await AlmacenModel.getMovimientoDet(data.id)
      [cabecera,requerimiento,detalle,cuadre] = await AlmacenModel.getMovimientosAlmacenById(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }

    console.log("La informacion consultada es la siguiente:",cabecera, detalle, cuadre)
    // return {ok:true,message:'ok'}
    // res.send({ ok: true, message: 'ok' })
    // exit()
    // console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    // const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_despacho_title.png')
    const BINARY_CHUNKS4 = await fs.readFile('public/images/cuadre_tela.png')
    const BINARY_CHUNKS5 = await fs.readFile('public/images/requerimiento.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El reporte dei imporesion de desoacho de tellas")
    console.log("El tipo de pedido es :", tipo)
    // [v2 2026-06-24 10:41] Auto-switch a v2 despacho de almacén (avíos/telas) por fecha.
    const _isAviosDesp = cabecera.Suc_Tienda == '508'
    const _flatDesp = _isAviosDesp ? 'guia_despacho_almacen_avios_v2' : 'guia_despacho_almacen_telas'
    const _v2Desp = _isAviosDesp ? 'v2/guia_despacho_almacen_avios_v2' : 'v2/guia_despacho_almacen_telas'
    const _fechaDespISO = fechaDocISO(cabecera.fec_Emision_DOC)
    // [fix 2026-06-26] V2 CONSISTENTE en el preview de despacho de corte AVÍOS.
    //   Problema: en la vista previa el documento aún NO está emitido, por lo que
    //   cabecera.fec_Emision_DOC suele venir vacío -> fechaDocISO('') => '' ->
    //   getTemplateVersion(new Date('T00:00:00') = Invalid Date) cae SIEMPRE a la
    //   plantilla PLANA (diseño viejo), aunque el documento guardado/exportado sí usa v2.
    //   Solución acotada a ESTA ruta: si no hay fecha de emisión, se elige la plantilla
    //   usando la fecha de HOY (que está por encima del corte 2026-01-01) -> v2.
    //   No se altera ningún dato mostrado: `date` sigue usando _fechaDespISO original;
    //   solo cambia la fecha usada para SELECCIONAR la plantilla. Si la fecha SÍ existe,
    //   el gate por fecha se respeta igual que antes.
    const _fechaTplISO = _fechaDespISO || new Date().toLocaleDateString('en-CA') // 'YYYY-MM-DD' local
    const _tplDesp = seleccionarPlantilla(_fechaTplISO, _flatDesp, _v2Desp)
    const _despV2 = adaptDespachoAlmacen(detalle, _isAviosDesp)
    const _usaV2Desp = _tplDesp.startsWith('v2/')
    res.render(
      _tplDesp, // [v2 2026-06-24 10:41] antes: ternario Suc_Tienda 508 fijo
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        BINARY_CHUNKS5: BINARY_CHUNKS5.toString('base64'),
        // [v2 2026-06-24 10:41] cabecera normalizada si v2; cruda si plana (helper encabezado).
        cabecera: _usaV2Desp ? { orden_ref: requerimiento?.nro_requerimiento ?? '' } : cabecera,
        correlativo: String(cabecera.id_CAB).padStart(8,'0'),
        datos: requerimiento,
        detalle: _usaV2Desp ? _despV2.detalle : detalle,
        cuadre: cuadre,
        motivo: cabecera.motivo == 'prd' ? 'PRODUCCION' : 'AJUSTE',
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
        // [v2 2026-06-24 10:41] contexto v2 (la plana lo ignora):
        documentTitle: _isAviosDesp ? 'GUÍA DE DESPACHO - AVÍOS' : 'GUÍA DE DESPACHO - TELAS',
        // [fix 2026-06-26] N° de guía en la cabecera v2. La guía plana de avíos mostraba el
        //   correlativo (#{{correlativo}}) como número del documento, pero v2 estaba poniendo
        //   nro_requerimiento, por lo que el "número de guía" no aparecía. Para avíos usamos el
        //   correlativo (mismo valor que el contexto `correlativo`); telas queda igual que antes.
        //   ANTERIOR (comentado, no eliminar):
        //   documentNumber: requerimiento?.nro_requerimiento ?? '',
        documentNumber: _isAviosDesp ? String(cabecera.id_CAB ?? '').padStart(8, '0') : (requerimiento?.nro_requerimiento ?? ''),
        documentDate: cabecera.fec_Emision_DOC ?? '',
        tipoDocumento: 'guia-despacho',
        proveedor: { nom: cabecera.Raz_social_DOC ?? '', ruc: cabecera.Nro_Doc_Prov ?? '' },
        // [fix 2026-06-26] Misma información de cabecera que tenía la guía PLANA de avíos y que v2
        //   no estaba pasando: N° de orden, fecha de pedido, fecha de entrega, modelo, artículo,
        //   girado por y motivo. Se arma desde la cabecera cruda del movimiento (el objeto local
        //   `cabecera`, que aquí conserva todos los campos aunque la clave `cabecera` del contexto
        //   se reescriba para v2). El partial lo pinta en la sección "Datos de la guía".
        //   Nota: la plana rotulaba el único dato de fecha como "FECHA ENTREGA" (= fec_Emision_DOC)
        //   y "FECHA PEDIDO" salía "-"; se respeta ese criterio.
        despachoInfo: _usaV2Desp && _isAviosDesp ? {
          nroOrden: cabecera.oc ?? '',
          fechaPedido: '',
          fechaEntrega: cabecera.fec_Emision_DOC ?? '',
          modelo: cabecera.modelo ?? '',
          articulo: cabecera.articulo ?? '',
          giradoPor: cabecera.usuario ?? '',
          motivo: cabecera.motivo == 'prd' ? 'PRODUCCION' : 'AJUSTE',
          responsable: cabecera.responsable ?? '',
        } : null,
        // [feat 2026-06-26] Activa el bloque UNIFICADO (proveedor + datos de la guía) en el
        //   formato doble: el layout `guia-ingreso-doble` omite su `datos-proveedor-general`
        //   y el cuerpo de la plantilla de avíos pinta un único bloque compacto con ambos.
        datosUnificados: _usaV2Desp && _isAviosDesp,
        totalSalida: _despV2.totalSalida,
        firmas: ['ALMACÉN', 'RECIBE'],
        date: _fechaDespISO,
        time: '',
        helpers: {
          fechaCorta(fechaStr) {
            let formateo = ''
            if (fechaStr) {
              const partes = fechaStr.split('/');
              const dia = parseInt(partes[0], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const anio = parseInt(partes[2], 10);

              const fecha = new Date(anio, mes, dia);
              const nombreMes = fecha.toLocaleString('es-ES', { month: 'short' });
              formateo = `${dia}-${nombreMes}`;
              console.log("La fecha corta es:", nombreMes)
            }
            return formateo
          },
          encabezado(datos){
            let info = undefined
            let motivo = datos.motivo ?? 'ajt'
            if(motivo == 'crt'){
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">PROVEEDOR: </strong>`+ datos.Raz_social_DOC +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">OP: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">RUC: </strong>` + datos.Nro_Doc_Prov + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO CORTE: </strong>-</td>
              </tr>
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">NRO REQUERIMIENTO: </strong>`+ datos.nro_requerimiento +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>-</td>
              </tr>`
            }else{
              info = `
              <tr >
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">OP.: </strong>`+ datos.oc +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">ARTICULO: </strong>`+ datos.articulo +`</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">MODELO: </strong>`+ datos.modelo +`</td>
              </tr>
              <tr >
              <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">TIPO MOV.: </strong>`+ (datos.cod_comprobante == 'INGR' ? 'INGRESO' : 'RETIRO') + `</td>
              <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;">GIRADO POR: </strong>` + datos.usuario + `</td>
                <td style="font-weight:100;font-size: 14px;"><strong style="font-size: 14px;font-weight:100;"></strong></td>
              </tr>
              `
            }
            return info
          },
          foo(items) {
            let itemsAsHtml = null
            let extra = 45 - items.length
            if (tipo == 'AVIOS') {
              // itemsAsHtml = items.map((item, key) => `
              // <tr style="height:22px;">
              //   <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
              //   <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
              //   <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
              //   <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
              //   <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
              //   <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
              //   <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
              //   <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
              //   <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              // </tr>`)
              console.log("Dentro de la generacion de reporte de avios")
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:160px;text-align: left;">` + (item['nom'] + ' ' + item['talla'] + ' ' + item['color'] ) + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['Cant_despacho_DET'] + `</td>
              </tr>`)
            } else {
              console.log("Dentro de la generacion de reporte de telas")
              console.log("HOlalaa",items[0].info_rollos)
              itemsAsHtml = items.map((item, key) =>{
                return `<tr style="height:22px;font-size:10px;">
                  <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                  <td style="width:60px;font-size:12px;">` + `${item['nom']} ${item['color']}(#Lt-${item['num_lote']})` + `</td>
                  <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                  <td style="width:60px;font-size:12px;text-align:center;background-color:#ddebf7;">` + (item['peso'] ? item['peso'] : '') + `</td>
                  <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['comprometido'] + `</td>
                  <td style="width:60px;font-size:12px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                  <td style="font-size:12px;text-align: center;background-color:#ddebf7;">` + item['Cant_despacho_DET'] + `</td>
                </tr>
                ${
                  item.info_rollos.map((row,key)=>`
                    <tr>
                      <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                      <td style="width:60px;font-size:10px;text-align:right;">${item['nom']}(${row.partida ?? '-'}) Rollo # ${key + 1}</td>
                      <td style="width:60px;font-size:10px;text-align:center;background-color:#ddebf7;">-</td>
                      <td style="width:60px;font-size:10px;text-align:center;background-color:#ddebf7;">${row.peso}</td>
                      <td style="width:60px;font-size:10px;text-align: center;background-color:#ddebf7;">-</td>
                      <td style="width:60px;font-size:10px;text-align: center;background-color:#ddebf7;">-</td>
                      <td style="font-size:10px;text-align: center;background-color:#ddebf7;">${row.cantidad}</td>
                    </tr>
                  `).join("\n")
                }
                `
              })
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'AVIOS'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align:center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(tipo == 'AVIOS' ? valor['despacho'] : valor['Cant_despacho_DET']); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                <td style="width:60px;text-align: center;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          },
          fuu(items) {
            let itemsAsHtml = null
            let extra = 40 - items.length
            if (tipo == 'avios') {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
                <td style="width:60px;text-align: center;">` + item['corte'] + `</td>
                <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
                <td style="width:60px;text-align:left;background-color:#ddebf7;">` + item['color'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
              </tr>`)
            } else {
              itemsAsHtml = items.map((item, key) => `
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td>
                <td>` + `${item['producto']} ${item['color']}` + `</td>
                <td style="text-align:center;background-color:#ddebf7;">` + (item['rollos'] ? item['rollos'] : '') + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['tizado'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['peso'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['panios'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) ) + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['liquidacion'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + item['merma'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + ( (item['tizado'] ?? 0)*(item['panios'] ?? 0) + (item['liquidacion'] && 0) + (item['merma'] && 0)) + `</td>
              </tr>`)
            }
            for (let i = 0; i < extra; i++) {
              tipo == 'avios'
                ?
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:left;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
                :
                itemsAsHtml.push(`
                  <tr style="height:22px;">
                    <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;"></td>
                    <td style="text-align:center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += (valor['tizado'] ?? 0)*(valor['panios'] ?? 0) + (valor['liquidacion'] && 0) + (valor['merma'] && 0); return carry }, 0).toFixed(2)
            itemsAsHtml.push(`
              <tr style="height:22px;">
                <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                ${tipo == 'avios' ? '<td style="text-align: center;"></td>' : ''}
                <td style="text-align: center;"></td>
                ${tipo == 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                ${tipo !== 'avios' ? '<td style="text-align: center;background-color:#ddebf7;"></td>' : ''}
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"></td>
                <td style="text-align: center;background-color:#ddebf7;"><strong>TOTAL</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          },
          consolidado(items) {
            let itemsAsHtml = ''
            let extra = 12 - items.length
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['Cant_despacho_DET']); return carry }, 0).toFixed(2)

            itemsAsHtml = `
              <div style="height:14px;padding-top:5px;border-top:1px solid black;">
                <div style="text-align:left;display:flex;flex-direction: row;">
                  <div style='font-size:8px;'><strong>OBS:</strong> Una vez recibidos los avíos, cuenta con 48 horas hábiles para reportar cualquier incidencia. Pasado este plazo, el envío se considerará <br/> conforme y cualquier solicitud adicional será facturada como un pedido nuevo. Para cualquier duda y consulta adicional comunicarse al número <strong>901276957</strong>.</div>
                  <div style="flex:1;text-align:right;font-weight:bold;">TOTAL</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">${total}</div>
                </div>
              </div>
            `
            return itemsAsHtml
          }
        },

      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = cabecera.Suc_Tienda == '508' 
          ? 
            {
              // format: 'A4',
              // [fix 2026-06-26] Hoja HORIZONTAL (apaisada) para el despacho de avíos en formato
              //   doble: dos copias verticales una al lado de la otra. Se intercambian las
              //   dimensiones (antes 20 x 27.94 vertical -> ahora 27.94 x 20 horizontal).
              //   ANTERIOR (comentado, no eliminar): width: '20cm', height: '27.94cm',
              width: '27.94cm',
              height: '20cm',
              landscape: true,
              printBackground: true,
              margin: {
                left: 0,
                right: 0
              }
              , scale: 1
            }
          :
            {
              // format: 'A4',
              width: '20cm',
              height: '27.94cm',
              landscape: false,
              printBackground: true,
              margin: {
                left: 0,
                right: 0
              }
              , scale: 1
            };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async getInfoCuadreTelas(req,reply){
    const idmov = req.params.idmov
    const data = await AlmacenModel.getInfoCuadreTelas(idmov)
    reply.send(data)
  }
  // static async saveInfoCuadreTelas(req,reply){
  //   const idmov = req.params.idmov
  //   const data = await AlmacenModel.saveInfoCuadreTelas(idmov)
  //   reply.send(data)
  // }
  static async updateInfoCuadreTelas(req,reply){
    let id = req.params.idmov ?? 0
    let info = req.body
    const data = await AlmacenModel.updateInfoCuadreTelas(info,id)
    reply.send(data)
  }
  static async deleteInfoCuadreTelas(req,reply){
    const idmov = req.params.idmov
    const data = await AlmacenModel.deleteInfoCuadreTelas(idmov)
    reply.send(data)
  }
  static async getInfoEtiqueta(req,reply){
    const idprod = req.params.idprod
    const data = await AlmacenModel.getInfoEtiqueta(idprod)
    reply.send(data)
  }
  static async printEtiquetas(req, res) {
    const data = req.body
    let canvas = new Canvas(100,50)
    console.log("La info del body es:",data)
    // const COUNTRY_CODE = '775';
    // const CODE_COMPANY = '0062';
    // const PRE_CODEBAR = COUNTRY_CODE + CODE_COMPANY + ('00000' + $idx_subprod).slice()
    // const CODEBAR = numControlBarcode(PRE_CODEBAR)
    let conn = null
    try {
      // conn = await mysql.createConnection(configs[1])
      // await conn.connect()
      
      // let consulta = await conn.execute("select *from tbl2_subproductos")

    } catch (error) {
      
    } finally {
      // if(conn) await conn.end()
    }

    // const jsbarcode = createRequire("/home/juanjhonv/proyects/api_rest_expressDev/JsBarcode.js");
    JsBarcode(canvas,'7750062152898',{
      format:"EAN13",
      displayValue:false,
      height:12,
      width:1,
      margin:0,
      flat:true
    })
    let inf = canvas.toBuffer('image/png')

    /////////////////////////////////////////
    const cantidad = 5
    const combinacion = data.colores.length * data.tallas.length
    const calculo = Math.floor(Math.ceil((cantidad * combinacion)/3)*3/combinacion)
    // const calculo = Math.ceil(cantidad*combinacion/3)
    console.log("Datos generados:",combinacion,calculo)
    let base = [], group = [], acumulado = []
    Array(cantidad).fill('p').forEach((v)=>{
    // Array(calculo).fill('p').forEach((v)=>{
      data.colores.forEach((color,keyc)=>{
        const name_c = color.nom
        data.tallas.forEach((talla,keyt)=>{
          const name_t = talla.nom
          // group.push({
          //   color:name_c,
          //   talla:name_t
          // })
          // if (group.length == 3) {
          //   base.push(group)
          //   group = []
          // }
          acumulado.push({
            color:name_c,
            talla:name_t
          })
        })
      })
    })
    console.log("Infoi de acumulado es:",acumulado)

    const k = ()=>{
      let p = acumulado.shift()
      if(p){
        if(group.length == 3){
          base.push(group)
          group = []
          group.push(p)
        } else if(acumulado.length == 0) {
          group.push(p)  
          base.push(group)
          group = []
        } else {
          group.push(p)
        }
        k()
      } else {
        group.length > 0 && base.push(group)
      }
    }
    k()
    ///////////////////////////////////////

    // const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    res.render(
      'hangtag_formatoA',
      {
        BINARY_CHUNKS5: inf.toString('base64'),
        BASE:base,
        INFO:data.info,
        helpers: {
          foo(codebar,base,info){
            let info_print = []
            base.forEach((v)=>{
              const fila = v.map((row)=>{
                return `
                  <div class='etiqueta'>
                    <div>
                      <div style="font-size:.5rem;">OP:2500712</div>
                      <h2>${info.articulo}</h2>
                      <h2>${info.modelo}</h2>
                    </div>
                    <div>
                      <h3>${info.estilo}</h3>
                      <h3>${info.base}</h3>
                      <h3>${row.color.length > 8 ? row.color.substr(0,8) + '.' : row.color }</h3>
                      <h3>${info.tela}</h3>
                    </div>
                    <div>
                      <div style="display:flex;justify-content:space-between;">
                        <div>
                          ORIGINAL
                        </div>
                        <div>
                          <h3>${data.moneda == 'PEN' ? 'S/' : '$'}149.90</h3>
                        </div>
                      </div>
                      <div style="display:flex;justify-content:space-between;">
                        <div>
                          OFERTA
                        </div>
                        <div>
                          <h3>${data.moneda == 'PEN' ? 'S/' : '$'}149.90</h3>
                        </div>
                      </div>
                    </div>
                    <div>
                      <img src="data:image/jpg;base64,${codebar}"/>
                      <div id="idcodbar">7750062152898</div>
                    </div>
                    <div id="talla">${row.talla}</div>
                    <div class="bar" id="bar_left"></div>
                  </div>
                `
              })
              info_print.push('<div class="row">'+fila.join('')+'</div>')
            })
            // const example = 
            // const cuerpo = `<div class="etiqueta">${example}</div><div class="etiqueta">${example}</div><div class="etiqueta">${example}</div>`            
            return info_print.join('')
          }
        }
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            // format: 'A4',
            width: '107.5mm',
            height: '45mm',
            landscape: false,
            printBackground: true,
            margin: {
              left: 0,
              right: 0,
              top:0,
              bottom:0
            }
            , scale: 1
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static getCodeBar(sku = null){
    try {
      let canvas = new Canvas(100,50)
      JsBarcode(canvas,sku,{
        format:"EAN13",
        displayValue:false,
        height:32,
        width:1,
        margin:0,
        flat:true
      })
      const INF = canvas.toBuffer('image/png')
      return INF.toString('base64')
    } catch (error) {
      console.log("Error al generar el codigo de barra:",error)
      throw new Error(error)
    }
  }
  static async printEtiquetasByOrden(req, res) {
    const data = req.body
    console.log("Info del body es:",data)

    const orden = JSON.parse(req.body.orden)
    let modelos = JSON.parse(req.body.modelos)
    const tallas = JSON.parse(req.body.tallas)
    const cantidad = req.body.cantidad ?? 0
    const distribucion = parseInt(req.body.distribucion ?? 0)
    const idorden = req.params.idorden ?? 0
    const moneda = req.body.moneda ?? 'PEN'
    let base = [], group = [], acumulado = []

    console.log("La info de la orden es la siguiente:",orden,modelos)
    
    const INFO = await ProductosService.searchProductoById(orden.id_receta)
    
    // modelos.filter(ob=>!Object.values(ob.sku).filter(v=>!v).length)
    // if(Object.values(modelos.sku).filter(v=>!v).length > 0){

    // }
    // console.log("El listado de los modelos es:", modelos, modelos.filter(ob=>Object.values(ob.sku).filter(v=>!v).length))
    // res.send({ok:false,mensaje:'Sku error'})
    // return 0

    try {

      if(!orden.precios){
        // throw new Error("Las lista de precios aún no se encuentra configurada. Verifique.")
        res.send({ok:false,mensaje:'Las lista de precios aún no se encuentra configurada. Verifique.'})
        return 0
      }

      console.log("Resultado de validaciones sku es:",modelos.filter(ob=>Object.values(ob.sku).filter(v=>!v).length > 0))

      if(modelos.filter(ob=>Object.values(ob.sku).filter(v=>!v).length > 0).length){
        res.send({ok:false,mensaje:'Existen modelos que no tienen configurado su SKU. Por favor verifique.'})
        return 0
      }

      const new_modelos = modelos.filter(row=>row.selected).reduce((carry,modelo)=>{
        const codebar = {}
        Object.keys(modelo.sku).forEach(async (key)=>{
          const CODEBAR = AlmacenController.getCodeBar(modelo.sku[key])
          codebar[key] = CODEBAR
        })
        carry.push({...modelo,codebar:codebar})
        return carry
      },[])
      console.log("La nueva reestructuracion es:",new_modelos)

      if (distribucion == 1) {
        for(const modelo of [...new_modelos]){
          tallas.filter(row=>row.selected).forEach(talla=>{
            if(parseInt(modelo.fracciones[talla.desc]) > 0){
              Array(parseInt(modelo.fracciones[talla.desc])).fill('p').forEach((v)=>{    
                acumulado.push({  
                  model:modelo,
                  talla:talla.desc,
                  color:modelo.color,
                  sku:modelo.sku[talla.desc],
                  codebar:modelo.codebar[talla.desc]
                })
              })
            }
          })
        }
      } else {
        Array(parseInt(cantidad)).fill('p').forEach((v,k)=>{
          new_modelos.forEach((modelo)=>{
            tallas.filter(row=>row.selected).forEach((talla)=>{
              acumulado.push({
                model:modelo,
                talla:talla.desc,
                color:modelo.color,
                sku:modelo.sku[talla.desc],
                codebar:modelo.codebar[talla.desc]
              })
            })
          })
        })
      }
      
    } catch (error) {
      console.log("Error al obtener la receta padre:",error)
      // res.send({ok:false,mensaje:error.message ?? error})
      // return 0
    }

    const k = ()=>{
      let p = acumulado.shift()
      if(p){
        if(group.length == 3){
          base.push(group)
          group = []
          group.push(p)
        } else if(acumulado.length == 0) {
          group.push(p)  
          base.push(group)
          group = []
        } else {
          group.push(p)
        }
        k()
      } else {
        group.length > 0 && base.push(group)
      }
    }
    k()

    console.log("La informacion de base es:",base)
    // res.send("Informacion de base procesada con exito")
    // return 0
    ///////////////////////////////////////

    // const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    res.render(
      'hangtag_formatoA',
      {
        // BINARY_CHUNKS5: inf.toString('base64'),
        BASE:base,
        INFO:INFO[0],
        MONEDA:moneda,
        ORDEN:orden,
        helpers: {
          foo(base, info, moneda, orden) {
            let info_print = []
            base.forEach((v) => {
              const fila = v.map((row) => {
                return `
          <div class='etiqueta'>
            <div class="columna-texto">
              <div>
                <div style="font-size:.3rem;">.</div>
                <div style="font-size:.3rem;">MODELO</div>
                <!-- ORIGINAL (se solapaba/cortaba con el barcode): <div style="font-size:11px;font-weight:bold;">\${row.model.articulo}</div> -->
                <div style="font-size:7px;font-weight:bold;line-height:1.05;overflow-wrap:anywhere;">${row.model.articulo}</div>
              </div>
              <div>
                <h3>${info.rubro}</h3>
                <h3>${info.base}</h3>
                <h3>${INFO[0].modelo}</h3>
                <!-- ORIGINAL (abreviaba color a 8 chars): \${row.color.length > 8 ? row.color.substr(0, 8) + '.' : row.color} -->
                <h3>${row.color}</h3>
                <h3>${info.presentacion}</h3>
              </div>
              <div>
                <h3>${orden.oc}</h3>
              </div>
              <div id="talla">
                <div style="font-size:1.8rem;width:40px;text-align:center;">${row.talla.toUpperCase()}</div>
              </div>
              <div style="height:35px;width:70px;"></div>
              <div style="margin-bottom:2px;">
                <div style="display:flex;flex-direction:column;justify-content:space-between;font-size:12px;">
                  <div style="font-size:6px;">PRECIO VENTA</div>
                  <div>
                    <h3 class="precio-valor">${moneda == 'PEN' ? 'S/' : '$'}${moneda == 'PEN' ? orden.precios[0].precio1[0].toFixed(2) : orden.precios[0].precio1[1].toFixed(2)}</h3>
                  </div>
                </div>
              </div>
              <div id=" ">
                <div></div><div></div><div></div><div></div><div></div>
                <div></div><div></div><div></div><div></div><div></div>
              </div>
            </div>
            <div class="columna-barcode">
              <img src="data:image/png;base64,${row.codebar}" alt="Código de barras">
            </div>
            <div class="bar" id="bar_left"></div>
          </div>
        `
              })
              info_print.push('<div class="row">' + fila.join('') + '</div>')
            })
            return info_print.join('')
          }
        }
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            // format: 'A4',
            width: '107.5mm',
            height: '45mm',
            landscape: false,
            printBackground: true,
            margin: {
              left: 0,
              right: 0,
              top:0,
              bottom:0
            }
            , scale: 1
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({ ok:true, data: pdfBuffer.toString('base64') })
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
}