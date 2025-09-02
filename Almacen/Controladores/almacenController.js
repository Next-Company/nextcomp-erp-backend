import AlmacenModel from "../Servicios/almacenService.js"
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises'
import { exit } from "node:process";

export default class AlmacenController{
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
  static async saveGuia(req,reply){
    let info = req.body
    const data = await AlmacenModel.saveGuia(info)
    reply.send(data)
  }
  static async deleteGuia(req,reply){
    let id = req.params.idguia
    const data = await AlmacenModel.deleteGuia(id)
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
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_traslado.png')
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
}