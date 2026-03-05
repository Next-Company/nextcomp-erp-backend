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

export default class AlmacenController{
  static async getListaAlmacenes(req,reply){
    const search = req.params.search ?? ''
    const data = await AlmacenModel.getListaAlmacenes(search)
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
    res.render(
      'guia_traslado',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        datos: requerimiento,
        detalle: detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
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
    res.render(
      'guia_movimiento_almacen',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        cabecera: cabecera,
        datos: requerimiento,
        detalle: detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
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
    res.render(
      cabecera.Suc_Tienda == '508' ? 'guia_despacho_almacen_avios_v2' : 'guia_despacho_almacen_telas',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        BINARY_CHUNKS5: BINARY_CHUNKS5.toString('base64'),
        cabecera: cabecera,
        datos: requerimiento,
        detalle: detalle,
        cuadre: cuadre,
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
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
    res.render(
      cabecera.Suc_Tienda == '508' ? 'guia_despacho_almacen_avios_v2' : 'guia_despacho_almacen_telas',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        BINARY_CHUNKS4: BINARY_CHUNKS4.toString('base64'),
        BINARY_CHUNKS5: BINARY_CHUNKS5.toString('base64'),
        cabecera: cabecera,
        correlativo: String(cabecera.id_CAB).padStart(8,'0'),
        datos: requerimiento,
        detalle: detalle,
        cuadre: cuadre,
        motivo: cabecera.motivo == 'prd' ? 'PRODUCCION' : 'AJUSTE',
        emisor: cabecera.emisor == 'NEXT' ? 1 : 0,
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
              width: '20cm',
              height: '27.94cm',
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
      if(!modelos.filter(ob=>Object.values(ob.sku).filter(v=>!v).length).length){
        res.send({ok:false,mensaje:'Las lista de precios aún no se encuentra configurada. Verifique.'})
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
          foo(base,info,moneda,orden){
            let info_print = []
            base.forEach((v)=>{
              const fila = v.map((row)=>{
                return `
                  <div class='etiqueta'>
                    <div>
                      <div style="font-size:.3rem;">.</div>
                      <div style="font-size:.4rem;">${info.rubro}</div>
                      <div style="font-size:10px;font-weight:bold;">${row.model.articulo}</div>
                    </div>
                    <div>
                      <h3>${info.estilo}</h3>
                      <h3>${info.base}</h3>
                      <h3>${row.color.length > 8 ? row.color.substr(0,8) + '.' : row.color }</h3>
                      <h3>${info.presentacion}</h3>
                    </div>
                    <div>
                      <h3>${orden.oc}</h3>
                    </div>
                    <div style="height:35px;width:70px;"></div>
                    <div style="margin-bottom:2px;">
                      <div style="display:flex;flex-direction:column;justify-content:space-between;font-size:12px;">
                        <div style="font-size:6px;">
                          PRECIO VENTA
                        </div>
                        <div>
                          <h3>${moneda == 'PEN' ? 'S/' : '$'}${moneda == 'PEN' ? orden.precios[0].precio1[0].toFixed(2) : orden.precios[0].precio1[1].toFixed(2)}</h3>
                        </div>
                      </div>
                    </div>
                    <div id="footer-circles">
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                      <div></div>
                    </div>
                    <div style="transform:rotate(90deg);position:absolute;bottom:35px;right:-22px;">
                      <img src="data:image/jpg;base64,${row.codebar}"/>
                    </div>
                    <div id="talla">
                      <div>TALLA</div>
                      ${row.talla}                      
                    </div>
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