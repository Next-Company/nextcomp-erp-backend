import ServiciosServiceModel from "../Servicios/serviciosServiceModel.js";
import fs from "node:fs/promises"
import puppeteer from 'puppeteer';

export default class ServiciosController{
  static async getServicios(req,res){
    const filtro = req.params.search ?? ''
    try {
      const info = await ServiciosServiceModel.getServicios(filtro)
      console.log("Respuesta del servidor:",info)
      res.status(200).json(info)
    } catch (error) {
      res.status(400).json(error)
    }
  }
  static async getServicioById(req,res){
    const id = req.params.id ?? ''
    try {
      const info = await ServiciosServiceModel.getServicioById(id)
      res.status(200).json(info)
    } catch (error) {
      res.status(400).json(error)
    }
  }
  static async saveServicio(req,res){
    const data = req.body
    try {
      const info = await ServiciosServiceModel.saveServicio(data)
      res.status(200).json(info)
    } catch (error) {
      res.status(400).json(error)
    }
  }
  static async updateServicio(req,res){
    const id = req.params.id ?? ''
    const data = req.body
    try {
      const info = await ServiciosServiceModel.updateServicio(id,data)
      res.status(200).json(info)
    } catch (error) {
      res.status(400).json(error)
    }
  }
  static async deleteServicio(req,res){
    const id = req.params.id ?? ''
    try {
      const info = await ServiciosServiceModel.deleteServicio(id)
      res.status(200).json(info)
    } catch (error) {
      res.status(400).json(error)
    }
  }
  static async printServicio(req, res) {
    console.log("Iniciando exportado del formato de avios otros")
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const data = req.body ?? {}
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    if(id !== '') {
      const data  = await ServiciosServiceModel.getServicioById(id)
      cabecera = data[0]
      detalle = data[2]
      console.log("La informacion de la orden de servicio es:", cabecera, detalle)
    } else {
      // if(data.id){
      //   cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      //   detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      // }else{
      //   cabecera = JSON.parse(data.info)
      //   detalle = JSON.parse(data.detalle)
      // }
    }
    ServiciosController.GenerarDocumentoServicio(cabecera,detalle,res,mode)
    // res.json({message: 'Funcionalidad en desarrollo'})
  }
  static async GenerarDocumentoServicio(cabecera,detalle,res,mode){
    console.log("Generando pedido avios, dentro del controller genera pedido avios")
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')
    res.render(
      'orden_servicio',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        datos: cabecera,
        detalle: detalle,
        helpers: {
          condicionPago(valor) {
            let forma = ''
            switch (valor) {
              case 1:
                forma = 'PAGO CONTRA ENTREGA'
                break;
              case 2:
                forma = 'PAGO PROGRAMADO'
                break;
              case 3:
                forma = 'PAGO SEMANAL'
                break;
              case 4:
                forma = 'PAGO CON ADELANTO + PROGRAMACION'
                break;
              default:
                forma = '---'
                break;
            }
            return forma
          },
          fechaCorta(fechaStr) {
            let formateo = ''
            if (fechaStr) {
              const partes = fechaStr.split('-');
              const dia = parseInt(partes[2], 10);
              const mes = parseInt(partes[1], 10) - 1;
              const anio = parseInt(partes[0], 10);

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

            itemsAsHtml = items.map((item, key) => `
            <tr style="height:14px;font-size:10px;">
              <td style="text-align: center;background-color:#ddebf7;">${key + 1}</td>
              <td style="width:60px;text-align: center;">` + item['descripcion'] + `</td>
              <td style="width:60px;text-align: center;background-color:#ddebf7;">` + (item['unidad'] ?? '--') + `</td>
              <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['costo'] + `</td>
              <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
              <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad'] ?? 0) * parseFloat(item['costo'] ?? 0)).toFixed(2) + `</td>
            </tr>
            `)

            for (let i = 0; i < extra; i++) {
              itemsAsHtml.push(`
                <tr style="height:14px;">
                  <td style="width:35px;text-align: center;background-color:#ddebf7;"></td>
                  <td style="width:60px;text-align: center;"></td>
                  <td style="width:60px;text-align:left;background-color:#ddebf7;"></td>
                  <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                  <td style="width:60px;text-align: center;background-color:#ddebf7;"></td>
                  <td style="width: 60px;text-align: center;background-color:#ddebf7;"></td>
                </tr>`)
            }
            // const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)
            return itemsAsHtml.join("\n")
          },
          consolidado(items) {
            let itemsAsHtml = ''
            let extra = 12 - items.length
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad'] ?? 0) * parseFloat(valor['costo'] ?? 0); return carry }, 0).toFixed(2)

            itemsAsHtml = `
              <div style="height:14px;padding-top:5px;border-top:1px solid black;">
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">SUBTOTAL</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">S/.${total}</div>
                </div>
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">IGV 18%</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">S/.0</div>
                </div>
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">TOTAL</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">S/.${total}</div>
                </div>
              </div>
            `
            return itemsAsHtml
          }
        },

      },
      async (err, html) => {
        console.log(html)
        try {
          if(mode === 'download') {
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
          } else {
            console.log("Enviando html")
            res.send(html)
          }
          
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