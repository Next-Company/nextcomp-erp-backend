import { ProduccionModel } from "../Servicios/produccion.js";
import PDFDocument from "pdfkit"
import fs from "node:fs"
// import PDFDocument from "pdfkit";

export class ProduccionController {
  static async getOrdenes(req, reply) {
    const user_data = req.session
    const data = await ProduccionModel.getOrdenes(user_data)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
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
}