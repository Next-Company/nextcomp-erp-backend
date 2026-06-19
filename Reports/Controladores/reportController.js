import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise"
import fs from 'node:fs/promises'
import path from 'node:path';
import puppeteer from 'puppeteer';
import ReporteService from "../Servicios/reportServicio.js"
import ExcelJS from 'exceljs';
import { ProduccionModel } from "../../Produccion/Servicios/produccion.js";

export default class ReportController{
  static __dirname = '/home/juanjhonv/compartido';

  static async setImportLetras(req,resp){
    let str = 'public/templates';
    let conn = null
    try {
      new Promise((resolve, reject) => {
        req.files.forEach(async element => {
          const oldPath = element.path;
          const newPath = path.join(str, 'import_letras.xlsx');
          //console.log('Renombrando :',oldPath,newPath)
          await fs.rename(oldPath, newPath)
          resolve('Renombrado')
        });
      })
      .then(async () => {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile('public/templates/import_letras.xlsx');
        const worksheet = workbook.getWorksheet('INFORME');
        let base_letras = []
        
        worksheet.eachRow(async function(row, rowNumber) {
          let info = null
          if(rowNumber > 1){
            info = ['20522094120']
            rowNumber > 1 && row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
              if(colNumber == 2 || colNumber == 5){
                let newfecha = new Date(Date.parse(cell.value) + 86400000)
                info.push(newfecha.getFullYear() + '-' + (newfecha.getMonth() + 1).toString().padStart(2, '0') + '-' + newfecha.getDate().toString().padStart(2, '0'))
              }else{
                info.push(cell.value)
              }
            });
            info[8] = 'EMIT'
            base_letras.push(info)
          }
        });
        //console.log('Aca estamos :',base_letras)
        try {
          conn = await mysql.createConnection(configs[1])
          await conn.connect()
          await conn.beginTransaction()
          let insert = async ()=>{
            let data = base_letras.shift()
            //console.log('Fila a insertar :',data)
            if(data){
              const [res,fields] = await conn.query('INSERT INTO tbl2_letras_cab(ruc_,num_letra,fec_emision,documentos_ref,id_proveedor_CAB,proveedor,fec_vencimiento,importe,moneda,estado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),0,NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',data)
              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()
          resp.json({ message: 'Archivo subido de forma satisfactoria' })
        } catch (error) {
          //console.log(error)
          conn.rollback()
        } finally {
          if (conn) {
            conn.commit()
            // conn.rollback()
            await conn.end();
          }
        }
      })
    } catch (error) {
      //console.log(error)
      resp.json(error)
    }

  }
  static async getInformeLetras(req,res){
    const filters = req.body
    const result = await ReporteService.getInformeLetras(filters)
    const MESES = ['','ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('public/templates/formato_letras.xlsx');
      const worksheet = workbook.getWorksheet('INFORME');
      let row  = 2
      let formateo = Object.groupBy(result,row=>row.mes)
      let totalMN = 0, totalUSD = 0

      Object.keys(formateo).forEach(key=>{
        worksheet.getRow(row).values = ['','','',MESES[key]]
        worksheet.getCell(`D${row}`).fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor:{argb:'EED202'},
        };
        worksheet.getCell(`D${row}`).font = {
          bold: true
        };
        row+=1
        formateo[key].forEach(item=>{
          worksheet.getRow(row).values = [item.num_letra,item.fec_emision,item.facturas_ref ? item.facturas_ref : item.documentos_ref,item.proveedor,item.fec_vencimiento,item.importe_soles,item.importe_dolares]
          worksheet.getCell(`F${row}`).numFmt = '"S\/\."#,##0.00;[Red]\-"S\/\."#,##0.00';
          worksheet.getCell(`G${row}`).numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00';
          totalMN += parseFloat(item.importe_soles)
          totalUSD += parseFloat(item.importe_dolares)
          if(item.moneda == 'MN'){
          }else{
          }
          row+=1
        })
        worksheet.insertRow(row)
        row+=1
      })

      row+=1
      worksheet.getRow(row).values = ['','','','','TOTAL:',totalMN,totalUSD]
      worksheet.getCell(`F${row}`).numFmt = '"S\/\."#,##0.00;[Red]\-"S\/\."#,##0.00'
      worksheet.getCell(`F${row}`).font = {
        size: 16,
        bold: true
      };
      // row+=1
      // worksheet.getRow(row).values = ['','','','TOTAL DOLARES:',totalUSD]
      worksheet.getCell(`G${row}`).numFmt = '"$"#,##0.00;[Red]\-"$"#,##0.00'
      worksheet.getCell(`G${row}`).font = {
        size: 16,
        bold: true
      };

      worksheet.eachRow(function(row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
          cell.border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          };
        });
      });
      const buffer = await workbook.xlsx.writeBuffer()
      res.json({data:buffer.toString('hex')})
      
    } catch (error) {
      //console.log(error)
      res.json(error)
    }
  }
  static async getResumenConsolidado(req,res){
    const filters = req.body
    let conn = null
    let info = await ReporteService.getResumenConsolidado(filters)
    try {

      const MESES = ['','ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('public/templates/formato_resumen_consolidado.xlsx');
      const worksheet = workbook.getWorksheet('INFORME');
      
      let row  = 2
      // let formateo = Object.groupBy(result,row=>row.mes)
      let totalMN = 0, totalUSD = 0
      let fields = ['oc','id_cliente_CAB','cliente','fec_emitida','fec_entrega','marca','producto','base','precio','modelos','estado_orden','ruta_proceso']

      worksheet.getRow(1).values = info[1].map(field => field.name);
      worksheet.getRow(1).font = {
        bold: true,
        size: 14
      };

      info[0].forEach(item=>{
        let format = Object.keys(item).map(key=>item[key])
        // worksheet.getRow(row).values = [item.oc,item.id_cliente_CAB,item.cliente,item.fec_emitida,item.fec_entrega,item.marca,item.producto,item.base,item.precio,item.modelos,item.estado_orden,item.ruta_proceso]
        worksheet.getRow(row).values = format
        row+=1
      })

      worksheet.eachRow(function(row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
          cell.border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          };
        });
      });
      const buffer = await workbook.xlsx.writeBuffer()
      res.json({data:buffer.toString('hex')})
    } catch (error) {
      //console.log(error)
      res.json(error)
    }
  }
  static async getDespachosConsolidado(req,res){
    const filters = req.body
    let conn = null
    let info = await ReporteService.getDespachosConsolidado(filters)
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('public/templates/formato_despachos_consolidado.xlsx');
      const worksheet = workbook.getWorksheet('RESUMEN');
      let row  = 2

      worksheet.getRow(1).values = info[1].map(field => field.name);
      worksheet.getRow(1).font = {
        bold: true,
        size: 14
      };

      info[0].forEach(item=>{
        let format = Object.keys(item).map(key=>item[key])
        // worksheet.getRow(row).values = [item.oc,item.id_cliente_CAB,item.cliente,item.fec_emitida,item.fec_entrega,item.marca,item.producto,item.base,item.precio,item.modelos,item.estado_orden,item.ruta_proceso]
        worksheet.getRow(row).values = format
        row+=1
      })

      worksheet.eachRow(function(row, rowNumber) {
        row.eachCell({ includeEmpty: true }, function(cell, colNumber) {
          cell.border = {
            top: {style:'thin'},
            left: {style:'thin'},
            bottom: {style:'thin'},
            right: {style:'thin'}
          };
        });
      });
      const buffer = await workbook.xlsx.writeBuffer()
      res.json({data:buffer.toString('hex')})
    } catch (error) {
      //console.log(error)
      res.json(error)
    }
  }
  static async VistaPreviaRetiro(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    //console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoRetiroCab(data.id))[0]
      detalle = await ProduccionModel.getInfoRetiroDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    //console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/guia_traslado.png')
    // const tipo = JSON.parse(data.info).tipo
    //console.log("El tipo de pedido es :", tipo)
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
              //console.log("La fecha corta es:", nombreMes)
            }
            return formateo
          },
          fuu(cabecera){
            //console.log("asldfalsdfj:",cabecera.id_proveedor_CAB,parseInt(cabecera.id_proveedor_CAB) !== 30208 ? 'a' : 'b')
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
          //console.log(`Versión de Chrome: ${version}`);
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