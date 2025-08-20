import AlmacenModel from "../Servicios/almacenService.js"
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises'

export default class AlmacenController{
  static async getMovimientosAlmacen(req,reply){
    const data = await AlmacenModel.getMovimientosAlmacen()
    reply.send(data)
  }
  static async getMovimientosAlmacenById(req,reply){
    const id = req.params.id
    const data = await AlmacenModel.getMovimientosAlmacenById(id)
    reply.send(data)
  }
  static async getInventarioProductos(req,reply){
    const data = await AlmacenModel.getInventarioProductos()
    reply.send(data)
  }
  static async saveGuia(req,reply){
    console.log("Dentro del proceso de guardado de guia")
    let info = req.body
    const data = await AlmacenModel.saveGuia(info)
    reply.send(data)
  }
  static async getDisponibilidadRequerimiento(req,reply){
    const idreq = req.params.idreq
    const data = await AlmacenModel.getDisponibilidadRequerimiento(idreq)
    reply.send(data)
  }
  static async VistaPreviaRetiro(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    if (data.id) {
      cabecera = (await AlmacenModel.getMovimientoCab(data.id))[0]
      detalle = await AlmacenModel.getMovimientoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_traslado.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El tipo de pedido es :", tipo)
    res.render(
      'retiro_telas',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        datos: cabecera,
        detalle: detalle,
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
          fuu(cabecera){
            console.log("asldfalsdfj:",cabecera.id_proveedor_CAB,parseInt(cabecera.id_proveedor_CAB) !== 30208 ? 'a' : 'b')
            let condiciones = parseInt(cabecera.id_proveedor_CAB) !== 30208
            ? `
              <tr>
                <td colspan="9" style="height:15px;padding:10px;"><strong>OBSERVACIONES:</strong></td>
              </tr>
              <tr>
                <td colspan="9" style="padding:10px 10px 10px;font-size:8px;">
                  <strong style="font-size:inherit;">CONDICIONES DE PAGO:</strong> Las fechas de cierre son los días miércoles de cada semana. La programación de pagos variaran dependiendo de si los despachos fueron recepcionados antes o después de la fecha de cierre. Los proveedores cuyos despachos sean recibidos antes de la fecha de cierre(<strong style="font-size:inherit;">lunes, martes o miércoles</strong>), recibirán el pago en un plazo máximo de 10 días a partir de dicha fecha de cierre; por el contrario, los proveedores cuyos despachos sean recibidos después de la fecha de cierre(<strong style="font-size:inherit;">jueves, viernes o sábado</strong>), recibirán el pago en un plazo máximo de 10 días a partir de la fecha de cierre de la semana siguiente.
                </td>
              </tr>
              <tr>
                <td colspan="9" style="padding:10px 10px 10px;font-size:8px;">
                  <strong style="font-size:inherit;">PENALIDADES:</strong> El despacho deberá ejecutarse segun las fechas indicadas en el presente documento, despues de la fecha de vencimineto se aplicará una penalidad sobre el valor costo de la OC: de 1 a 5 días de retraso la penalidad sera de 5%, de 6 a 10 días la penalidad serea de 10% y de 11 a 15 días sera %15, de 16 días a más se evaluará la recepción de la OC. El proveedor consignado en el presente documento autoriza a Next Company a retener de forma automática el pago de facturas del proveedor por el valor de lo adeudado.
                </td>
              </tr>
              `
            : ''
            return condiciones
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
}