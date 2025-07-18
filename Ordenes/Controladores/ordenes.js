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
  static async getOrdenesCorte(req, reply) {
    // const user_data = req.session
    const search = req.params.search ?? ''
    const data = await OrdenesModel.getOrdenesCorte(search)
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
  static async saveFaseOrden(req, resp) {
    const imagenes = req.files
    const info = req.body
    const user_data = req.session
    const data = await OrdenesModel.saveFaseOrden(info, user_data)

    async function example(ruta,filename) {
      const client = new Client()
      client.ftp.verbose = false
      try {
        await client.access({
            host: "jsjfact.com",
            user: "ftpnuevo",
            password: "JSJPeru2024++",
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

    // resp.json(data)
  }
  static async saveFaseMolde(req, resp) {
    const info = req.body
    const user_data = req.session
    const data = await OrdenesModel.saveFaseMolde(info, user_data)
    resp.json(data)
  }
  static async saveFaseCorte(req, resp) {
    const info = req.body
    const user_data = req.session
    const data = await OrdenesModel.saveFaseCorte(info, user_data)
    resp.json(data)
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
  static async getStatusGeneral2(req, res) {
    const id = req.params.id
    const data = await OrdenesModel.getStatusGeneral2(id)
    res.json(data)
  }
  static async updateCombos(req, reply) {
    const data = await OrdenesModel.ActualizaCombos()
    reply.json(data)
  }
  static async ExtraerItemsCaja(req, reply) {
    let idorden = req.params.id
    const data = await OrdenesModel.ExtraerItemsCaja(idorden)
    reply.json(data)
  }
  static async getFasesProduccion(req, reply) {
    // console.log("Info req es:",req)
    const categoria = req.params.categoria ?? ''
    const data = await OrdenesModel.getFasesProduccion(categoria)
    reply.json(data)
  }
  static async regulaLizzet(req, reply) {
    // console.log("Info req es:",req)
    // const categoria = req.params.categoria ?? ''
    const data = await OrdenesModel.regulaLizzet()
    reply.json(data)
  }
  static async printSugerido_back(req, reply) {
    const params = req.params
    const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    console.log("La info de la orde es:",data[0].ordenes_combos,data[0].ordenes_combos[0].fracciones)
    
    reply.render(
      'sugerido',
      {
        cabecera: data[0],
        helpers: {
          plusindex(index) {
            return index + 1
          },
          relleno: function(info){
            let top = `
              <div id="main">
                <div id="header">
                </div>
                <div id="body">
                  <div>
                    <div>Image y datos</div>
                    <div id="orden">
                      <div>NEXT COMPANY</div>
                      <div>
                        <div>MARCA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>MODELO</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>PROVEEDOR</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>TELA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>CURVA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>TALLAS</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>CANTIDAD</div>
                        <div>0</div>
                      </div>
                    </div>
                  </div>
                  <div>
              `
            let down = `
                  </div>
                </div>
                <div id="footer" style="text-align:center;">
                  <div >
                    NOTA - LIQUIDAR ROLLO COMPLETO
                  </div>
                  <div >
                    LA CALIDAD ES RESPONSABILIDAD DE TODOS
                  </div>
                </div>
              </div>
              `
            let middle = info.ordenes_combos.map(row=>{
              return `
                  <div>
                    <div class="combo">
                      <div>${row.color_combo}</div>
                      <div>${row.fracciones.reduce((c,v)=>c + parseInt(v.cantidad),0)}</div>
                    </div>
                    <div class="talla">
                      ${row.fracciones.map(row=>`<div>${row.talla}</div>`).join('\n')}
                    </div>
                    <div class="cantidad">
                      ${row.fracciones.map(row=>`<div>${row.cantidad}</div>`).join('\n')}
                    </div>
                    <div>tela principal</div>
                    <div>jersey</div>
                    <div>otro</div>
                  </div>
              `
            }).join('\n')
            return top + middle + down
            // return '<div>Hola mundo</div>'
        },
        }
      });
  }
  static async printSugerido(req, reply) {
    const params = req.params
    const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    console.log("La info de la orde es:",data[0].ordenes_combos,data[0].ordenes_combos[0].fracciones)

    // La info de la orde es: 
    // ordenes_combos = [
    //   {
    //     fracciones: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    //     color_combo: 'NEGRO',
    //     id_orden_CAB: 207,
    //     cantidad_combo: 112
    //   },
    //   {
    //     fracciones: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    //     color_combo: 'IVORY',
    //     id_orden_CAB: 207,
    //     cantidad_combo: 56
    //   },
    //   {
    //     fracciones: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    //     color_combo: 'MELANGE',
    //     id_orden_CAB: 207,
    //     cantidad_combo: 56
    //   },
    //   {
    //     fracciones: [ [Object], [Object], [Object], [Object], [Object], [Object] ],
    //     color_combo: 'VERDE PETROLEO',
    //     id_orden_CAB: 207,
    //     cantidad_combo: 56
    //   }
    // ] 
    // fracciones = [
    //   { talla: 'l', cantidad: 32, id_combo_CAB: 473 },
    //   { talla: 'm', cantidad: 40, id_combo_CAB: 473 },
    //   { talla: 's', cantidad: 24, id_combo_CAB: 473 },
    //   { talla: 'xl', cantidad: 16, id_combo_CAB: 473 },
    //   { talla: 'xs', cantidad: 0, id_combo_CAB: 473 },
    //   { talla: 'xxl', cantidad: 0, id_combo_CAB: 473 }
    // ]
    
    reply.render(
      'sugerido',
      {
        cabecera: data[0],
        helpers: {
          plusindex(index) {
            return index + 1
          },
          relleno: function(info){
            let top = `
              <div id="main" style="display:table;border-collapse:collapse;">
                <div id="header" style="display:table-row;">
                </div>
                <div id="body" style="display:table-row;">
                  <div class="cell" style="display:table-cell;">
                    <div>Image y datos</div>
                    <div id="orden">
                      <div>NEXT COMPANY</div>
                      <div>
                        <div>MARCA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>MODELO</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>PROVEEDOR</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>TELA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>CURVA</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>TALLAS</div>
                        <div>0</div>
                      </div>
                      <div>
                        <div>CANTIDAD</div>
                        <div>0</div>
                      </div>
                    </div>
                  </div>
                  <div style="display:table-cell;">sdffd
              `
            let down = `
                  </div>
                </div>
                <div id="footer" style="display:table-row;">
                  <div style="display:table;">
                    <div style="display:table-row;">
                      <div style="display:table-cell;">
                        NOTA - LIQUIDAR ROLLO COMPLETO
                      </div>
                    </div>
                  </div>
                </div>
                <div id="footer" style="display:table-row;text-align:center;">
                  LA CALIDAD ES RESPONSABILIDAD DE TODOS
                </div>
              </div>
              `
            let middle = info.ordenes_combos.map(row=>{
              return `
                  <div style="display:table-row;">
                    <div class="combo">
                      <div class="cell">${row.color_combo}</div>
                      <div class="cell">${row.fracciones.reduce((c,v)=>c + parseInt(v.cantidad),0)}</div>
                    </div>
                    <div class="talla">
                      ${row.fracciones.map(row=>`<div class="cell">${row.talla}</div>`).join('\n')}
                    </div>
                    <div class="cantidad">
                      ${row.fracciones.map(row=>`<div class="cell">${row.cantidad}</div>`).join('\n')}
                    </div>
                    <div class="cell">tela principal</div>
                    <div class="cell">jersey</div>
                    <div class="cell">otro</div>
                  </div>
              `
            }).join('\n')
            return top + middle + down
            // return '<div>Hola mundo</div>'
        },
        }
      });
  }
  static async printSugerido_(req, reply) {
    const params = req.params
    // const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    // cons
    
    reply.render(
      'sugerido',
      {
        helpers: {
          plusindex(index) {
            return index + 1
          },
          relleno: function(info){
            
            // return `
            //   <div id="main" style="display:table;border-collapse:collapse;">
            //     <div style="display:table-row">
            //       <div style="display:table-cell;width:100px;">
            //         sasdf
            //       </div>
            //       <div style="display:table-cell">
            //         sasdf
            //       </div>
            //     </div>
            //     <div style="display:table-row">
            //       <div style="display:table-cell">
            //         sasdf
            //       </div>
            //     </div>
            //   </div>
            // `
            return `
              <table>
                <tbody>
                  <tr>
                    <td>COMBO</td>
                    <td>COMBO2</td>
                    <td>COMBO1</td>
                  </tr>
                  <tr></tr>
                  <tr></tr>
                </tbody>
              </table>
            
            `
        },
        }
      });
  }
}
