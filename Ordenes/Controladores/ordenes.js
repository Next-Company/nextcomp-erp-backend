// import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import path from 'node:path';
import puppeteer from 'puppeteer';
import { Client } from "basic-ftp"
// import puppeteer from 'puppeteer';
// import { OtherTarget } from "puppeteer-core";
// import { concat } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { OrdenesModel } from "../Servicios/ordenes.js";
import { Console } from "node:console";

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
    console.log("Resputad del guardado de fase orden:",data,imagenes)
    if(imagenes.length > 0 && data.ok && data.filename){
      console.log("Imagenes recibidads:",imagenes)
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
  static async saveFaseMateriales(req, resp) {
    const info = req.body
    const user_data = req.session
    const data = await OrdenesModel.saveFaseMateriales(info, user_data)
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
    let idhoja = req.params.id_corte
    const data = await OrdenesModel.ExtraerItemsCaja(idorden,idhoja)
    reply.json(data)
  }
  static async getFasesProduccion(req, reply) {
    // console.log("Info req es:",req)
    const categoria = req.params.categoria ?? ''
    const data = await OrdenesModel.getFasesProduccion(categoria)
    reply.json(data)
  }
  static async getMaterialesProduccion(req, reply) {
    const data = await OrdenesModel.getMaterialesProduccion()
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
  static async printSugeridoV2(req, reply) {
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
            console.log("La infomarca de la cabecera es:",info)
            const tallas = {'10':'10','12':'12','14':'14','16':'16','xs':'XS/26','s':'S/28','m':'M/30','l':'L/32','xl':'XL/34','xxl':'XXL/36'}
            const materiales = eval(info.materiales_produccion) ?? []
            const combos = JSON.parse(JSON.stringify(info.ordenes_combos))
            let consolidado = []

            if(combos.length > 6){
              let limit = combos.length - parseInt(combos.length / 2)
              for(let x = 0; x < limit; x++){
                consolidado.push([combos.shift() ?? {},combos.shift() ?? {}])
              }
            }else{
              consolidado = combos.map(row=>[row])
            }
            console.log("Los combos arreglados son:",consolidado)

            let middle = info.ordenes_combos.map((row,key)=>{          
              const rowspan = row.fracciones.filter(row=>parseInt(row.cantidad) > 0).length
              row.fracciones = Object.keys(tallas).reduce((c,v)=>{
                if(row.fracciones.map(row=>row.talla).includes(v)){
                  c.push({...row.fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                }
                return c
              },[])
              let filas = row.fracciones.filter(row=>parseInt(row.cantidad) > 0).map((row2,key2)=>{
                console.log("Producto rowspan:",info.ordenes_combos.length,row.fracciones.length)
                return `
                  <tr>
                    ${key2 == 0 && key == 0 
                      ? `
                        <td rowspan="${info.ordenes_combos.length*row.fracciones.filter(row=>parseInt(row.cantidad)>0).length}" style="padding:-1px">
                          <div style="display:flex;flex-direction:column;height:100%;margin:-2px;">
                            <div style="flex:1;backgroun">
                              <div style="height: 100%;background: gray;overflow: hidden;display: flex; justify-content: center;">
                                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQEedjjRZmK22NHyPgV8boGdiMPyE8VIC7VUw&s" style="width:100%;"/>
                              </div>
                            </div>
                            <div style="flex:1;">
                              <table border="1" style="border-collapse:collapse;width:100%;height:100%;text-align:center;">
                                <tr><td colspan="2" style="background-color:orange;">${info.cliente}</td></tr>
                                <tr><td>MARCA</td><td>${info.marca}</td></tr>
                                <tr><td>MODELO</td><td>${info.modelos}</td></tr>
                                <tr><td>BASE</td><td>${info.base}</td></tr>
                                <tr><td>PROVEEDOR</td><td>${info.proveedor}</td></tr>
                                <tr><td>TELA</td><td>OP/${('00000000' + info.orden_ref).substring(5)}</td></tr>
                                <tr><td>CURVA</td><td>${info.curva ?? 'curva'}</td></tr>
                                <tr><td>TALLAS</td><td>${info.ordenes_combos[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).join(" - ")}</td></tr>
                                <tr><td>CANTIDAD</td><td>${info.ordenes_combos.reduce((c,v)=>c+parseInt(v.cantidad_combo),0)}</td></tr>
                              </table>
                            </div>
                          </div>
                        </td>
                      ` 
                      : ''} 
                    ${key2 == 0 
                      ? `
                        <td rowspan='${rowspan}'>
                          <div style="display:flex;flex-direction:column;height:100%;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row.color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row.cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    <td style="text-align:center;">${row2.talla}</td>
                    <td style="text-align:center;">${row2.cantidad}</td>
                    ${
                      key2 == 0 ? materiales.map(row=>"<td rowspan='" + rowspan +"'></td>").join("\n") : ""
                    }
                  </tr>
                `
              })              
              return filas.join("\n")
            }).join('\n')
   
            return `
              <table border="1" style="border-collapse:collapse;width:100%;height:100vh">
                <tr style="background-color:#b5e1ff;height:40px;">
                  <th style="min-width:200px;">FOTO DE PRENDA</th>
                  <th style="min-width:120px;">COLOR</th>
                  <th style="">TALLA</th>
                  <th style="">CANTIDAD</th>
                  ${
                    materiales.length > 0 
                    ? materiales.map(row=>"<th style='width:25%;'>"+ row +"</th>").join("\n")
                    : ["","",""].map(row=>"<th style='width:25%;'>"+ row +"</th>").join("\n")
                  }
                </tr>
                ${middle}
                <tr>
                  <td style="text-align:center;height:30px;" colspan="7">NOTA.- LIQUIDAR ROLLO COMPLETO</td>
                </tr>
                <tr>
                  <td style="text-align:center;background-color:yellow;font-size:10px;height:20px;" colspan="7">LA CALIDAD ES RESPONSABILIDAD DE TODOS</td>
                </tr>
              </table>
            `
            // return '<div>Hola mundo</div>'
          },
        }
      }
    );


    // ,
    //   async (err, html) => {
    //     try {
    //       const browser = await puppeteer.launch();

    //       const version = await browser.version();
    //       console.log(`Versión de Chrome: ${version}`);
    //       const page = await browser.newPage();
    //       await page.setContent(html);

    //       const pdfOptions = {
    //         landscape: true,
    //         printBackground: true,
    //         margin: {
    //           left: 0,
    //           right: 0
    //         }
    //         , scale: 1
    //       };

    //       const pdfBuffer = await page.pdf(pdfOptions);
    //       await browser.close();
    //       // res.send({ data: pdfBuffer.toString('base64') })
    //       console.log("aBuffer:",pdfBuffer)
    //       reply.send(pdfBuffer)
    //       // reply.send(pdfBuffer)
    //     } catch (error) {
    //       reply.status(500).send('Error al generar el PDF');
    //       // await browser.close();
    //     } finally {
    //       // await browser.close();
    //     }
    //   }

  }
  static async printHojaCorte_(req, reply) {
    let mirender = undefined
    const htmlDePlantilla1 = await new Promise((resolve, reject) => {
        req.app.render('test', { data: 'datos1' }, (err, html) => {
            if (err) return reject(err);
            resolve(html);
        });
    })
    console.log("Exito plantilla generada:",htmlDePlantilla1)
    // console.log(mirender)}
  }
  static async printHojaCorte_back18082025(req, reply) {
    const params = req.params
    // const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    // console.log("La info de la orde es:",data[0].ordenes_combos,data[0].ordenes_combos[0].fracciones)
    const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    console.log("Info cabecera:",data)
    reply.render(
      'hojacorte_A',
      {
        nrocorte: data[0].oc.substr(4,5),
        ruta: eval(data[0].ruta_proceso).join(" - "),
        cabecera: data[0],
        helpers: {
          comercial: function(fechacomercial){
            const partes = fechacomercial.split('-'); 

            // Los meses en JavaScript se indexan desde 0 (enero = 0, agosto = 7)
            // Por eso, restamos 1 al mes.
            const year = parseInt(partes[0]);
            const month = parseInt(partes[1]) - 1; 
            const day = parseInt(partes[2]);

            // 2. Crear un objeto Date con los componentes en la zona horaria local
            // De esta forma, JavaScript no aplica ninguna conversión de zona horaria.
            const fecha = new Date(year, month, day);

            // 2. Definir las opciones de formato para el idioma español (es-ES)
            const opciones = {
              weekday: 'long',  // Nombre completo del día de la semana (e.g., "lunes")
              year: 'numeric',   // El año en 4 dígitos (e.g., "2025")
              month: 'long',     // Nombre completo del mes (e.g., "Agosto")
              day: 'numeric'     // El día del mes (e.g., "12")
            };

            // 3. Crear un objeto Intl.DateTimeFormat y usar el método format()
            const formatoLargo = new Intl.DateTimeFormat('es-MX', opciones).format(fecha);

            // 4. Convertir la primera letra a mayúscula (opcional, pero mejora la presentación)
            const resultado = formatoLargo.charAt(0).toUpperCase() + formatoLargo.slice(1);
            return resultado
          },
          relleno: function(){
            
            let row = []
            for(let j=0; j<=18; j++){
              let td = []
              for(let i=0; i<14; i++){
                td.push(`<td ${i==0 ? "style='background-color:#b5e1ff;'" : ""}></td>`)
              }
              row.push('<tr>'+td.join("")+'</tr>')
            }
            // console.log("Lista td:" + row.join(""))
            return row.join("")
          },
          relleno2: function(){
            
            let row = []
            for(let j=0; j<=31; j++){
              let td = []
              for(let i=0; i<14; i++){
                td.push(`<td ${i==0 ? "style='background-color:#b5e1ff;'" : ""}></td>`)
              }
              row.push('<tr>'+td.join("")+'</tr>')
            }
            // console.log("Lista td:" + row.join(""))
            return row.join("")
          },
          plusindex(index) {
            return index + 1
          },
          relleno3: function(info){
            console.log("La infomarca de la cabecera es:",info)
            const tallas = {'10':'10','12':'12','14':'14','16':'16','xs':'XS/26','s':'S/28','m':'M/30','l':'L/32','xl':'XL/34','xxl':'XXL/36'}
            const materiales = eval(info.materiales_produccion) ?? ['','','']
            const combos = JSON.parse(JSON.stringify(info.ordenes_combos))
            const relleno = {
              fracciones:[],
              color_combo:'',
              id_orden_CAB:0,
              cantidad_combo:0
            }
            let consolidado = []

            if(combos.length > 6){
              let limit = combos.length - parseInt(combos.length / 2)
              for(let x = 0; x < limit; x++){
                consolidado.push([combos.shift() ?? {},combos.shift() ?? relleno])
              }
            }else{
              consolidado = combos.map(row=>[row])
            }

            let middle = consolidado.map((row,key)=>{      
              let rowspan1 = 0, rowspan2 = 0 

              if(consolidado[0].length > 1){
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
                rowspan2 = row[1].fracciones.length > 0 ? row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[1].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[1].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
              }else{
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
              }
              let lista = Array.from({length:[rowspan1,rowspan2].sort((a,b)=> b - a)[0]})
              console.log("La lista es la siguiente:",lista)

              // let filas = row.fracciones.filter(row=>parseInt(row.cantidad) > 0).map((row2,key2)=>{
              let filas = lista.map((row2,key2)=>{
                // console.log("Producto rowspan:",consolidado.length,row.fracciones.length)
                return `
                  <tr style="height:20px;">
                    ${key2 == 0 && key == 0 
                      ? `
                        <td rowspan="${consolidado.length*lista.length}" style="padding:-1px">
                          <div style="display:flex;flex-direction:column;height:100%;margin:-2px;">
                            <div style="flex:1;position:relative;">
                              <div style="height:200px;display: absolute; justify-content: center;padding:10px;background-color:#dddddd;background-image: url('https://jsjfact.com/facturador/imagenez/op_${params.idorden}.jpg');background-position: center;background-size: cover;background-origin: content-box;background-clip: content-box;width:180px;">
                                <div style="display:absolute;width:180px;height:380px;overflow:hidden;position:relative;">
                                  <img src='https://jsjfact.com/facturador/imagenez/op_${params.idorden}.jpg' style="margin-left:-70px;" width='320'/>
                                </div>
                                
                              </div>
                            </div>
                            <div style="height:40%;">
                              <table border="1" style="border-collapse:collapse;width:100%;height:100%;text-align:center;">
                                <tr><td colspan="2" style="background-color:orange;">${info.cliente}</td></tr>
                                <tr><td>MARCA</td><td>${info.marca}</td></tr>
                                <tr><td>MODELO</td><td>${info.modelos}</td></tr>
                                <tr><td>BASE</td><td>${info.base}</td></tr>
                                <tr><td>PROVEEDOR</td><td>${info.proveedor}</td></tr>
                                <tr><td>TELA</td><td>OP/${('00000000' + info.orden_ref).substring(5)}</td></tr>
                                <tr><td>CURVA</td><td>${info.curva ?? 'curva'}</td></tr>
                                <tr><td>TALLAS</td><td style="font-size:10px;">${row[0].fracciones.map(item=>item.talla).join("-")}</td></tr>
                                <tr><td>CANTIDAD</td><td>${info.ordenes_combos.reduce((c,v)=>c+v.cantidad_combo,0)}</td></tr>
                              </table>
                            </div>
                          </div>
                        </td>
                      ` 
                      : ''
                    } 
                    
                    ${key2 == 0 
                      ? `
                        <td rowspan='${rowspan1 ? rowspan1 : lista.length}'>
                          <div style="display:flex;flex-direction:column;height:100%;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[0].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[0].cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    <td style="text-align:center;background-color:#b5e1ff;">${row[0].fracciones[key2].talla}</td>
                    <td style="text-align:center;background-color:#dddddd;">${row[0].fracciones[key2].cantidad}</td>
                    ${
                      key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan1 ? rowspan1 : lista.length) +"'></td>").join("\n") : ""
                    }
                    ${consolidado[0].length > 1 && key2 == 0 
                      ? `
                        <td rowspan='${rowspan2 ? rowspan2 : lista.length}'>
                          <div style="display:flex;flex-direction:column;height:100%;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[1].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[1].cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    ${
                      consolidado[0].length > 1 
                      ? `
                        <td style="text-align:center;background-color:#b5e1ff;">${row[1].fracciones.length > 0 ? row[1].fracciones[key2].talla : ''}</td>
                        <td style="text-align:center;background-color:#dddddd;">${row[1].fracciones.length > 0 ? row[1].fracciones[key2].cantidad : ''}</td>
                      `
                      : ''
                    }
                    
                    ${
                      consolidado[0].length > 1 && key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan2 ? rowspan2 : lista.length) +"'></td>").join("\n") : ""
                    }
                  </tr>
                `
              })              
              return filas.join("\n")
            }).join('\n')
   
            return `
              <table id="sugerido">
                <tr style="background-color:#b5e1ff;height:10px;">
                  <th style="min-width:200px;">FOTO DE PRENDA</th>
                  <th style="min-width:120px;">COLOR</th>
                  <th style="">TALLA</th>
                  <th style="">UND</th>
                  ${
                    materiales.length > 0 
                    ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                    : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                  }
                  ${
                    consolidado[0].length > 1
                    ? `
                      <th style="min-width:120px;">COLOR</th>
                      <th style="">TALLA</th>
                      <th style="">UND</th>
                      ${
                        materiales.length > 0 
                        ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                        : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                      }
                    `
                    : ''
                  }
                </tr>
                ${middle}
                <tr style="text-align:center;height:5px;">
                  <td style="text-align:center;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">NOTA.- LIQUIDAR ROLLO COMPLETO</td>
                </tr>
                <tr style="text-align:center;height:5px;">
                  <td style="text-align:center;background-color:yellow;font-size:8px;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">LA CALIDAD ES RESPONSABILIDAD DE TODOS</td>
                </tr>
              </table>
            `
          },
        }
      }
      , 
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfOptions = {
            width: '22cm',
            height: '29.7cm',
            landscape: true,
            printBackground: true,
            margin: {
              left: 10,
              right: 10,
              top: 20,
              bottom: 20
            }
            , scale: 1
          };
          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          reply.send({ data: pdfBuffer.toString('base64') })
          // reply.send(pdfBuffer)
          // reply.send(html)
        } catch (error) {
          reply.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
  }
  static async printHojaCorte(req, reply) {
    const params = req.params
    // const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    // console.log("La info de la orde es:",data[0].ordenes_combos,data[0].ordenes_combos[0].fracciones)
    const data = await OrdenesModel.getInfoPrintSugerido(params.idorden)
    console.log("Info cabecera:",data)
    try {
      
    
    reply.render(
      'hojacorte_A',
      {
        // nrocorte: data[0].oc.substr(4,5),
        nrocorte: data[0].oc,
        ruta: eval(data[0].ruta_proceso).join(" - "),
        cabecera: data[0],
        helpers: {
          comercial: function(fechacomercial){
            const partes = fechacomercial.split('-'); 

            // Los meses en JavaScript se indexan desde 0 (enero = 0, agosto = 7)
            // Por eso, restamos 1 al mes.
            const year = parseInt(partes[0]);
            const month = parseInt(partes[1]) - 1; 
            const day = parseInt(partes[2]);

            // 2. Crear un objeto Date con los componentes en la zona horaria local
            // De esta forma, JavaScript no aplica ninguna conversión de zona horaria.
            const fecha = new Date(year, month, day);

            // 2. Definir las opciones de formato para el idioma español (es-ES)
            const opciones = {
              weekday: 'long',  // Nombre completo del día de la semana (e.g., "lunes")
              year: 'numeric',   // El año en 4 dígitos (e.g., "2025")
              month: 'long',     // Nombre completo del mes (e.g., "Agosto")
              day: 'numeric'     // El día del mes (e.g., "12")
            };

            // 3. Crear un objeto Intl.DateTimeFormat y usar el método format()
            const formatoLargo = new Intl.DateTimeFormat('es-MX', opciones).format(fecha);

            // 4. Convertir la primera letra a mayúscula (opcional, pero mejora la presentación)
            const resultado = formatoLargo.charAt(0).toUpperCase() + formatoLargo.slice(1);
            return resultado
          },
          relleno: function(){
            
            let row = []
            for(let j=0; j<=18; j++){
              let td = []
              for(let i=0; i<14; i++){
                td.push(`<td ${i==0 ? "style='background-color:#b5e1ff;'" : ""}></td>`)
              }
              row.push('<tr>'+td.join("")+'</tr>')
            }
            // console.log("Lista td:" + row.join(""))
            return row.join("")
          },
          relleno2: function(){
            
            let row = []
            for(let j=0; j<=31; j++){
              let td = []
              for(let i=0; i<14; i++){
                td.push(`<td ${i==0 ? "style='background-color:#b5e1ff;'" : ""}></td>`)
              }
              row.push('<tr>'+td.join("")+'</tr>')
            }
            // console.log("Lista td:" + row.join(""))
            return row.join("")
          },
          plusindex(index) {
            return index + 1
          },
          relleno3: function(info){
            console.log("La infomarca de la cabecera es:",info)
            const tallas = {'10':'10','12':'12','14':'14','16':'16','xs':'XS/26','s':'S/28','m':'M/30','l':'L/32','xl':'XL/34','xxl':'XXL/36'}
            const materiales = eval(info.materiales_produccion) ?? ['','','']
            const combos = JSON.parse(JSON.stringify(info.ordenes_combos))
            const relleno = {
              fracciones:[],
              color_combo:'',
              id_orden_CAB:0,
              cantidad_combo:0
            }
            let consolidado = []

            if(combos.length > 6){
              let limit = combos.length - parseInt(combos.length / 2)
              for(let x = 0; x < limit; x++){
                consolidado.push([combos.shift() ?? {},combos.shift() ?? relleno])
              }
            }else{
              consolidado = combos.map(row=>[row])
            }
            console.log("Continua el proceso!!")
            let middle = consolidado.map((row,key)=>{
              console.log("La infor de row ess :",row)
              let rowspan1 = 0, rowspan2 = 0 

              if(consolidado[0].length > 1){
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
                rowspan2 = row[1].fracciones.length > 0 ? row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[1].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[1].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
              }else{
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
              }
              let rowspan_max = [rowspan1,rowspan2].sort((a,b)=> b - a)[0]
              let lista = Array.from({length:[rowspan1,rowspan2].sort((a,b)=> b - a)[0]})
              console.log("La lista es la siguiente:",lista)
              // let filas = ['a','b','c']
              let filas = lista.map((row2,key2)=>{
                // console.log("INfor colores 2:",row[1].fracciones)
                return `
                  <tr style="height:20px;">
                    ${key2 == 0 && key == 0 
                      ? `
                        <td rowspan="${consolidado.length*lista.length}" style="padding:-1px;position:relative;">
                          <div style="display:flex;flex-direction:column;position:absolute;left:0px;top:0px;bottom:0px;margin:-1px;">

                            <div style="flex:1;position:relative;">
                              <div style="height:200px;display: absolute; justify-content: center;padding:10px;width:180px;">
                                <div style="display:absolute;width:180px;height:380px;overflow:hidden;position:relative;">
                                  <img src='https://jsjfact.com/facturador/imagenez/op_${params.idorden}.jpg' style="margin-left:-70px;" width='320'/>
                                </div>
                                
                              </div>
                            </div>
                            <div style="height:40%;">
                              <table border="1" style="border-collapse:collapse;width:100%;height:100%;text-align:center;">
                                <tr><td colspan="2" style="background-color:orange;">${info.cliente}</td></tr>
                                <tr><td>MARCA</td><td>${info.marca}</td></tr>
                                <tr><td>MODELO</td><td>${info.modelos}</td></tr>
                                <tr><td>BASE</td><td>${info.base}</td></tr>
                                <tr><td>PROVEEDOR</td><td>${info.proveedor}</td></tr>
                                <tr><td>TELA</td><td>OP/${('00000000' + info.orden_ref).substring(5)}</td></tr>
                                <tr><td>CURVA</td><td>${info.curva ?? 'curva'}</td></tr>
                                <tr><td>TALLAS</td><td style="font-size:10px;">${row[0].fracciones.map(item=>item.talla).join("-")}</td></tr>
                                <tr><td>CANTIDAD</td><td>${info.ordenes_combos.reduce((c,v)=>c+v.cantidad_combo,0)}</td></tr>
                              </table>
                            </div>

                          </div>
                        </td>
                      ` 
                      : ''
                    } 
                    
                    ${key2 == 0 
                      ? `
                        <td rowspan='${rowspan1 ? rowspan1 : lista.length}' style="position:relative;min-width:80px;">
                          <div style="display:flex;flex-direction:column;position:absolute;top:1px;bottom:1px;left:1px;right:1px;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[0].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[0].cantidad_combo}
                            </div>
                          </div>
                        </td>
                        ` 
                      : ``
                    }
                    <td style="text-align:center;background-color:#b5e1ff;">${row[0].fracciones[key2].talla}</td>
                    <td style="text-align:center;background-color:#dddddd;">${row[0].fracciones[key2].cantidad}</td>
                    ${
                      key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan1 ? rowspan1 : lista.length) +"'></td>").join("\n") : ""
                    }
                    ${consolidado[0].length > 1 && key2 == 0 
                      ? `
                        <td rowspan='${rowspan_max ? rowspan_max : lista.length}' style="position:relative;min-width:80px;">
                          <div style="display:flex;flex-direction:column;background-color:#b5e1ff;position:absolute;top:1px;bottom:0px;left:0px;right:0px;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[1].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[1].cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    ${
                      consolidado[0].length > 1 
                      ? `
                        <td style="text-align:center;background-color:#b5e1ff;">${row[1].fracciones.length > 0 ? (row[1].fracciones[key2]?.talla ?? '') : ''}</td>
                        <td style="text-align:center;background-color:#dddddd;">${row[1].fracciones.length > 0 ? (row[1].fracciones[key2]?.cantidad ?? '') : ''}</td>
                      `
                      : ''
                    }
                    
                    ${
                      consolidado[0].length > 1 && key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan_max ? rowspan_max : lista.length) +"'></td>").join("\n") : ""
                    }
                  </tr>
                `
              })              
              return filas.join("\n")
            }).join('\n')
   
            return `
              <table id="sugerido">
                <thead style="height:80px;">
                  <tr style="background-color:#b5e1ff;">
                    <th style="min-width:200px;">FOTO DE PRENDA</th>
                    <th style="min-width:85px;">COLOR</th>
                    <th style="">TALLA</th>
                    <th style="">UND</th>
                    ${
                      materiales.length > 0 
                      ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                      : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                    }
                    ${
                      consolidado[0].length > 1
                      ? `
                        <th style="min-width:80px;">COLOR</th>
                        <th style="">TALLA</th>
                        <th style="">UND</th>
                        ${
                          materiales.length > 0 
                          ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                          : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                        }
                      `
                      : ''
                    }
                  </tr>
                </thead>
                <tbody style="height:18cm;">
                  ${middle}
                </tbody>
                <tfoot>
                  <tr style="text-align:center;height:5px;">
                    <td style="text-align:center;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">NOTA.- LIQUIDAR ROLLO COMPLETO</td>
                  </tr>
                  <tr style="text-align:center;height:5px;">
                    <td style="text-align:center;background-color:yellow;font-size:8px;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">LA CALIDAD ES RESPONSABILIDAD DE TODOS</td>
                  </tr>
                </tfoot>
              </table>
            `
          },
        }
      }
      , 
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfOptions = {
            width: '22cm',
            height: '29.7cm',
            landscape: true,
            printBackground: true,
            margin: {
              left: 10,
              right: 10,
              top: 20,
              bottom: 20
            }
            , scale: 1
          };
          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          reply.send({ data: pdfBuffer.toString('base64') })
          // reply.send(pdfBuffer)
          // reply.send(html)
        } catch (error) {
          console.log(error)
          reply.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
    )
    } catch (error) {
      console.log(error) 
    }
  }
  static async printSugeridoV3(req, reply) {
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
            console.log("La infomarca de la cabecera es:",info)
            const tallas = {'10':'10','12':'12','14':'14','16':'16','xs':'XS/26','s':'S/28','m':'M/30','l':'L/32','xl':'XL/34','xxl':'XXL/36'}
            const materiales = eval(info.materiales_produccion) ?? ['','','']
			// const materiales = eval(pp) && eval(pp).length > 0 ? eval(pp) : ['','','']
            const combos = JSON.parse(JSON.stringify(info.ordenes_combos))
            const relleno = {
              fracciones:[],
              color_combo:'',
              id_orden_CAB:0,
              cantidad_combo:0
            }
            let consolidado = []

            if(combos.length > 6){
              let limit = combos.length - parseInt(combos.length / 2)
              for(let x = 0; x < limit; x++){
                consolidado.push([combos.shift() ?? {},combos.shift() ?? relleno])
              }
            }else{
              consolidado = combos.map(row=>[row])
            }
            console.log("Los combos arreglados son:",consolidado)

            let middle = consolidado.map((row,key)=>{      
              // console.log("Info del afraccionesn",row[0].fracciones,row[1].fracciones)   
              let rowspan1 = 0, rowspan2 = 0 

              if(consolidado[0].length > 1){
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
                rowspan2 = row[1].fracciones.length > 0 ? row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[1].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[1].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
              }else{
                rowspan1 = row[0].fracciones.length > 0 ? row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                row[0].fracciones = Object.keys(tallas).reduce((c,v)=>{
                  if(row[0].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                    c.push({...row[0].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                  }
                  return c
                },[])
                // rowspan2 = row[1].fracciones.length > 0 ? row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).length : 0
                // row[1].fracciones = Object.keys(tallas).reduce((c,v)=>{
                //   if(row[1].fracciones.filter(row=>parseInt(row.cantidad) > 0).map(row=>row.talla).includes(v)){
                //     c.push({...row[1].fracciones.filter(row=>row.talla == v)[0],talla:tallas[v]})
                //   }
                //   return c
                // },[])
              }
              let lista = Array.from({length:[rowspan1,rowspan2].sort((a,b)=> b - a)[0]})
              console.log("La lista es la siguiente:",lista)

              // let filas = row.fracciones.filter(row=>parseInt(row.cantidad) > 0).map((row2,key2)=>{
              let filas = lista.map((row2,key2)=>{
                // console.log("Producto rowspan:",consolidado.length,row.fracciones.length)
                return `
                  <tr style="height:20px;">
                    ${key2 == 0 && key == 0 
                      ? `
                        <td rowspan="${consolidado.length*lista.length}" style="padding:-1px">
                          <div style="display:flex;flex-direction:column;height:100%;margin:-2px;">
                            <div style="flex:1;position:relative;">
                              <div style="height:200px;display: absolute; justify-content: center;padding:10px;background-color:#dddddd;background-image: url('https://jsjfact.com/facturador/imagenez/op_${params.idorden}.jpg');background-position: center;background-size: cover;background-origin: content-box;background-clip: content-box;width:180px;">
                                <div style="display:absolute;width:180px;height:380px;overflow:hidden;position:relative;">
                                  <img src='https://jsjfact.com/facturador/imagenez/op_${params.idorden}.jpg' style="margin-left:-70px;" width='320'/>
                                </div>
                                
                              </div>
                            </div>
                            <div style="height:40%;">
                              <table border="1" style="border-collapse:collapse;width:100%;height:100%;text-align:center;">
                                <tr><td colspan="2" style="background-color:orange;">${info.cliente}</td></tr>
                                <tr><td>MARCA</td><td>${info.marca}</td></tr>
                                <tr><td>MODELO</td><td>${info.modelos}</td></tr>
                                <tr><td>BASE</td><td>${info.base}</td></tr>
                                <tr><td>PROVEEDOR</td><td>${info.proveedor}</td></tr>
                                <tr><td>TELA</td><td>OP/${('00000000' + info.orden_ref).substring(5)}</td></tr>
                                <tr><td>CURVA</td><td>${info.curva ?? 'curva'}</td></tr>
                                <tr><td>TALLAS</td><td style="font-size:10px;">${row[0].fracciones.map(item=>item.talla).join("-")}</td></tr>
                                <tr><td>CANTIDAD</td><td>${info.ordenes_combos.reduce((c,v)=>c+v.cantidad_combo,0)}</td></tr>
                              </table>
                            </div>
                          </div>
                        </td>
                      ` 
                      : ''
                    } 
                    
                    ${key2 == 0 
                      ? `
                        <td rowspan='${rowspan1 ? rowspan1 : lista.length}'>
                          <div style="display:flex;flex-direction:column;height:100%;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[0].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[0].cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    <td style="text-align:center;background-color:#b5e1ff;">${row[0].fracciones[key2].talla}</td>
                    <td style="text-align:center;background-color:#dddddd;">${row[0].fracciones[key2].cantidad}</td>
                    ${
                      key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan1 ? rowspan1 : lista.length) +"'></td>").join("\n") : ""
                    }
                    ${consolidado[0].length > 1 && key2 == 0 
                      ? `
                        <td rowspan='${rowspan2 ? rowspan2 : lista.length}'>
                          <div style="display:flex;flex-direction:column;height:100%;background-color:#b5e1ff;">
                            <div style="flex:1;display:flex;justify-content:center;align-items:center;text-align:center;">
                              ${row[1].color_combo}
                            </div>
                            <div style="height:20%;background-color:yellow;display:flex;justify-content:center;align-items:center;">
                              ${row[1].cantidad_combo}
                            </div>
                          </div>
                          
                        </td>` 
                      : ""
                    }
                    ${
                      consolidado[0].length > 1 
                      ? `
                        <td style="text-align:center;background-color:#b5e1ff;">${row[1].fracciones.length > 0 ? row[1].fracciones[key2].talla : ''}</td>
                        <td style="text-align:center;background-color:#dddddd;">${row[1].fracciones.length > 0 ? row[1].fracciones[key2].cantidad : ''}</td>
                      `
                      : ''
                    }
                    
                    ${
                      consolidado[0].length > 1 && key2 == 0 ? materiales.map(row=>"<td rowspan='" + (rowspan2 ? rowspan2 : lista.length) +"'></td>").join("\n") : ""
                    }
                  </tr>
                `
              })              
              return filas.join("\n")
            }).join('\n')
   
            return `
              <table>
                <tr style="background-color:#b5e1ff;height:10px;">
                  <th style="min-width:200px;">FOTO DE PRENDA</th>
                  <th style="min-width:120px;">COLOR</th>
                  <th style="">TALLA</th>
                  <th style="">UND</th>
                  ${
                    materiales.length > 0 
                    ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                    : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                  }
                  ${
                    consolidado[0].length > 1
                    ? `
                      <th style="min-width:120px;">COLOR</th>
                      <th style="">TALLA</th>
                      <th style="">UND</th>
                      ${
                        materiales.length > 0 
                        ? materiales.map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                        : ["","",""].map(row=>"<th style='width:calc(25% / " + consolidado[0].length + ");'>"+ row +"</th>").join("\n")
                      }
                    `
                    : ''
                  }
                </tr>
                ${middle}
                <tr style="text-align:center;height:5px;">
                  <td style="text-align:center;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">NOTA.- LIQUIDAR ROLLO COMPLETO</td>
                </tr>
                <tr style="text-align:center;height:5px;">
                  <td style="text-align:center;background-color:yellow;font-size:8px;" colspan="${3*consolidado[0].length + materiales.length*consolidado[0].length + 1}">LA CALIDAD ES RESPONSABILIDAD DE TODOS</td>
                </tr>
              </table>
            `
            // return '<div>Hola mundo</div>'
          },
        }
      }
      ,
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();

          const version = await browser.version();
          console.log(`Versión de Chrome: ${version}`);
          const page = await browser.newPage();
          await page.setContent(html);

          const pdfOptions = {
            width: '22cm',
            height: '29.7cm',
            landscape: true,
            printBackground: true,
            margin: {
              left: 10,
              right: 10,
              top: 20,
              bottom: 20
            }
            , scale: 1
          };

          const pdfBuffer = await page.pdf(pdfOptions);
          await browser.close();
          reply.send({ data: pdfBuffer.toString('base64') })
          // console.log("aBuffer:",pdfBuffer)
          // reply.send(pdfBuffer)
          // reply.send(pdfBuffer)
        } catch (error) {
          reply.status(500).send('Error al generar el PDF');
          // await browser.close();
        } finally {
          // await browser.close();
        }
      }
      
    );
  }
  static async getCorrelativoProduccionPreview(req,res){
    const tipo = req.params.tipo
    let resp = await OrdenesModel.getCorrelativoProduccionPreview(tipo)
    res.json(resp)
  }
}
