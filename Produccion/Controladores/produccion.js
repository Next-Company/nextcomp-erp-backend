import { ProduccionModel } from "../Servicios/produccion.js";
import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import puppeteer from 'puppeteer';
import { OtherTarget } from "puppeteer-core";
import { concat } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { OrdenesModel } from "../../Ordenes/Servicios/ordenes.js";
// import { width } from "pdfkit/js/page";
// import { height } from "pdfkit/js/page";
// import PDFDocument from "pdfkit";

export class ProduccionController {
  static async getOrdenes(req, reply) {
    // const user_data = req.session
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getOrdenes(search)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async exportInfoEstampado(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    console.log("Info cabecera:", data2)
    console.log("Fecha:", new Date(Date.parse(data2[0].created_at)).toLocaleDateString())
    resp.render(
      'estampado',
      {
        info: params,
        detalle: data,
        fecha: new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
            landscape: false,    // Para orientación horizontal (landscape) usa `true`
            printBackground: true // Incluir el fondo en el PDF
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }
  static async exportInfoGuia(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data3 = data[0].id_proveedor_CAB ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB) : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]
    // let relleno = []
    // const cantidad_relleno = 25 - data2.length
    // for (let index = 0; index < cantidad_relleno; index++) {
    //   relleno.push({    })

    // }
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleString('en-GB'))
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleDateString('en-GB'))
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleTimeString('en-GB'))
    // console.log("Info cabecera:",data)
    // console.log("Info detalle:",data2)
    // console.log("Fecha:",new Date(Date.parse(data2[0].created_at)).toLocaleDateString())
    resp.render(
      data[0].tipo == 'SERVICIOS' ? 'guia_back' : 'guia_muestras_v2',
      {
        condicion: parseInt(params.modo),
        color: data[0].servicio == 'ACABADOS' ? 'red' : 'black',
        info: params,
        cabecera: data[0],
        detalle: data2.filter(row => !row.isprototipo),
        // relleno:data2.filter(),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.cantidad)
          return carry;
        }, 0),
        proveedor: data3[0],
        helpers: {
          plusindex(index) {
            return index + 1
          }
        }
        // diasprod:7
        // fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
      },
      async (err, html) => {
        try {
          if(params.modo == 1){
            const browser = await puppeteer.launch();
            const version = await browser.version();
            console.log(`Versión de Chrome: ${version}`);
            const page = await browser.newPage();
            await page.setContent(html);
  
            const pdfOptions = {
              // format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
              // width: '24.1cm',
              width: '20cm',
              // height: data[0].tipo == 'SERVICIOS' ? '27.94cm' : '13.97cm',
              height: '27.94cm',
              landscape: false,    // Para orientación horizontal (landscape) usa `true`
              printBackground: true, // Incluir el fondo en el PDF
              margin: {
                left: 0,
                right: 0
              }
            };
  
            const pdfBuffer = await page.pdf(pdfOptions);
            await browser.close();
            resp.send({ data: pdfBuffer.toString('base64') })
          }else{
            resp.send(html)
          }
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      });
  }
  static async exportInfoGuiaV2(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data3 = data[0].id_proveedor_CAB ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB) : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]
    resp.render(
      data[0].tipo == 'SERVICIOS' ? 'guia_back' : 'guia_muestras_v2',
      {
        condicion: parseInt(params.modo),
        size: '14px',
        color: data[0].servicio == 'ACABADOS' ? 'red' : 'black',
        info: params,
        cabecera: data[0],
        detalle: data2.filter(row => !row.isprototipo),
        // relleno:data2.filter(),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.cantidad)
          return carry;
        }, 0),
        proveedor: data3[0],
        helpers: {
          plusindex(index) {
            return index + 1
          }
        }
        // diasprod:7
        // fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
      },
      async (err, html) => {
        try {
          if(params.modo == 1){
            const browser = await puppeteer.launch();
            const version = await browser.version();
            console.log(`Versión de Chrome: ${version}`);
            const page = await browser.newPage();
            await page.setContent(html);

            const pdfOptions = {
              // format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
              // width: '24.1cm',
              width: '20cm',
              // height: data[0].tipo == 'SERVICIOS' ? '27.94cm' : '13.97cm',
              height: '27.94cm',
              landscape: false,    // Para orientación horizontal (landscape) usa `true`
              printBackground: true, // Incluir el fondo en el PDF
              margin: {
                left: 0,
                right: 0
              }
            };

            const pdfBuffer = await page.pdf(pdfOptions);
            await browser.close();
            resp.send({ data: pdfBuffer.toString('base64') })

          }else{
            resp.send(html)
          }

          // resp.send({ data: pdfBuffer.toString('base64') })
          // resp.send(html)
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      });
  }
  static async verInfoDespacho(req, resp) {
    const params = req.params
    console.log("La informacion de los parametros es otro cambio:",params)
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    console.log("Mostrando informacin de la guia:",data)
    // const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    let data2 = await ProduccionModel.getInfoDespachoDet(params.id)
    console.log("Mostrando la informacion del detalle del despacho:",data2)

    console.log("Reestructurando la variable data2")

    data2 = data2.reduce((c,v)=>{
      // [
      //   {"talla": "l", "caidos": 0, "cantidad": 36, "incompletos": 0}, 
      //   {"talla": "m", "caidos": 4, "cantidad": 32, "incompletos": 0}, 
      //   {"talla": "s", "caidos": 3, "cantidad": 21, "incompletos": 0}, 
      //   {"talla": "xl", "caidos": 0, "cantidad": 12, "incompletos": 0}, 
      //   {"talla": "xs", "caidos": 0, "cantidad": 0, "incompletos": 0}, 
      //   {"talla": "xxl", "caidos": 0, "cantidad": 0, "incompletos": 0}
      // ]

      let lista = ['cantidad','caidos','incompletos']
      let tallas = ['xs','s','m','l','xl','xxl']
      v.fracciones_despacho = ['xs','s','m','l','xl','xxl'].reduce((c3,v3)=>{
        c3.push(v.fracciones_despacho.filter(row=>row['talla'] == v3)[0])
        return c3
      },[])
      let nuevo = lista.reduce((c2,v2) => {
        let newnames = {cantidad:'Despacho',caidos:'Caidos',incompletos:'Incompletos'}
        c2.push([newnames[v2],...v.fracciones_despacho.map(row=>row[v2]),'-',v.fracciones_despacho.map(row=>row[v2]).reduce((c,v)=>c+v,0)])
        return c2
      },[]);
      console.log("Nuefo formateddo:",nuevo)
      // let new_fracciones = 
      c.push({...v,new_fracciones:nuevo})
      return c
    },[])

    const data3 = data[0].id_proveedor_CAB ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB) : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]
    resp.render(
      'guia_despacho',
      {
        color: 'black',
        info: params,
        cabecera: data[0],
        // detalle:data2.filter(row=>!row.isprototipo),
        detalle: data2,
        // relleno:data2.filter(),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.cantidad)
          return carry;
        }, 0),
        totaldespacho: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.despacho)
          return carry;
        }, 0),
        totalcaidos: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.caidos)
          return carry;
        }, 0),
        totalincompletos: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.incompletos)
          return carry;
        }, 0),
        proveedor: data3[0],
        helpers: {
          plusindex(index) {
            return index + 1
          }
        }
      }
      ,async (err, html) => {
        try {  
          console.log("La condicion de busqueda es la siguiente:",params.condicion)
          if(params.condicion == 2){
            console.log("Dentro de la codicion 1 vista pdf")
            const browser = await puppeteer.launch();
            const version = await browser.version();
            console.log(`Versión de Chrome: ${version}`);
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfOptions = {
              width: '20cm',
              height: '27.94cm',
              landscape: false,
              printBackground: true,
              margin: {
                left: 0,
                right: 0
              }
            };
            const pdfBuffer = await page.pdf(pdfOptions);
            await browser.close();
            resp.send({ data: pdfBuffer.toString('base64') })
          }else{
            console.log("Dentro de la condicion 2 vista html")
            resp.send(html)
          }
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    );


    

  }

  static async exportInfoDespacho(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    // const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data2 = await ProduccionModel.getInfoDespachoDet(params.id)
    console.log(data2)
    const data3 = data[0].id_proveedor_CAB ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB) : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]
    resp.render(
      'guia_despacho',
      {
        color: 'black',
        info: params,
        cabecera: data[0],
        // detalle:data2.filter(row=>!row.isprototipo),
        detalle: data2,
        // relleno:data2.filter(),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((carry, valor) => {
          carry += valor.isprototipo ? 0 : parseFloat(valor.cantidad)
          return carry;
        }, 0),
        proveedor: data3[0],
        helpers: {
          plusindex(index) {
            return index + 1
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
            // format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
            // width: '24.1cm',
            width: '20cm',
            // height: data[0].tipo == 'SERVICIOS' ? '27.94cm' : '13.97cm',
            height: '20.94cm',
            landscape: false,    // Para orientación horizontal (landscape) usa `true`
            printBackground: true, // Incluir el fondo en el PDF
            margin: {
              left: 0,
              right: 0
            }
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      });
  }
  static async exportPedidoAvios(req, resp) {
    console.log("Iniciando el exportado:")
    console.log(req.body)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')
    // resp.render('compra',{ BINARY_CHUNKS:BINARY_CHUNKS.toString('base64'),BINARY_CHUNKS2:BINARY_CHUNKS2.toString('base64') })

    // {{#list people}}
    //   {{firstname}} {{lastname}}
    // {{/list}}

    // Handlebars.registerHelper("list", function(items, options) {
    //   const itemsAsHtml = items.map(item => "<li>" + options.fn(item) + "</li>");
    //   return "<ul>\n" + itemsAsHtml.join("\n") + "\n</ul>";
    // });

    // {
    //   people: [
    //     {
    //       firstname: "Yehuda",
    //       lastname: "Katz",
    //     },
    //     {
    //       firstname: "Carl",
    //       lastname: "Lerche",
    //     },
    //     {
    //       firstname: "Alan",
    //       lastname: "Johnson",
    //     },
    //   ],
    // }


    resp.render(
      'avios', {
      BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
      datos: req.body,
      detalle: JSON.parse(req.body.detalle),
      helpers: {
        // foo() { return JSON.parse(req.body.detalle).map(row=>'<a href="">sdf</a>'); }
        foo(items, options) {
          // <tr>
          //   <td style="width: 35px;text-align: center;" contenteditable="true">{{@index}}</td> 
          //   <td style="width: 60px;text-align: right;" contenteditable="true">{{this.[0]}}</td> 
          //   <td style="width: 240px; text-align:justify;" contenteditable="true">{{this.[1]}}</td>
          //   <td style="width: 62px;text-align: center;" contenteditable="true">{{this.[2]}}</td>
          //   <td style="width: 35px; text-align: right; vertical-align: middle;" contenteditable="true">{{this.[3]}}</td>
          //   <td style="width: 60px; text-align: right; vertical-align: middle;" contenteditable="true">{{this.[4]}}</td>
          //   <td style="width: 70px; text-align: right; vertical-align: baseline ; height: auto" valign="middle" contenteditable="true">{{this.[5]}}</td>
          // </tr>
          // console.log(items)

          let extra = 22 - items.length
          for (let i = 0; i < extra; i++) {
            items.push(['', '', '', '', '', '', ''])
          }

          const itemsAsHtml = items.map((item, key) => `<tr><td style="width: 35px;text-align: center;" contenteditable="true">${key + 1}</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[0] + `</td><td style="width: 60px;text-align: left;" contenteditable="true">` + item[1] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[2] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[3] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[4] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[5] + `</td></tr>`)

          // const rellenoAsHtml = items.map(item => `<tr><td style="width: 35px;text-align: center;" contenteditable="true">0</td><td style="width: 60px;text-align: right;" contenteditable="true"></td><td style="width: 60px;text-align: right;" contenteditable="true"></td><td style="width: 60px;text-align: right;" contenteditable="true"></td><td style="width: 60px;text-align: right;" contenteditable="true"></td><td style="width: 60px;text-align: right;" contenteditable="true"></td><td style="width: 60px;text-align: right;" contenteditable="true"></td></tr>`)
          return itemsAsHtml.join("\n")

          // console.log(items.data.root.detalle[0][0])
          // console.log(options)

          // const itemsAsHtml = `<td style="width: 35px;text-align: center;" contenteditable="true">0</td><td style="width: 60px;text-align: right;" contenteditable="true">`+(items[0])[0]+`</td><td style="width: 60px;text-align: right;" contenteditable="true">`+items[1]+`</td><td style="width: 60px;text-align: right;" contenteditable="true">`+items+`</td><td style="width: 60px;text-align: right;" contenteditable="true">`+items+`</td><td style="width: 60px;text-align: right;" contenteditable="true">`+items+`</td><td style="width: 60px;text-align: right;" contenteditable="true">`+items+`</td>`

          // const itemsAsHtml = items[0].map(element => {
          //   return `<td>`+ element +`</td>`
          // });

          // return "<tr>"+itemsAsHtml.join("")+"</tr>" 
          // return "<tr><td>asdfasdfasdf</td></tr>" 
        }
      }
    }
      , async (err, html) => {
        try {
          console.log("Dentro del renderizado")
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);

          // Configurar las opciones del PDF (tamaño y orientación)
          const pdfOptions = {
            format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
            landscape: false,    // Para orientación horizontal (landscape) usa `true`
            printBackground: true // Incluir el fondo en el PDF
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();

          // console.log(pdfBuffer)
          // await fs.writeFile('public/css/info.pdf', pdfBuffer);
          // Enviar el PDF como respuesta
          // resp.contentType('application/pdf');

          // resp.download('public/css/info.pdf','info',(err)=>{
          //   if (err) {
          //     console.error('Error al descargar el archivo:', err);
          //     resp.status(500).send('No se pudo descargar el archivo.');
          //   }
          // })
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });


  }
  static async exportPedidoTelas(req, resp) {
    console.log("Iniciando el exportado:")
    console.log(req.body)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')

    resp.render(
      'telas', {
      BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
      datos: req.body,
      detalle: JSON.parse(req.body.detalle),
      helpers: {
        foo(items, options) {
          let extra = 22 - items.length
          for (let i = 0; i < extra; i++) {
            items.push(['', '', '', '', '', '', ''])
          }
          const itemsAsHtml = items.map((item, key) => `<tr><td style="width: 35px;text-align: center;" contenteditable="true">${key + 1}</td><td style="width: 60px;text-align: left;" contenteditable="true">` + item[0] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[1] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[2] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[3] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[4] + `</td><td style="width: 60px;text-align: center;" contenteditable="true">` + item[5] + `</td></tr>`)
          return itemsAsHtml.join("\n")
        }
      }
    }
      , async (err, html) => {
        try {
          console.log("Dentro del renderizado")
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            format: 'A4',        // Puedes usar 'A4', 'Letter' o un tamaño personalizado como { width: '210mm', height: '297mm' }
            landscape: false,    // Para orientación horizontal (landscape) usa `true`
            printBackground: true // Incluir el fondo en el PDF
          };
          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }
  static async printOrdenes(req, resp) {
    // const user_data = req.session
    // const data = await ProduccionModel.getOrdenes(user_data)

    // const PDFDocument = require('pdfkit');
    // const fs = require('fs');

    // Create a document
    const doc = new PDFDocument();

    // Pipe its output somewhere, like to a file or HTTP response
    // See below for browser usage
    doc.pipe(fs.createWriteStream('output.pdf'));

    // Embed a font, set the font size, and render some text
    doc
      // .font('fonts/PalatinoBold.ttf')
      .fontSize(25)
      .text('Some text with an embedded font!', 100, 100);

    // Add an image, constrain it to a given size, and center it vertically and horizontally
    // doc.image('path/to/image.png', {
    //   fit: [250, 300],
    //   align: 'center',
    //   valign: 'center'
    // });

    // Add another page


    doc
      .addPage()
      .fontSize(12)
      .text('Calle Felipe Santiago Crespo Nro 581 - San Luis - Lima - Lima', 100, 100);

    // doc
    // .fontSize(12)
    // .text('R.U.C. 20522094120', 100, 100);
    // doc
    // .fontSize(12)
    // .text('Telf: 3233128', 100, 100);
    // doc
    // .fontSize(12)
    // .text('next.company.sac@gmail.com', 100, 100);

    doc
      .addPage()
      .fontSize(12)
      .text('Here is some vector graphics...', 100, 100);

    // Draw a triangle
    doc
      .save()
      .moveTo(100, 150)
      .lineTo(100, 250)
      .lineTo(200, 250)
      .fill('#FF3300');

    // Apply some transforms and render an SVG path with the 'even-odd' fill rule
    doc
      .scale(0.6)
      .translate(470, -380)
      .path('M 250,75 L 323,301 131,161 369,161 177,301 z')
      .fill('red', 'even-odd')
      .restore();

    // Add some text with annotations
    doc
      .addPage()
      .fillColor('blue')
      .text('Here is a link!', 100, 100)
      .underline(100, 100, 160, 27, { color: '#0000FF' })
      .link(100, 100, 160, 27, 'http://google.com/');

    // Finalize PDF file
    doc.end();

    // const data = []
    // resp.download('/home/juanjhonv/compartido/Comunes/GASTOS DE TIENDAS EN GENERAL.xlsx', 'output', (err) => {
    resp.download('./output.pdf', 'output.pdf', (err) => {
      // if (err) {
      //   console.error('Error al descargar el archivo:', err);
      //   resp.status(500).send('No se pudo descargar el archivo.');
      // }
    });


    // var html_to_pdf = require('html-pdf-node');
    // let options = { format: 'A4' };
    // Example of options with args //
    // let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };

    // let file = { content: "<h1>Welcome to html-pdf-node</h1>" };
    // or //
    // let file = { url: "https://example.com" };
    // html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
    //   console.log("PDF Buffer:-", pdfBuffer);
    // });

    // let options = { format: 'A4' };
    // let file = [{ url: "https://example.com", name: 'example.pdf' }];

    // html_to_pdf.generatePdfs(file, options).then(output => {
    //   console.log("PDF Buffer:-", output); // PDF Buffer:- [{url: "https://example.com", name: "example.pdf", buffer: <PDF buffer>}]
    // });

  }
  static async getOrdenesByParams(req, reply) {
    const info = req.body
    const data = await ProduccionModel.getOrdenesByParams(info.params)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async getOrdenesById(req, reply) {
    const info = req.params
    const data = await ProduccionModel.getOrdenesById(info)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async pushItems(req, resp) {
    const info = req.body
    const user_data = req.session
    // console.log(info.asunto)
    console.log("Por aqui vamos!")
    const data = await ProduccionModel.pushItems(info, user_data)
    // console.log(resp)

    // resp.json({resppp:info})
    resp.json(data)
  }
  static async testMultiSelect(req, resp) {
    const info = req.body
    const data = await ProduccionModel.testMultiSelect(info)
    resp.json(data)
  }
  static async traerMultiSelect(req, resp) {
    const data = await ProduccionModel.traerMultiSelect()
    resp.json(data)
  }
  static async getAll(req, resp) {
    const user_data = req.session
    const data = await ProduccionModel.getAll(user_data)
    // console.log(data)
    // console.log(resp)
    resp.json(data)
  }
  static async updateItems(req, resp) {
    // const data = await ProduccionModel.updateItems()
    // resp.json(data)
    // console.log(resp)
  }
  static async deleteOrden(req, resp) {
    let id = req.params.id
    const data = await ProduccionModel.deleteOrden(id)
    resp.json(data)
    // console.log(req)
    // resp.json([{resp:id}])
  }
  static async getListaEstampados(req, res) {
    const data = await ProduccionModel.getListaEstampados()
    res.json(data)
  }
  static async getInfoEstampado(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoEstampado(id)
    // console.log("Consulta estampado :",data)
    res.json(data)
  }
  static async saveInfoEstampado(req, res) {
    // const info = req.body
    console.log("Datos del bodys:", req.body)
    // console.log("Datos del bodys:",JSON.parse(info.info))
    const data = await ProduccionModel.saveInfoEstampado(req.body)
    // console.log("Consulta estampado :",data)
    // res.json(data)
    res.json({ ok: true, message: 'datos guardados' })
  }
  static async eliminarInfoEstampado(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoEstampado(id)
    res.json(data)
  }
  static async ShowInforme(req, res) {
    console.log("Mostrando informe seguimiento estampado 12")
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    res.render('estampado', {
      info: params,
      detalle: data,
      fecha: new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
    })
    // res.render(
    // 'estampado',
    // {
    //   info:params,
    //   detalle:data,
    //   fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
    // },
    // async (err,html)=>{
    //   console.log(html)
    //   res.send(html)
    // });
  }
  //////////////////////////////
  // Seccion registro de guias //
  //////////////////////////////
  static async getListaGuias(req, res) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaGuias(search)
    res.json(data)
  }
  static async getListaMuestras(req, res) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaMuestras(search)
    res.json(data)
  }
  static async getInfoGuias(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoGuiaCab(id)
    const data2 = await ProduccionModel.getInfoGuiaDet(id)
    const data3 = await ProduccionModel.getInfoGuiaPenalidades(id)
    const data4 = await ProduccionModel.getListaPenalidades()
    const data5 = await OrdenesModel.getFasesProduccion('')
    const data6 = await ProduccionModel.getListaReprogramacionGuias(id)
    // const data4 = await ProduccionModel.()
    res.json([data[0], data2, data3, data4, data5, data6])
  }
  static async searchGuia(req, res) {
    const { info } = req.params
    const data = await ProduccionModel.searchGuia(info)
    res.json(data)
  }

  static async saveInfoGuias(req, res) {
    const data = await ProduccionModel.saveInfoGuias(req.body)
    res.json(data)
    // res.json({ ok: true, message: 'datos guardados' })
  }
  static async eliminarInfoGuias(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoGuias(id)
    res.json(data)
  }
  static async anularInfoGuias(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.anularInfoGuias(id)
    res.json(data)
  }
  static async getStatusGuia(req, res) {
    const id = req.params.id
    // const data = await
    res.render(
      'statusguia', {
      info: { nro_orden: '', nro_orden: '', fecha: '', proveedor: '', re: '', ruc: '', dirigido: '', girado: '', telefono: '', acuenta: '', entrega: '', observaciones: '' },
      helpers: {
        foo(items, options) {
          let extra = 18 - items.length
          for (let i = 0; i < extra; i++) {
            items.push(['', '', '', '', '', '', ''])
          }
          const itemsAsHtml = items.map((item, key) => `<tr style="height:22px;"><td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td><td style="width:60px;text-align: left;">` + item[0] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[1] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[2] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[3] + `</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item[4] + `</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item[5] + `</td></tr>`)
          return itemsAsHtml.join("\n")
        }
      },

    })
  }
  static async getListaClientes(req, res) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaClientes(search)
    res.json(data)
  }
  static async getListaProveedores(req, res) {
    const limit = req.params.limit
    const data = await ProduccionModel.getListaProveedores(limit)
    res.json(data)
  }
  static async searchProveedor(req, res) {
    const info = req.params.info
    const data = await ProduccionModel.searchProveedor(info)
    res.json(data)
  }
  static async searchProveedorById(req, res) {
    const info = req.params.info
    const data = await ProduccionModel.searchProveedorById(info)
    res.json(data)
  }
  static async VistaPreviaPedido_(req, res) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    // const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/orden_pedido.png')

    res.render(
      'telas_v2', {
      BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
      BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
      datos: { nro_orden: '', nro_orden: '', fecha: '', proveedor: '', re: '', ruc: '', dirigido: '', girado: '', telefono: '', acuenta: '', entrega: '', observaciones: '' },
      detalle: [['', '', '', '', '', '', '']],
      helpers: {
        foo(items, options) {
          let extra = 18 - items.length
          for (let i = 0; i < extra; i++) {
            items.push(['', '', '', '', '', '', ''])
          }
          const itemsAsHtml = items.map((item, key) => `<tr style="height:22px;"><td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td><td style="width:60px;text-align: left;">` + item[0] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[1] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[2] + `</td><td style="width:60px;text-align: center;background-color:#ddebf7;">` + item[3] + `</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item[4] + `</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">` + item[5] + `</td></tr>`)
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
  static async GeneraPedidoAvios(cabecera,detalle,res,mode){
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
  static async VistaPreviaPedidoAvios(req, res) {
    console.log("Iniciando exportado del formato de avios")
    const tipo = req.params.tipo
    const mode = req.params.mode || 'download' // 'view' or 'download'
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      console.log("Cabecera:", cabecera)
      console.log("Detalle:", detalle)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El tipo de pedido es :", tipo)
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
  static async VistaRapidaPedidoAvios(req, res) {
    console.log("Iniciando exportado del formato de avios otros")
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []

    if(id !== '') {
      cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(id)
    } else {
      if(data.id){
        cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
        detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      }else{
        cabecera = JSON.parse(data.info)
        detalle = JSON.parse(data.detalle)
      }
    }
    ProduccionController.GeneraPedidoAvios(cabecera,detalle,res,mode)
  }
  static async VistaRapidaPedidoTelas(req, res) {
    console.log("Hla platanos maduros")
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const tipo = req.params.tipo || 'telas'
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    // console.log("El tipo de pedido es :",tipo)
    // console.log("La info pasada a la vista es :",JSON.parse(data.info),JSON.parse(data.detalle))

    if(id !== '') {
      cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(id)
    } else {
      if(data.id){
        cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
        detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      }else{
        cabecera = JSON.parse(data.info)
        detalle = JSON.parse(data.detalle)
      }
    }

    // if (data.id) {
    //   cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
    //   detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    //   console.log("Cabecera:", cabecera)
    //   console.log("Detalle:", detalle)
    // } else {
    //   cabecera = JSON.parse(data.info)
    //   detalle = JSON.parse(data.detalle)
    // }
    ProduccionController.GenerarPedidoTelas(cabecera,detalle,res,mode,tipo)
    
  }
  static async GenerarPedidoTelas(cabecera,detalle,res,mode){
    const tipo = 'telas'
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    if(cabecera.emisor == 'NEXT'){
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    }else{
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_elenex_company.png')
    }
    const BINARY_CHUNKS3 = await fs.readFile('public/images/orden_pedido.png')
    
    res.render(
      // `${tipo == 'avios' ? 'avios_v3' : 'telas_v2'}`,
      'telas_v2',
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
                <td style="text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
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
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)
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
                <td style="width:100px;text-align: center;background-color:#ddebf7;text-wrap-mode:nowrap"><strong>SUB TOTAL</strong></td>
                <td style="width:90px;text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${total}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;"><strong>IGV 18%</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 0.18).toFixed(2) : 0}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 1.18).toFixed(2) : total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          }
        },

      },
      async (err, html) => {
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
            res.send(html)
          }
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async VistaRapidaPedidoTelas_(req, res){
    console.log("Iniciando exportado del formato de telas,preview get")
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const data = req.body
    let cabecera = []
    let detalle = []

    if(id !== '') {
      cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(id)
    } else {
      if(data.id){
        cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
        detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      }else{
        cabecera = JSON.parse(data.info)
        detalle = JSON.parse(data.detalle)
      }
    }
    console.log("Cabecera:", cabecera)
    console.log("Detalle:", detalle)
    // const data = req.body
    // console.log("La informacion es:", data)
    // let cabecera = []
    // let detalle = []
    // if (data.id) {
    //   cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
    //   detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    // } else {
    //   cabecera = JSON.parse(data.info)
    //   detalle = JSON.parse(data.detalle)
    // }
    ProduccionController.GenerarPedidoTelas(cabecera,detalle,res,mode)
  }
  static async GenerarPedidoTelas_(cabecera,detalle,res,mode) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    if(cabecera.emisor == 'NEXT'){
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    }else{
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_elenex_company.png')
    }
    const BINARY_CHUNKS3 = await fs.readFile('public/images/orden_pedido.png')
    res.render(
      'telas_v2',
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
                <td style="text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
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
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)
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
                <td style="width:100px;text-align: center;background-color:#ddebf7;text-wrap-mode:nowrap"><strong>SUB TOTAL</strong></td>
                <td style="width:90px;text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${total}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;"><strong>IGV 18%</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 0.18).toFixed(2) : 0}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 1.18).toFixed(2) : total}</td>
              </tr>`)
            return itemsAsHtml.join("\n")
          }
        },

      },
      async (err, html) => {
        try {
          console.log("Dentro del renderizado de la vista")
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
          console.log("Error al generar el PDF:", error)
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async VistaPreviaPedido(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    console.log("La informacion es:", data)
    let cabecera = []
    let detalle = []
    // console.log("El tipo de pedido es :",tipo)
    // console.log("La info pasada a la vista es :",JSON.parse(data.info),JSON.parse(data.detalle))

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
      console.log("Cabecera:", cabecera)
      console.log("Detalle:", detalle)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    console.log("DEtalle de la cabecerea es: ", cabecera)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    let BINARY_CHUNKS2 = null
    if(cabecera.emisor == 'NEXT'){
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    }else{
      BINARY_CHUNKS2 = await fs.readFile('public/images/logo_elenex_company.png')
    }
    
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')
    // const tipo = JSON.parse(data.info).tipo
    console.log("El tipo de pedido es :", tipo)
    res.render(
      `${tipo == 'avios' ? 'avios_v3' : 'telas_v2'}`,
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
                <td style="text-align: center;background-color:#ddebf7;">` + item['precio'] + `</td>
                <td style="text-align: center;background-color:#ddebf7;">` + (parseFloat(item['cantidad']) * parseFloat(item['precio'])).toFixed(2) + `</td>
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
                    <td style="text-align: center;background-color:#ddebf7;"></td>
                  </tr>`)
              // items.push({color:'',producto:'',cantidad:0,unidad:'',precio:0,importe:0})
            }
            const total = items.reduce((carry, valor) => { carry += parseFloat(valor['cantidad']) * parseFloat(valor['precio']); return carry }, 0).toFixed(2)
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
                <td style="width:100px;text-align: center;background-color:#ddebf7;text-wrap-mode:nowrap"><strong>SUB TOTAL</strong></td>
                <td style="width:90px;text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${total}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;"><strong>IGV 18%</strong></td>
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 0.18).toFixed(2) : 0}</td>
              </tr>`)
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
                <td style="text-align: center;background-color:#ddebf7;">${cabecera.moneda == 'USD' ? '$' : 'S/.'} ${parseInt(cabecera.igv) ? (total * 1.18).toFixed(2) : total}</td>
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
  //////////////////////////////
  // Seccion registro de guias //
  //////////////////////////////
  static async getListaPedidos(req, res) {
    console.log("Obteniendo lista de pedidos")
    // const limit = req.params.limit
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaPedidos(search)
    res.json(data)
  }
  static async getNuevoPedido(req, res) {
    const data = await ProduccionModel.getNuevoPedido()
    res.json(data)
  }
  static async saveInfoPedidos(req, res) {
    const data = await ProduccionModel.saveInfoPedidos(req.body)
    // res.json({ ok: true, message: 'datos guardados' })
    res.json(data)
  }
  static async getInfoPedidos(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoPedidoCab(id)
    const data2 = await ProduccionModel.getInfoPedidoDet(id)
    res.json([data[0], data2])
  }
  static async eliminarInfoPedidos(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoPedidos(id)
    res.json(data)
  }
  static async ShowInformePedido(req, res) {
    const params = req.params
    const data = await ProduccionModel.getInfoPedidoCab(params.id)
    const cruce = await ProduccionModel.getInfoPedidoDespacho(params.id)
    console.log("Mostrando informe seguimiento pedido", data)
    // console.log("Mostrando informe seguimiento pedido",detalle)
    console.log("Mostrando informe seguimiento pedido", cruce)

    let lista_despachos = [...new Set(cruce.reduce((carry, valor) => { return [...carry, valor.id_despacho] }, []))]

    let formateo = cruce.reduce((carry, valor) => {
      if (carry.find(row => row.idx == valor.idx)) {
        let itm = carry.find(row => row.idx == valor.idx)
        lista_despachos.forEach((item) => {
          itm[item] = itm[item] + (valor.id_despacho == item ? valor.despacho : 0)
        })
      } else {
        lista_despachos.forEach((item) => {
          valor[item] = (item == valor.id_despacho ? valor.despacho : 0)
        })
        carry.push(valor)
      }
      return carry
    }, [])

    let final = formateo.reduce((carry, valor) => {
      valor['total_despacho'] = 0
      lista_despachos.forEach((item) => {
        valor['total_despacho'] += valor[item]
      })
      valor['diferencia'] = (valor['total_despacho'] - valor['cantidad']).toFixed(2)
      valor['importe_inicial'] = (valor['cantidad'] * valor['precio']).toFixed(2)
      // valor['importe_despacho'] = (valor['total_despacho'] * valor['precio']).toFixed(2)
      valor['importe_despacho'] = (valor['total_despacho'] * valor['precio_despacho']).toFixed(2)
      // valor['importe_diferencia'] = (valor['diferencia'] * valor['precio']).toFixed(2)
      valor['importe_diferencia'] = valor['importe_despacho'] - valor['importe_inicial']
      carry.push(valor)
      return carry
    }, [])
    console.log("Nueve cruce:", final)
    res.render('pedidoinforme', {
      datos: data[0],
      detalle: final,
      despachos: lista_despachos,
      date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      helpers: {
        plusindex(index) {
          return index + 1
        },
        foo(items) {
          let itemsAsHtml = null
          let total_inicial = 0
          let total_final = 0
          // let extra = 20 - items.length
          itemsAsHtml = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `<tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};"><td style="width:25px;text-align: center;font-size:.65rem;">${key + 1}</td><td style="width:130px;text-align:left;font-size:.65rem;font-weight:bold;">` + item['producto'] + ' ' + item['color'] + `</td><td style="width:30px;text-align: center;font-size:.65rem;">` + item['cantidad'] + `</td><td style="width:40px;text-align: center;font-size:.65rem;">` + item['precio'] + `</td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.65rem;">` + item['importe_inicial'] +

              `<td style="width:40px;text-align: center;font-size:.65rem;">` + lista_despachos.map((id) => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("") + `</td>`
              // lista_despachos.map((id)=>`<td style="width:40px;text-align: center;font-size:.65rem;">${item[id]}</td>`).join("")

              + `<td style="width: 40px;text-align: center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.65rem;">` + item['diferencia'] + `</td></td><td style="width:40px;text-align: center;font-size:.65rem;">` + item['precio_despacho'] + `</td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.65rem;">` + item['importe_despacho'] + `</td></tr>`

          })
          itemsAsHtml.push(`<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">DIFERENCIA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`)
          return itemsAsHtml.join("\n")
        }
      }
    }, async (err, html) => {
      try {
        const browser = await puppeteer.launch();
        const version = await browser.version();
        console.log(`Versión de Chrome: ${version}`);
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfOptions = {
          // format: 'A4',
          // width: '27.94cm',
          // height: '20cm',
          height: '27.94cm',
          width: '20cm',
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
    })
    // res.render('estampado',{
    //   info:params,
    //   detalle:data,
    //   fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()  
    // })
  }
  static async ShowInformeServicio(req, res) {
    console.log("Mostrando el procesos de informe de muestra por q esta fallando")
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const cruce = await ProduccionModel.getInfoGuiaDespacho(params.id)

    let lista_despachos = [...new Set(cruce.reduce((carry, valor) => { return [...carry, valor.id_despacho] }, []))]

    let formateo = cruce.reduce((carry, valor) => {
      if (carry.find(row => row.idx == valor.idx)) {
        let itm = carry.find(row => row.idx == valor.idx)
        lista_despachos.forEach((item) => {
          itm[item] = itm[item] + (valor.id_despacho == item ? valor.despacho : 0)
        })
      } else {
        lista_despachos.forEach((item) => {
          valor[item] = (item == valor.id_despacho ? valor.despacho : 0)
        })
        carry.push(valor)
      }
      return carry
    }, [])

    let final = formateo.reduce((carry, valor) => {
      valor['total_despacho'] = 0
      lista_despachos.forEach((item) => {
        valor['total_despacho'] += valor[item]
      })
      valor['diferencia'] = (valor['total_despacho'] - valor['cantidad']).toFixed(2)
      valor['importe_inicial'] = (valor['cantidad'] * valor['costo']).toFixed(2)
      // valor['importe_despacho'] = (valor['total_despacho'] * valor['precio']).toFixed(2)
      valor['importe_despacho'] = (valor['total_despacho'] * valor['costo']).toFixed(2)
      // valor['importe_diferencia'] = (valor['diferencia'] * valor['precio']).toFixed(2)
      valor['importe_diferencia'] = valor['importe_despacho'] - valor['importe_inicial']
      carry.push(valor)
      return carry
    }, [])
    console.log("Nueve cruce:", final)
    res.render('servicioinforme', {
      datos: data[0],
      detalle: final,
      despachos: lista_despachos,
      date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      helpers: {
        plusindex(index) {
          return index + 1
        },
        foo(items) {
          let itemsAsHtml = null
          let total_inicial = 0
          let total_final = 0
          // let extra = 20 - items.length
          itemsAsHtml = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `<tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};"><td style="width:25px;text-align: center;font-size:.65rem;">${key + 1}</td><td style="width:130px;text-align:left;font-size:.65rem;font-weight:bold;">` + item['articulo'] + ' ' + item['color'] + `</td><td style="width:30px;text-align: center;font-size:.65rem;">` + item['cantidad'] + `</td><td style="width:40px;text-align: center;font-size:.65rem;">` + item['costo'] + `</td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.65rem;">` + item['importe_inicial'] +

              `<td style="width:40px;text-align: center;font-size:.65rem;">` + lista_despachos.map((id) => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("") + `</td>`
              // lista_despachos.map((id)=>`<td style="width:40px;text-align: center;font-size:.65rem;">${item[id]}</td>`).join("")

              + `<td style="width: 40px;text-align: center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.65rem;">` + item['diferencia'] + `</td></td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.65rem;">` + item['importe_despacho'] + `</td></tr>`

          })
          itemsAsHtml.push(`<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">RESTA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`)
          return itemsAsHtml.join("\n")
        }
      }
    }, async (err, html) => {
      try {
        const browser = await puppeteer.launch();
        const version = await browser.version();
        console.log(`Versión de Chrome: ${version}`);
        const page = await browser.newPage();
        await page.setContent(html);
        const pdfOptions = {
          // format: 'A4',
          // width: '27.94cm',
          // height: '20cm',
          height: '27.94cm',
          width: '20cm',
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
        // res.send({ data: pdfBuffer.toString('base64') })
        res.send(html)
      } catch (error) {
        res.status(500).send('Error al generar el PDF');
        // await browser.close();
      } finally {
        // await browser.close();
      }
    })
  }
  static async ShowInformeServicio2_(req, res) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const cruce = await ProduccionModel.getInfoGuiaDespacho(params.id)

    let lista_despachos = [...new Set(cruce.reduce((carry, valor) => { return [...carry, valor.id_despacho] }, []))]

    let formateo = cruce.reduce((carry, valor) => {
      if (carry.find(row => row.idx == valor.idx)) {
        let itm = carry.find(row => row.idx == valor.idx)
        lista_despachos.forEach((item) => {
          itm[item] = itm[item] + (valor.id_despacho == item ? valor.despacho : 0)
        })
      } else {
        lista_despachos.forEach((item) => {
          valor[item] = (item == valor.id_despacho ? valor.despacho : 0)
        })
        carry.push(valor)
      }
      return carry
    }, [])

    let final = formateo.reduce((carry, valor) => {
      valor['total_despacho'] = 0
      lista_despachos.forEach((item) => {
        valor['total_despacho'] += valor[item]
      })
      valor['diferencia'] = (valor['total_despacho'] - valor['cantidad']).toFixed(2)
      valor['importe_inicial'] = (valor['cantidad'] * valor['costo']).toFixed(2)
      valor['importe_despacho'] = (valor['total_despacho'] * valor['costo']).toFixed(2)
      valor['importe_diferencia'] = valor['importe_despacho'] - valor['importe_inicial']
      carry.push(valor)
      return carry
    }, [])
    console.log("Nueve cruce:", final)
    res.render('servicioinforme2', {
      datos: data[0],
      detalle: final,
      despachos: lista_despachos,
      date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      helpers: {
        plusindex(index) {
          return index + 1
        },
        foo(items, cab) {
          let itemsAsHtml = null
          let total_inicial = 0
          let total_final = 0
          // let extra = 20 - items.length
          itemsAsHtml = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `
            <tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};">
              <td style="width:25px;text-align: center;font-size:.9rem;">${key == 0 ? cab.fec_emision : ''}</td>
              <td style="width:25px;text-align: center;font-size:.9rem;">#${key == 0 ? cab.idx : ''}</td>
              <td style="width:30px;text-align: center;font-size:.9rem;">`+ item['cantidad'] + `</td>
              <td style="width:130px;text-align:left;font-size:.9rem;font-weight:bold;">`+ item['articulo'] + ' ' + item['color'] + `</td>
              <td style="width:40px;text-align: center;font-size:.9rem;">`+ item['costo'] + `</td>
              <td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;">`+ item['importe_inicial'] +

              `</td><td style="width:40px;text-align: center;font-size:.9rem;">` + lista_despachos.map((id) => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("") + `</td>`

              + `<td style="width: 40px;text-align: center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.9rem;">` + item['diferencia'] + `</td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;">` + item['importe_despacho'] + `</td></tr>`

          })
          console.log("pepe mujika:", itemsAsHtml)
          let pp = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `
            <tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};">
              <td style="width:25px;text-align: center;font-size:.9rem;">${key == 0 ? cab.fec_emision : ''}</td>
              <td style="width:25px;text-align: center;font-size:.9rem;">${'#' + (key == 0 ? cab.idx : '')}</td>
              <td style="width:30px;text-align: center;font-size:.9rem;">`+ item['cantidad'] + `</td>
              <td style="width:130px;text-align:left;font-size:.9rem;font-weight:bold;">`+ item['articulo'] + ' ' + item['color'] + `</td>
              <td style="width:40px;text-align: center;font-size:.9rem;">`+ item['costo'] + `</td>
              <td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;">`+ item['importe_inicial'] +

              `</td><td style="width:40px;text-align: center;font-size:.9rem;">` + lista_despachos.map((id) => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("") + `</td>`

              + `<td style="width: 40px;text-align: center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.9rem;">` + item['diferencia'] + `</td><td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;">` + item['importe_despacho'] + `</td></tr>`

          })
          console.log("adsff asfs:", pp)
          console.log("poipoipo:", itemsAsHtml.concat(pp))
          // itemsAsHtml.concat(pp)
          // console.log("pepe mujika:",itemsAsHtml)
          // itemsAsHtml.push(`<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">RESTA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`)
          return itemsAsHtml.concat(pp).join("\n")
        }
      }
    })
  }
  static async ShowInformeServicio2(req, res) {
    const params = req.query
    console.log("Los paramentros enviados son:", params)
    const data = await ProduccionModel.getInfoInforme(params)
    const data2 = await ProduccionModel.getInfoAbonos(params)

    console.log("Mostrando abonos", data2)
    res.render('informe', {
      datos: data,
      abonos: data2,
      helpers: {
        plusindex(index) {
          return index + 1
        },
        foo(cab, abonos) {
          const colorfase = {
            'CONFECCION': 'rgb(168, 85, 247)',
            'ESTAMPADO': 'rgb(107, 114, 128)',
            'ACABADOS': 'rgb(234, 49, 8)',
            'LAVANDERIA': 'rgb(34, 197, 94)',
            'MOLDES': 'bg-orange-500',
            'OJAL BOTON': 'rgb(8, 132, 234)',
            'CORTE': 'bg-rose-400',
            'BORDADO': 'rgb(234, 179, 8)',
          }
          let itemsAsHtml = []
          let total_inicial = 0
          let total_final = 0

          let formateo = cab.reduce((carry, item) => {
            if (Object.keys(carry).includes(item.proveedor) && Object.keys(carry[item.proveedor]).includes(`${item.id_guia}`)) {
              carry[item.proveedor][`${item.id_guia}`].push(item)
            } else {
              carry[item.proveedor] = { [item.id_guia]: [item] }
            }
            return carry
          }, {})

          // itemsAsHtml = 
          Object.keys(formateo).forEach(prov => {
            let fila = ``
            let total_despacho = 0
            let total_cantidad = 0
            let total_imp = 0
            let id_sercivio = undefined
            fila = `<tr style="height:32px;font-size:14px;font-weight:900;background-color:#ebebeb;"><td colspan='8'>${prov}</td></tr>`
            Object.keys(formateo[prov]).forEach((guia) => {

              fila += `<tr style="height:32px;font-size:12px;"><td colspan='8'>
                <div style='width:80px;color:white;text-align:center;border-radius:20px;font-size:9px;padding:2px;background-color:${colorfase[formateo[prov][`${guia}`][0].servicio]};'}>${formateo[prov][`${guia}`][0].servicio}</div>
                <div style="padding:5px;">
                  <strong>Guia:</strong>#${guia} - 
                  <strong>FechaEmision:</strong>${formateo[prov][`${guia}`][0].fec_emision} - 
                  <strong>FechaRetorno:</strong>${formateo[prov][`${guia}`][0].fec_retorno} -
                  <strong>OC:</strong>${formateo[prov][`${guia}`][0].orden_ref} 
                </div>
              </td></tr>`

              itemsAsHtml = itemsAsHtml.concat(formateo[prov][`${guia}`].forEach((item, key) => {
                fila += `
                  <tr style="height:28px;border-bottom:.2px solid gray;">
                    <td style="width:10px;text-align: center;font-size:.9rem;"></td>
                    <td style="width:30px;text-align: center;font-size:.9rem;">`+ item['cantidad'] + `</td>
                    <td style="width:130px;text-align:left;font-size:.9rem;font-weight:bold;">`+ item['articulo'] + `</td>
                    <td style="width:40px;text-align: center;font-size:.9rem;">`+ item['costo'] + `</td>
                    <td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;background-color:#ebebeb;">`+ (item['cantidad'] * item['costo']).toFixed(2) + `</td>
                    <td style="width:40px;text-align: center;font-size:.9rem;">`+ (item['guia'] ?? '-') + `</td>
                    <td style="width: 40px;text-align: center;color:${(item['total_despacho'] - item['cantidad']) >= 0 ? 'green' : 'red'};font-size:.9rem;">` + (item['total_despacho'] ?? '-') + `</td>
                    <td style="width: 40px;text-align: center;font-weight:bold;font-size:.9rem;">`+ (item['total_despacho'] * item['costo']).toFixed(2) + `</td>
                  </tr>
                  `
                total_imp += parseFloat(item['total_despacho'] * item['costo'])
                total_despacho += parseFloat(item['total_despacho'] ?? 0)
                total_cantidad += parseFloat(item['cantidad'] ?? 0)
                id_sercivio = guia
                // return fila
              }))
              fila += `
                <tr style="height:30px;border-bottom:.2px solid gray;">
                  <td></td>
                  <td style="text-align:center;">${total_cantidad}</td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td></td>
                  <td style="text-align:center;">${total_despacho}</td>
                  <td style="text-align:center;">${total_imp.toFixed(2)}</td>
                </tr>              
              `
              abonos.filter(row => row.id_servicio_CAB == guia).forEach((item, key) => {
                fila += `
                  <tr style="height:30px;">
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td></td>
                    <td style="text-align:center;color:red;">ABONO-${key + 1}</td>
                    <td style="text-align:center;color:red;">${item['importe']}</td>
                  </tr>
                `
              })
              fila += `
                <tr style="height:30px;">
                  <td></td>
                </tr>              
              `
            })
            // itemsAsHtml = itemsAsHtml.concat()
            itemsAsHtml.push(fila)
          })
          // itemsAsHtml.push(`<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr><tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length*0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">RESTA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`)
          // return itemsAsHtml.concat(pp).join("\n")
          return itemsAsHtml.join("\n")
        }
      }
    })
    // },async (err,html)=>{
    //   try {
    //     console.log(html)
    //     res.json({info:html})
    //   } catch (error) {
    //     res.status(500).send('Error al generar el PDF');
    //   } finally{
    //   }
    // })
  }
  ///////////////////////////////////
  // Seccion registro de despachos //
  ///////////////////////////////////
  static async getListaDespachos(req, res) {
    const search = req.params.search ?? ''
    const tipo = req.params.tipo ?? ''
    const data = await ProduccionModel.getListaDespachos(tipo, search)
    res.json(data)
  }
  static async saveInfoDespachosPedido(req, res) {
    const data = await ProduccionModel.saveInfoDespachosPedido(req.body)
    res.json(data)
  }
  static async saveInfoDespachosGuia(req, res) {
    const data = await ProduccionModel.saveInfoDespachosGuia(req.body)
    res.json(data)
  }
  static async getInfoDespachos(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoDespachoCab(id)
    const data2 = await ProduccionModel.getInfoDespachoDet(id, data[0].tipo)
    const data3 = await ProduccionModel.getInfoDespachoAdi(id, data[0].tipo)
    console.log("chifa", data3)
    res.json([data[0], data2, data3])
  }
  static async eliminarInfoDespachos(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoDespachos(id)
    res.json(data)
  }
  static async validaInventario(req, res) {
    console.log("Validando inventario")
    const data = await ProduccionModel.validaInventario()
    res.json(data)
  }
  static async getPenalidadesServicios(req, res) {
    const data = await ProduccionModel.getPenalidadesServicios()
    res.json(data)
  }
  static async getListaRetiros(req, res) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaRetiros(search)
    res.json(data)
  }
  static async getInfoRetiros(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoRetiroCab(id)
    const data2 = await ProduccionModel.getInfoRetiroDet(id, data[0].tipo)
    res.json([data[0], data2])
  }
  static async saveInfoRetiro(req, res) {
    const data = await ProduccionModel.saveInfoRetiro(req.body)
    res.json(data)
  }
}
