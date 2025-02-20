import { ProduccionModel } from "../Servicios/produccion.js";
import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import puppeteer from 'puppeteer';
// import { width } from "pdfkit/js/page";
// import { height } from "pdfkit/js/page";
// import PDFDocument from "pdfkit";

export class ProduccionController {
  static async getOrdenes(req, reply) {
    const user_data = req.session
    const data = await ProduccionModel.getOrdenes(user_data)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async exportInfoEstampado(req,resp){
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    console.log("Info cabecera:",data2)
    console.log("Fecha:",new Date(Date.parse(data2[0].created_at)).toLocaleDateString())
    resp.render(
    'estampado',
    {
      info:params,
      detalle:data,
      fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
    },
    async (err,html)=>{
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
        resp.send({data:pdfBuffer.toString('base64')})
      } catch (error) {
        resp.status(500).send('Error al generar el PDF');
      }
    });
  }
  static async exportInfoGuia(req,resp){
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data3 = await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleString('en-GB'))
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleDateString('en-GB'))
    // console.log("Fecha creacion :",(new Date(data[0].created_at)).toLocaleTimeString('en-GB'))
    console.log("Info cabecera:",data)
    // console.log("Info detalle:",data2)
    // console.log("Fecha:",new Date(Date.parse(data2[0].created_at)).toLocaleDateString())
    resp.render(
    'guia_back',
    {
      info:params,
      cabecera:data[0],
      detalle:data2.filter(row=>!row.isprototipo),
      prototipos:data2.filter(row=>row.isprototipo),
      numproto:data2.filter(row=>row.isprototipo).length,
      date:(new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time:(new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      idguia:`${data[0].idx}`.padStart(10,0),
      totalunid:data2.reduce((carry,valor)=>{
        carry += valor.isprototipo ? 0 : parseFloat(valor.cantidad)
        return carry;
      },0),
      proveedor:data3[0],
      helpers: {
        plusindex(index) { 
          return index + 1
        }
      }
      // diasprod:7
      // fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
    },
    async (err,html)=>{
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
        resp.send({data:pdfBuffer.toString('base64')})
      } catch (error) {
        resp.status(500).send('Error al generar el PDF');
        // await browser.close();
      } finally{
        // await browser.close();
      }
    });
  }
  static async exportPedidoAvios(req,resp){
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
    'avios',{
      BINARY_CHUNKS:BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2:BINARY_CHUNKS2.toString('base64'),
      datos:req.body,
      detalle:JSON.parse(req.body.detalle),
      helpers: {
        // foo() { return JSON.parse(req.body.detalle).map(row=>'<a href="">sdf</a>'); }
        foo(items,options) { 
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
          for(let i=0; i < extra; i++){
            items.push(['','','','','','',''])
          }

          const itemsAsHtml = items.map((item,key) => `<tr><td style="width: 35px;text-align: center;" contenteditable="true">${key + 1}</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[0]+`</td><td style="width: 60px;text-align: left;" contenteditable="true">`+item[1]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[2]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[3]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[4]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[5]+`</td></tr>`)

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
    ,async (err,html)=>{
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
        resp.send({data:pdfBuffer.toString('base64')})
      } catch (error) {
        resp.status(500).send('Error al generar el PDF');
      }
    });

    
  }
  static async exportPedidoTelas(req,resp){
    console.log("Iniciando el exportado:")
    console.log(req.body)
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')
    
    resp.render(
    'telas',{
      BINARY_CHUNKS:BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2:BINARY_CHUNKS2.toString('base64'),
      datos:req.body,
      detalle:JSON.parse(req.body.detalle),
      helpers: {
        foo(items,options) { 
          let extra = 22 - items.length
          for(let i=0; i < extra; i++){
            items.push(['','','','','','',''])
          }
          const itemsAsHtml = items.map((item,key) => `<tr><td style="width: 35px;text-align: center;" contenteditable="true">${key + 1}</td><td style="width: 60px;text-align: left;" contenteditable="true">`+item[0]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[1]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[2]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[3]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[4]+`</td><td style="width: 60px;text-align: center;" contenteditable="true">`+item[5]+`</td></tr>`)
          return itemsAsHtml.join("\n")
        }
      }
    }
    ,async (err,html)=>{
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
        resp.send({data:pdfBuffer.toString('base64')})
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
  static async getListaEstampados(req, res){
    const data = await ProduccionModel.getListaEstampados()
    res.json(data)
  }
  static async getInfoEstampado(req, res){
    const id = req.params.id
    const data = await ProduccionModel.getInfoEstampado(id)
    // console.log("Consulta estampado :",data)
    res.json(data)
  }
  static async saveInfoEstampado(req, res){
    // const info = req.body
    console.log("Datos del bodys:",req.body)
    // console.log("Datos del bodys:",JSON.parse(info.info))
    const data = await ProduccionModel.saveInfoEstampado(req.body)
    // console.log("Consulta estampado :",data)
    // res.json(data)
    res.json({ok:true,message:'datos guardados'})
  }
  static async eliminarInfoEstampado(req, res){
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoEstampado(id)
    res.json(data)
  }
  static async ShowInforme(req, res){
    console.log("Mostrando informe seguimiento estampado 12")
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    res.render('estampado',{
      info:params,
      detalle:data,
      fecha:new Date(Date.parse(data2[0].created_at)).toLocaleDateString()  
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
  static async getListaGuias(req, res){
    const data = await ProduccionModel.getListaGuias()
    res.json(data)
  }
  static async getInfoGuias(req, res){
    const id = req.params.id
    // const data = await ProduccionModel.getInfoGuias(id)
    const data = await ProduccionModel.getInfoGuiaCab(id)
    const data2 = await ProduccionModel.getInfoGuiaDet(id)
    console.log("Info guia by id:",data)
    res.json([data[0],data2])
  }
  static async saveInfoGuias(req, res){
    const data = await ProduccionModel.saveInfoGuias(req.body)
    res.json({ok:true,message:'datos guardados'})
  }
  static async eliminarInfoGuias(req, res){
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoGuias(id)
    res.json(data)
  }
  static async getListaProveedores(req, res){
    const limit = req.params.limit
    const data = await ProduccionModel.getListaProveedores(limit)
    res.json(data)
  }
  static async searchProveedor(req, res){
    const info = req.params.info
    const data = await ProduccionModel.searchProveedor(info)
    res.json(data)
  }
  static async searchProveedorById(req, res){
    const info = req.params.info
    const data = await ProduccionModel.searchProveedorById(info)
    res.json(data)
  }
  static async VistaPreviaPedido(req, res){
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    // const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/orden_pedido.png')
    
    res.render(
      'telas_v2',{
        BINARY_CHUNKS:BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2:BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3:BINARY_CHUNKS3.toString('base64'),
        datos:{nro_orden:'',nro_orden:'',fecha:'',proveedor:'',re:'',ruc:'',dirigido:'',girado:'',telefono:'',acuenta:'',entrega:'',observaciones:''},
        detalle:[['','','','','','','']],
        helpers: {
          foo(items,options) { 
            let extra = 18 - items.length
            for(let i=0; i < extra; i++){
              items.push(['','','','','','',''])
            }
            const itemsAsHtml = items.map((item,key) => `<tr style="height:22px;"><td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td><td style="width:60px;text-align: left;">`+item[0]+`</td><td style="width:60px;text-align: center;background-color:#ddebf7;">`+item[1]+`</td><td style="width:60px;text-align: center;background-color:#ddebf7;">`+item[2]+`</td><td style="width:60px;text-align: center;background-color:#ddebf7;">`+item[3]+`</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">`+item[4]+`</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">`+item[5]+`</td></tr>`)
            return itemsAsHtml.join("\n")
          }
        },
        
      },
      async (err,html)=>{
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
          res.send({data:pdfBuffer.toString('base64')})
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally{
          // await browser.close();
        }
      }
      
    )

  }
  static async VistaPreviaPedidoAvios(req, res){

    const data = req.body
    console.log("La info pasada a la vista es :",JSON.parse(data.info),JSON.parse(data.detalle))

    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    // const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/orden_pedido.png')
    
    res.render(
      'avios_v2',{
        BINARY_CHUNKS:BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2:BINARY_CHUNKS2.toString('base64'),
        BINARY_CHUNKS3:BINARY_CHUNKS3.toString('base64'),
        datos:JSON.parse(data.info), // {idx:'',orden_ref:'',fec_emision:'',id_proveedor_CAB,proveedor:'',fec_retorno:'',forma_pago:'',tipo:'',responsable:'',nro_contacto:'',estado:'',observaciones:''}
        detalle:JSON.parse(data.detalle), //[['','','','','','','']],
        helpers: {
          foo(items,options) { 
            let extra = 18 - items.length
            for(let i=0; i < extra; i++){
              items.push(['','','','','','',''])
            }
            const itemsAsHtml = items.map((item,key) => `<tr style="height:22px;"><td style="width:35px;text-align: center;background-color:#ddebf7;">${key + 1}</td><td style="width:60px;text-align:left;background-color:#ddebf7;">`+item[0]+`</td><td style="width:60px;text-align: center;">`+item[1]+`</td><td style="width:60px;text-align: center;background-color:#ddebf7;">`+item[2]+`</td><td style="width:60px;text-align: center;background-color:#ddebf7;">`+item[3]+`</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">`+item[4]+`</td><td style="width: 60px;text-align: center;background-color:#ddebf7;">`+item[5]+`</td></tr>`)
            return itemsAsHtml.join("\n")
          }
        },
        
      },
      async (err,html)=>{
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
            ,scale:1
          };
      
          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          res.send({data:pdfBuffer.toString('base64')})
          // res.send(pdfBuffer)
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally{
          // await browser.close();
        }
      } 
    )
  }
  //////////////////////////////
  // Seccion registro de guias //
  //////////////////////////////
  static async getListaPedidos(req, res){
    const data = await ProduccionModel.getListaPedidos()
    res.json(data)
  }
  static async saveInfoPedidos(req, res){
    const data = await ProduccionModel.saveInfoPedidos(req.body)
    res.json({ok:true,message:'datos guardados'})
  }
  static async getInfoPedidos(req, res){
    const id = req.params.id
    const data = await ProduccionModel.getInfoPedidoCab(id)
    const data2 = await ProduccionModel.getInfoPedidoDet(id)
    res.json([data[0],data2])
  }
  ///////////////////////////////////
  // Seccion registro de despachos //
  ///////////////////////////////////
  static async getListaDespachos(req, res){
    const data = await ProduccionModel.getListaDespachos()
    res.json(data)
  }
  static async saveInfoDespachos(req, res){
    const data = await ProduccionModel.saveInfoDespachos(req.body)
    res.json({ok:true,message:'datos guardados'})
  }
  static async getInfoDespachos(req, res){
    const id = req.params.id
    const data = await ProduccionModel.getInfoDespachoCab(id)
    const data2 = await ProduccionModel.getInfoDespachoDet(id)
    res.json([data[0],data2])
  }
}