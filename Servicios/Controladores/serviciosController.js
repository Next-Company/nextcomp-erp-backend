import ServiciosServiceModel from "../Servicios/serviciosServiceModel.js";

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
    const data = req.body.info
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
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    // if(id !== '') {
    //   cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
    //   detalle = await ProduccionModel.getInfoPedidoDet(id)
    // } else {
    //   if(data.id){
    //     cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
    //     detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    //   }else{
    //     cabecera = JSON.parse(data.info)
    //     detalle = JSON.parse(data.detalle)
    //   }
    // }
    ServiciosController.GenerarDocumentoServicio(cabecera,detalle,res,mode)
  }
  static async GenerarDocumentoServicio(cabecera,detalle,res,mode){
    console.log("Generando pedido avios, dentro del controller genera pedido avios")
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')
    res.render(
      'avios_v3',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
        datos: cabecera,
        detalle: detalle,
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

            itemsAsHtml = items.map((item, key) => `
            <tr style="height:14px;font-size:10px;">
              <td style="text-align: center;background-color:#ddebf7;">${key + 1}</td>
              <td style="width:60px;text-align: center;">` + item['modelo'] + `</td>
              <td style="width:60px;text-align: center;">` + (item['corte'] ? ('#' + item['corte']) : '') + `</td>
              <td style="width:60px;text-align: center;">` + item['producto'] + `</td>
              <td style="width:60px;text-align:left;background-color:#ddebf7;text-align:center;">` + (item['color'] ?? '') + `</td>
              <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['cantidad'] + `</td>
              <td style="width:60px;text-align: center;background-color:#ddebf7;">` + item['unidad'] + `</td>
              <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
              <td style="width: 60px;text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
            </tr>
            `)

            for (let i = 0; i < extra; i++) {
              itemsAsHtml.push(`
                <tr style="height:14px;">
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
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)
            return itemsAsHtml.join("\n")
          },
          consolidado(items) {
            let itemsAsHtml = ''
            let extra = 12 - items.length
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)

            itemsAsHtml = `
              <div style="height:14px;padding-top:5px;border-top:1px solid black;">
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">SUBTOTAL</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${total}</div>
                </div>
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">IGV 18%</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 0.18).toFixed(2) : 0}</div>
                </div>
                <div style="text-align: center;display:flex;flex-direction: row;">
                  <div style="flex:1;text-align:right;font-weight:bold;">TOTAL</div>
                  <div style="width:60px;text-align:left;padding-left:10px;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 1.18).toFixed(2) : total}</div>
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