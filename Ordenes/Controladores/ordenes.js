// import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import path from 'node:path';
import { Client } from "basic-ftp"
// import puppeteer from 'puppeteer';
// import { OtherTarget } from "puppeteer-core";
// import { concat } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { OrdenesModel } from "../Servicios/ordenes.js";

export class OrdenesController {
  static async getOrdenes(req, reply) {
    // const user_data = req.session
    const search = req.params.search ?? ''
    const data = await OrdenesModel.getOrdenes(search)
    // console.log(data)
    reply.json(data)
  }
  static async getOrdenesByParams(req, reply) {
    const info = req.body
    const data = await OrdenesModel.getOrdenesByParams(info.params)
    reply.json(data)
  }
  static async getOrdenesById(req, reply) {
    const info = req.params
    const data = await OrdenesModel.getOrdenesById(info)
    reply.json(data)
  }
  static async saveInfoOrdenes(req, resp) {
    // console.log("Imagen recibida:", imagen)
    const imagenes = req.files
    console.log("Imagenes recibidas:", imagenes)
    const info = req.body
    const user_data = req.session
    console.log("Por aqui vamos!")
    const data = await OrdenesModel.saveInfoOrdenes(info, user_data)

    console.log("Informacion del nombre de imagen :",data.filename)

    async function example(ruta,filename) {
      const client = new Client()
      client.ftp.verbose = false
      try {
        await client.access({
            host: "jsjfact.com",
            user: "ftpnuevo",
            password: "JSJPeru2024++",
            // secure: true
        })
        await client.uploadFrom(ruta, "/facturador/imagenez/" + filename)
        .then(res => {
          console.log("Archivo subido correctamente: ", res);
        })
        .catch(err => {
          console.error("Error al subir el archivo: ", err);
        });
      }
      catch(err) {
          console.log(err)
      }
      client.close()
    }

    if(imagenes.length > 0 && data.ok && data.filename){
      let str = 'public/images';
      new Promise((resolve, reject) => {
        imagenes.forEach(async element => {
          const oldPath = element.path;
          const newPath = path.join(str, data.filename);
          await fs.rename(oldPath, newPath)
          resolve({ruta:newPath,file: data.filename})
        });
      }).then(async (resp) => {
        console.log("Renombrado de archivos finalizado",resp.ruta,resp.file)
        await example(resp.ruta,resp.file)
      }).finally(() => {
        resp.json(data)
      })
    }else{
      resp.json(data)
    }
    // console.log("Respuesta de services",data)
  }
  static async testMultiSelect(req, resp) {
    const info = req.body
    const data = await OrdenesModel.testMultiSelect(info)
    resp.json(data)
  }
  static async traerMultiSelect(req, resp) {
    const data = await OrdenesModel.traerMultiSelect()
    resp.json(data)
  }
  static async getAll(req, resp) {
    const user_data = req.session
    const data = await OrdenesModel.getAll(user_data)
    // console.log(data)
    // console.log(resp)
    resp.json(data)
  }
  static async updateItems(req, resp) {
    // const data = await OrdenesModel.updateItems()
    // resp.json(data)
    // console.log(resp)
  }
  static async deleteOrden(req, resp) {
    let id = req.params.id
    const data = await OrdenesModel.deleteOrden(id)
    resp.json(data)
    // console.log(req)
    // resp.json([{resp:id}])
  }
  static async getListaProveedores(req, res) {
    const limit = req.params.limit
    const data = await OrdenesModel.getListaProveedores(limit)
    res.json(data)
  }
  static async searchProveedor(req, res) {
    const info = req.params.info
    const data = await OrdenesModel.searchProveedor(info)
    res.json(data)
  }
  static async searchProveedorById(req, res) {
    const info = req.params.info
    const data = await OrdenesModel.searchProveedorById(info)
    res.json(data)
  }
  static async getStatusGeneral(req, res) {
    const id = req.params.id
    const data = await OrdenesModel.getStatusGeneral(id)
    res.json(data)
  }
}