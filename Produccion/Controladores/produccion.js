import { ProduccionModel } from "../Servicios/produccion.js";
import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import puppeteer from 'puppeteer';
import { OrdenesModel } from "../../Ordenes/Servicios/ordenes.js";


// ── Utils ─────────────────────────────────────────
function safeDate(value) {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d.toLocaleDateString('en-GB')
}

function calcDiasProduccion(fechaEmision, fechaEntrega) {
  if (!fechaEmision || !fechaEntrega) return null

  // Parsear DD/MM/YYYY
  const [d1, m1, y1] = fechaEmision.split('/')
  const [d2, m2, y2] = fechaEntrega.split('/')

  const inicio = new Date(`${y1}-${m1}-${d1}`)
  const fin = new Date(`${y2}-${m2}-${d2}`)

  const diff = Math.round((fin - inicio) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : null
}

// ─────────────────────────────────────────────────

export class ProduccionController {
  static async getOrdenes(req, reply) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getOrdenes(search)
    reply.json(data)
  }

  static async exportInfoEstampado(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    console.log("Info cabecera:", data2)
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
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfOptions = {
            format: 'A4',
            landscape: false,
            printBackground: true
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
    console.log("Iniciando la exportacion de la guia")
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)

    console.log(data)

    const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data3 = data[0].id_proveedor_CAB
      ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
      : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]
    const data4 = await ProduccionModel.getPlantillasTallasByOrden(data[0].id_orden_CAB ?? '0')

    // console.log("fec_retorno_guia RAW:", JSON.stringify(data[0].fec_retorno_guia))
    // console.log("tipo:", data[0].tipo)
    // console.log("safeDate result:", safeDate(data[0].fec_retorno_guia))


    resp.render(
      data[0].tipo == 'SERVICIOS' ? 'guia_back' : 'guia_muestras_v2',
      {
        condicion: parseInt(params.modo),
        color: data[0].servicio == 'ACABADOS' ? 'red' : 'black',
        info: params,
        cabecera: data[0],
        detalle: data2.filter(row => !row.isprototipo),
        tallas: data4[0]?.tallas.map(row => row.desc) ?? ['st', 'xs', 's', 'm', 'l', 'xl', 'xxl'],
        colspanbody: data4[0]?.tallas?.length + 2 ?? 2,
        colspantotales: data4[0]?.tallas.length + 2,
        igv: parseInt(data[0].igv ?? 0) ? 'No Aplica' : 'Aplica',
        condicion: ['', 'Pago contra entrega', 'Pago programado', 'Pago semanal', 'Pago con adelanto + prog.'][data[0].condicion_pago],
        valor_igv: (data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0) * data[0].costo * (parseInt(data[0].igv ?? 0) ? 0 : 0.18)).toFixed(2),
        importetotal: (data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0) * data[0].costo * (parseInt(data[0].igv ?? 0) ? 1 : 1.18)).toFixed(2),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0),
        totalimporte: (data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0) * data[0].costo).toFixed(2),
        proveedor: data3[0],
        puntoPartida: 'CAL FELIPE SANTIAGO CRESPO NRO. 581 LIMA-SAN LUIS LIMA',

        // ── variables del layout ──────────────────────
        documentTitle: data[0].tipo == 'SERVICIOS' ? 'ORDEN DE SERVICIO' : 'GUÍA DE INGRESO',
        documentNumberLabel: 'N° Guía',
        documentNumber: `${data[0].idx}`.padStart(10, '0'),
        documentDate: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        documentDeliveryDate: data[0].tipo == 'SERVICIOS'
          ? safeDate(data[0].fec_retorno_guia)
          : null,

        documentDiasProduccion: calcDiasProduccion(
          (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
          safeDate(data[0].fec_retorno_guia)
        ),

        firmas: data[0].tipo == 'SERVICIOS'
          ? ['Elaborado por:', 'Recibí conforme']
          // ? ['Entregué conforme', 'Lleve conforme', 'Recibí conforme']
          : ['Asistente almacén', 'Control de ingreso'],
        emisor: req.session.username ?? '',
        // ─────────────────────────────────────────────


        helpers: {
          plusindex(index) { return index + 1 },
          header(tallas) {
            return tallas.map(t => `<th style="text-align:center;">${t.toUpperCase()}</th>`).join("")
          },
          cuerpo(detalle, tallas) {
            let cuerpo = []
            detalle.forEach((row, key) => {
              const infotallas = tallas.map(talla => `<td style="text-align:center;">${row[talla] ?? 0}</td>`)
              cuerpo.push(`
                <tr>
                  <td style="text-align:center;width:.5cm;">${key + 1}</td>
                  <td>${row.articulo}</td>
                  ${infotallas.join("")}
                  <td style="text-align:center;">NIU</td>
                  <td style="text-align:center;">${row.cantidad}</td>
                  <td style="text-align:center;">${data[0].costo}</td>
                  <td style="text-align:center;">${row.cantidad * data[0].costo}</td>
                </tr>
              `)
            })
            Array(3).fill(0).forEach(() => {
              cuerpo.push(`
                <tr>
                  <td></td><td></td>
                  ${tallas.map(() => '<td style="text-align:center;">-</td>').join("")}
                  <td>-</td><td>-</td><td>-</td><td>-</td>
                </tr>
              `)
            })
            return cuerpo.join("")
          }
        }
      },
      async (err, html) => {
        try {
          if (params.modo == 1) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf({
              width: '20cm', height: '27.94cm',
              landscape: false, printBackground: true,
              margin: { left: 0, right: 0 }
            });
            await browser.close();
            resp.send({ data: pdfBuffer.toString('base64') })
          } else {
            resp.send(html)
          }
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }

  static async exportInfoGuiaV2(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const data2 = await ProduccionModel.getInfoGuiaDet(params.id)
    const data3 = data[0].id_proveedor_CAB
      ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
      : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

    resp.render(
      data[0].tipo == 'SERVICIOS' ? 'guia_back' : 'guia_muestras_v2',
      {
        condicion: parseInt(params.modo),
        size: '14px',
        color: data[0].servicio == 'ACABADOS' ? 'red' : 'black',
        info: params,
        cabecera: data[0],
        detalle: data2.filter(row => !row.isprototipo),
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0),
        proveedor: data3[0],
        helpers: { plusindex(index) { return index + 1 } }
      },
      async (err, html) => {
        try {
          if (params.modo == 1) {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf({
              width: '20cm', height: '27.94cm',
              landscape: false, printBackground: true,
              margin: { left: 0, right: 0 }
            });
            await browser.close();
            resp.send({ data: pdfBuffer.toString('base64') })
          } else {
            resp.send(html)
          }
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }

  static async verInfoDespachoAcabados(req, resp) {
    const params = req.params
    let data1 = await ProduccionModel.getInfoDespachoEmpaquetadoCab(params.id)
    let data2 = await ProduccionModel.getInfoDespachoEmpaquetadoDet(params.id, data1[0].id_orden_origen)

    try {
      data2 = data2.filter(row => row.fracciones_despacho.length > 0).reduce((c, v) => {
        let lista = ['cantidad', 'caidos', 'incompletos']
        v.fracciones_despacho = ['xs', 's', 'm', 'l', 'xl', 'xxl'].reduce((c3, v3) => {
          c3.push(v.fracciones_despacho.filter(row => row['talla'] == v3)[0])
          return c3
        }, [])
        v.fracciones_despacho_cantidad = v.fracciones_despacho.map(row => row['cantidad'])
        let nuevo = lista.reduce((c2, v2) => {
          let newnames = { cantidad: 'Despacho', caidos: 'Caidos', incompletos: 'Incompletos' }
          c2.push([newnames[v2], ...v.fracciones_despacho.map(row => row[v2]), '-', v.fracciones_despacho.map(row => row[v2]).reduce((c, v) => c + v, 0)])
          return c2
        }, [])
        c.push({ ...v, new_fracciones: nuevo })
        return c
      }, [])

      const data3 = [{ nom: 'HUBER ROMANY TELLO' }]

      resp.render(
        'guia_despacho_acabados',
        {
          color: 'black',
          info: params,
          cabecera: data1[0],
          detalle: data2,
          prototipos: data2.filter(row => row.isprototipo),
          numproto: data2.filter(row => row.isprototipo).length,
          date: (new Date(data1[0].created_at)).toLocaleDateString('en-GB'),
          time: (new Date(data1[0].created_at)).toLocaleTimeString('en-GB'),
          idguia: `${params.id}`.padStart(7, 0),
          totalunid: data2.reduce((c, v) => c + parseFloat(v.cantidad ?? 0), 0),
          totaldespacho: data2.reduce((c, v) => c + parseFloat(v.despacho ?? 0), 0),
          totalcaidos: data2.reduce((c, v) => c + parseFloat(v.caidos ?? 0), 0),
          totalincompletos: data2.reduce((c, v) => c + parseFloat(v.incompletos ?? 0), 0),
          proveedor: data3[0],
          helpers: { plusindex(index) { return index + 1 } }
        },
        async (err, html) => {
          try {
            if (params.condicion == 2) {
              const browser = await puppeteer.launch();
              const page = await browser.newPage();
              await page.setContent(html);
              const pdfBuffer = await page.pdf({
                width: '20cm', height: '27.94cm',
                landscape: true, printBackground: true,
                margin: { left: 0, right: 0 }
              });
              await browser.close();
              resp.send({ data: pdfBuffer.toString('base64') })
            } else {
              resp.send(html)
            }
          } catch (error) {
            resp.status(500).send('Error al generar el PDF');
          }
        }
      );
    } catch (err) {
      resp.status(500).json({ error: err.message });
    }
  }

  static async verInfoDespachoGuia(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    let data1 = await ProduccionModel.getInfoDespachoCab(params.id)
    let data2 = await ProduccionModel.getInfoDespachoDet(params.id)

    try {
      data2 = data2.filter(row => row.fracciones_despacho.length > 0).reduce((c, v) => {
        let lista = ['cantidad', 'caidos', 'incompletos']
        let tallasbase = v.fracciones.map(row => row.talla)
        v.fracciones_despacho = tallasbase.reduce((c3, v3) => {
          v.fracciones_despacho.filter(row => row['talla'] == v3) &&
            c3.push(v.fracciones_despacho.filter(row => row['talla'] == v3)[0])
          return c3
        }, [])
        v.fracciones_despacho_cantidad = v.fracciones_despacho.map(row => row?.['cantidad'] ?? 0)
        let nuevo = lista.reduce((c2, v2) => {
          let newnames = { cantidad: 'Despacho', caidos: 'Caidos', incompletos: 'Incompletos' }
          c2.push([newnames[v2], ...v.fracciones_despacho.map(row => row[v2]), '-',
          v.fracciones_despacho.map(row => row?.[v2] ?? []).reduce((c, v) => c + v, 0)])
          return c2
        }, [])
        c.push({ ...v, new_fracciones: nuevo })
        return c
      }, [])

      const data3 = data[0].id_proveedor_CAB
        ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
        : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

      resp.render(
        'guia_despacho',
        {
          color: 'black',
          info: params,
          cabecera: data[0],
          tallasbase: data2[0].fracciones.map(row => row.talla.toUpperCase()),
          colspantallas: data2[0].fracciones.map(row => row.talla).length + 1,
          detalle: data2,
          prototipos: data2.filter(row => row.isprototipo),
          numproto: data2.filter(row => row.isprototipo).length,
          date: (new Date(data1[0].created_at)).toLocaleDateString('en-GB'),
          time: (new Date(data1[0].created_at)).toLocaleTimeString('en-GB'),
          idguia: `${params.id}`.padStart(7, '0'),
          idref: `${data[0].idx}`.padStart(7, '0'),
          totalunid: data2.reduce((c, v) => c + parseFloat(v.cantidad ?? 0), 0),
          totaldespacho: data2.reduce((c, v) => c + parseFloat(v.despacho ?? 0), 0),
          totalcaidos: data2.reduce((c, v) => c + parseFloat(v.caidos ?? 0), 0),
          totalincompletos: data2.reduce((c, v) => c + parseFloat(v.incompletos ?? 0), 0),
          proveedor: data3[0],

          // ── variables del layout ──────────────────────
          documentTitle: `GUÍA DE INGRESO - ${data[0].tipo}`,
          documentNumberLabel: 'N° Guía',
          documentNumber: `${params.id}`.padStart(7, '0'),
          documentDate: (new Date(data1[0].created_at)).toLocaleDateString('en-GB'),
          firmas: ['Asistente almacén', 'Control de ingreso'],
          emisor: req.session.username ?? '',
          // ─────────────────────────────────────────────

          helpers: { plusindex(index) { return index + 1 } }
        },
        async (err, html) => {
          try {
            if (params.condicion == 2) {
              const browser = await puppeteer.launch();
              const page = await browser.newPage();
              await page.setContent(html);
              const pdfBuffer = await page.pdf({
                width: '20cm', height: '27.94cm',
                landscape: true, printBackground: true,
                margin: { left: 0, right: 0 }
              });
              await browser.close();
              resp.send({ data: pdfBuffer.toString('base64') })
            } else {
              resp.send(html)
            }
          } catch (error) {
            resp.status(500).send('Error al generar el PDF');
          }
        }
      );
    } catch (err) {
      console.log(err)
      resp.status(500).json({ error: err.message });
    }
  }

  static async verInfoDespachoGuiaGLB(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    let data1 = await ProduccionModel.getInfoDespachoCab(params.id)
    let data2 = await ProduccionModel.getInfoDespachoDet(params.id)

    try {
      data2 = data2.reduce((c, v) => {
        let lista = ['cantidad', 'caidos', 'incompletos']
        v.fracciones_despacho = ['xs', 's', 'm', 'l', 'xl', 'xxl'].reduce((c3, v3) => {
          c3.push({ cantidad: 0, caidos: 0, incompletos: 0, talla: v3 })
          return c3
        }, [])
        v.fracciones_despacho_cantidad = (v.despacho ?? 0) + (v.caidos ?? 0) + (v.incompletos ?? 0)
        let nuevo = lista.reduce((c2, v2) => {
          let newnames = { cantidad: 'Despacho', caidos: 'Caidos', incompletos: 'Incompletos' }
          c2.push([newnames[v2], ...v.fracciones_despacho.map(row => row[v2]), '-',
          { cantidad: v.despacho ?? 0, caidos: v.caidos ?? 0, incompletos: v.incompletos ?? 0 }[v2]])
          return c2
        }, [])
        c.push({ ...v, new_fracciones: nuevo })
        return c
      }, [])

      data2 = data2.filter(row => row.fracciones_despacho.length > 0).reduce((c, v) => {
        let lista = ['cantidad', 'caidos', 'incompletos']
        v.fracciones_despacho = ['xs', 's', 'm', 'l', 'xl', 'xxl'].reduce((c3, v3) => {
          c3.push(v.fracciones_despacho.filter(row => row['talla'] == v3)[0])
          return c3
        }, [])
        v.fracciones_despacho_cantidad = v.fracciones_despacho.map(row => row['cantidad'])
        let nuevo = lista.reduce((c2, v2) => {
          let newnames = { cantidad: 'Despacho', caidos: 'Caidos', incompletos: 'Incompletos' }
          c2.push([newnames[v2], ...v.fracciones_despacho.map(row => row[v2]), '-',
          v.fracciones_despacho.map(row => row[v2]).reduce((c, v) => c + v, 0)])
          return c2
        }, [])
        c.push({ ...v, new_fracciones: nuevo })
        return c
      }, [])

      const data3 = data[0].id_proveedor_CAB
        ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
        : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

      resp.render(
        'guia_despacho',
        {
          color: 'black',
          info: params,
          cabecera: data[0],
          detalle: data2,
          prototipos: data2.filter(row => row.isprototipo),
          numproto: data2.filter(row => row.isprototipo).length,
          date: (new Date(data1[0].created_at)).toLocaleDateString('en-GB'),
          time: (new Date(data1[0].created_at)).toLocaleTimeString('en-GB'),
          idguia: `${params.id}`.padStart(10, '0'),
          idref: `${data[0].idx}`.padStart(10, '0'),
          totalunid: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0),
          totaldespacho: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.despacho)), 0),
          totalcaidos: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.caidos)), 0),
          totalincompletos: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.incompletos)), 0),
          proveedor: data3[0],

          // ── variables del layout ──────────────────────
          documentTitle: `GUÍA DE INGRESO - ${data[0].tipo}`,
          documentNumberLabel: 'N° Guía',
          documentNumber: `${params.id}`.padStart(10, '0'),
          documentDate: (new Date(data1[0].created_at)).toLocaleDateString('en-GB'),
          firmas: ['Asistente almacén', 'Control de ingreso'],
          emisor: req.session.username ?? '',
          // ─────────────────────────────────────────────

          helpers: { plusindex(index) { return index + 1 } }
        },
        async (err, html) => {
          try {
            if (params.condicion == 2) {
              const browser = await puppeteer.launch();
              const page = await browser.newPage();
              await page.setContent(html);
              const pdfBuffer = await page.pdf({
                width: '20cm', height: '27.94cm',
                landscape: true, printBackground: true,
                margin: { left: 0, right: 0 }
              });
              await browser.close();
              resp.send({ data: pdfBuffer.toString('base64') })
            } else {
              resp.send(html)
            }
          } catch (error) {
            resp.status(500).send('Error al generar el PDF');
          }
        }
      );
    } catch (err) {
      resp.status(500).json({ error: err.message });
    }
  }

  static async verInfoDespachoPedido(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoPedidoCab(params.idpedido)
    let data1 = await ProduccionModel.getInfoDespachoCab(params.id)
    let data2 = await ProduccionModel.getInfoDespachoDet(params.id, 'PEDIDOS')

    try {
      const data3 = data[0].id_proveedor_CAB
        ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
        : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

      resp.render(
        // ✅ telas usa el nuevo template v2 — avios sin cambios
        data[0].tipo == 'TELAS' ? 'guia_despacho_pedido_telas_v2' : 'guia_despacho_pedido_avios',
        {
          cabecera_ingreso: data1[0],
          cabecera: data[0],
          detalle: data2,
          proveedor: data3[0],
          idref: `${parseInt(data[0].idx)}`,
          idguia: `${params.id}`.padStart(10, '0'),
          date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
          time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
          totalunid: data2.reduce((c, v) => c + parseFloat(v.cantidad), 0).toFixed(2),
          totaldespacho: data2.reduce((c, v) => c + parseFloat(v.despacho), 0).toFixed(2),
          totalimporte: data2.reduce((c, v) => c + (parseFloat(v.despacho ?? 0) * parseFloat(v.costo_unit ?? 0)), 0).toFixed(2),
          totalcaidos: 0,
          totalincompletos: 0,

          // ── variables del layout ──────────────────────
          documentTitle: `GUÍA DE INGRESO -   `,
          documentNumberLabel: 'N° Guía',
          documentNumber: `${params.id}`.padStart(10, '0'),
          documentDate: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
          firmas: ['Auxiliar de almacén', 'Control de ingreso'],
          emisor: req.session.username ?? '',
          tipoGuia: data[0].tipo,
          oc: data[0].orden_ref,
          modelo: data[0].produccion,
          tipoGuia: data[0].tipo,
          giradoPor: data1[0].responsable_ingreso,
          nroGuiaRef: data1[0].nro_guia,
          // ─────────────────────────────────────────────

          helpers: { plusindex(index) { return index + 1 } }
        },
        async (err, html) => {
          try {
            if (params.condicion == 2) {
              const browser = await puppeteer.launch();
              const page = await browser.newPage();
              await page.setContent(html);
              const pdfBuffer = await page.pdf({
                width: '20cm', height: '27.94cm',
                landscape: false, printBackground: true,
                margin: { left: 0, right: 0 }
              });
              await browser.close();
              resp.send({ data: pdfBuffer.toString('base64') })
            } else {
              resp.send(html)
            }
          } catch (error) {
            resp.status(500).send('Error al generar el PDF');
          }
        }
      );
    } catch (err) {
      resp.status(500).json({ error: err.message });
    }
  }

  static async verInfoDespachoMuestra(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    let data1 = await ProduccionModel.getInfoDespachoCab(params.id)
    let data2 = await ProduccionModel.getInfoDespachoDet(params.id)
    const data3 = data[0]?.id_proveedor_CAB
      ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
      : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

    try {
      resp.render('guia_despacho_muestra', {
        cabecera: data[0],
        detalle: data2,
        proveedor: data3[0],
        idref: data1[0]?.nro_guia ?? '',
        idguia: `${data[0].idx}`.padStart(10, '0'),
        date: new Date(data[0].created_at).toLocaleDateString('en-GB'),
        time: new Date(data[0].created_at).toLocaleTimeString('en-GB'),
        totalunid: data2.reduce((c, v) => c + parseFloat(v.cantidad ?? 0), 0),
        numproto: data2.filter(r => r.isprototipo).length,
        prototipos: data2.filter(r => r.isprototipo),

        // ── variables del layout ──────────────────────
        documentTitle: `GUÍA DE INGRESO - ${data[0].tipo}`,
        documentNumberLabel: 'N° Guía',
        documentNumber: `${data[0].idx}`.padStart(10, '0'),
        documentDate: new Date(data[0].created_at).toLocaleDateString('en-GB'),
        firmas: ['Asistente almacén', 'Control de ingreso'],
        labelFecha: 'emisión',
        emisor: req.session.username ?? '',
        // ─────────────────────────────────────────────

        helpers: { plusindex(index) { return index + 1 } }
      },
        async (err, html) => {
          if (err) return resp.status(500).send('Error al renderizar')
          try {
            if (params.condicion == 2) {
              const browser = await puppeteer.launch()
              const page = await browser.newPage()
              await page.setContent(html)
              const pdfBuffer = await page.pdf({
                width: '20cm', height: '27.94cm',
                printBackground: true,
                margin: { left: 0, right: 0 }
              })
              await browser.close()
              resp.send({ data: pdfBuffer.toString('base64') })
            } else {
              resp.send(html)
            }
          } catch (error) {
            resp.status(500).send('Error al generar el PDF')
          }
        })
    } catch (err) {
      resp.status(500).json({ error: err.message })
    }
  }

  static async exportInfoDespacho(req, resp) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.idguia)
    const data2 = await ProduccionModel.getInfoDespachoDet(params.id)
    const data3 = data[0].id_proveedor_CAB
      ? await ProduccionModel.searchProveedorById(data[0].id_proveedor_CAB)
      : [{ nom: data[0].responsable, ruc: '', direccion: data[0].destino }]

    resp.render(
      'guia_despacho',
      {
        color: 'black',
        info: params,
        cabecera: data[0],
        detalle: data2,
        prototipos: data2.filter(row => row.isprototipo),
        numproto: data2.filter(row => row.isprototipo).length,
        date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
        time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
        idguia: `${data[0].idx}`.padStart(10, 0),
        totalunid: data2.reduce((c, v) => c + (v.isprototipo ? 0 : parseFloat(v.cantidad)), 0),
        proveedor: data3[0],
        helpers: { plusindex(index) { return index + 1 } }
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfBuffer = await page.pdf({
            width: '20cm', height: '20.94cm',
            landscape: false, printBackground: true,
            margin: { left: 0, right: 0 }
          });
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }

  static async exportPedidoAvios(req, resp) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')

    resp.render(
      'avios',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        datos: req.body,
        detalle: JSON.parse(req.body.detalle),
        helpers: {
          foo(items) {
            let extra = 22 - items.length
            for (let i = 0; i < extra; i++) items.push(['', '', '', '', '', '', ''])
            return items.map((item, key) =>
              `<tr><td style="width:35px;text-align:center;" contenteditable="true">${key + 1}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[0]}</td>` +
              `<td style="width:60px;text-align:left;" contenteditable="true">${item[1]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[2]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[3]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[4]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[5]}</td></tr>`
            ).join("\n")
          }
        }
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfBuffer = await page.pdf({ format: 'A4', landscape: false, printBackground: true });
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }

  static async exportPedidoTelas(req, resp) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next-02.jpg')

    resp.render(
      'telas',
      {
        BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
        BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
        datos: req.body,
        detalle: JSON.parse(req.body.detalle),
        helpers: {
          foo(items) {
            let extra = 22 - items.length
            for (let i = 0; i < extra; i++) items.push(['', '', '', '', '', '', ''])
            return items.map((item, key) =>
              `<tr><td style="width:35px;text-align:center;" contenteditable="true">${key + 1}</td>` +
              `<td style="width:60px;text-align:left;" contenteditable="true">${item[0]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[1]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[2]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[3]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[4]}</td>` +
              `<td style="width:60px;text-align:center;" contenteditable="true">${item[5]}</td></tr>`
            ).join("\n")
          }
        }
      },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfBuffer = await page.pdf({ format: 'A4', landscape: false, printBackground: true });
          await browser.close();
          resp.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          resp.status(500).send('Error al generar el PDF');
        }
      });
  }

  static async printOrdenes(req, resp) {
    const doc = new PDFDocument();
    doc.pipe(fs.createWriteStream('output.pdf'));
    doc.fontSize(25).text('Some text with an embedded font!', 100, 100);
    doc.addPage().fontSize(12).text('Calle Felipe Santiago Crespo Nro 581 - San Luis - Lima - Lima', 100, 100);
    doc.addPage().fontSize(12).text('Here is some vector graphics...', 100, 100);
    doc.save().moveTo(100, 150).lineTo(100, 250).lineTo(200, 250).fill('#FF3300');
    doc.scale(0.6).translate(470, -380).path('M 250,75 L 323,301 131,161 369,161 177,301 z').fill('red', 'even-odd').restore();
    doc.addPage().fillColor('blue').text('Here is a link!', 100, 100).underline(100, 100, 160, 27, { color: '#0000FF' }).link(100, 100, 160, 27, 'http://google.com/');
    doc.end();
    resp.download('./output.pdf', 'output.pdf');
  }

  static async getOrdenesByParams(req, reply) {
    const info = req.body
    const data = await ProduccionModel.getOrdenesByParams(info.params)
    reply.json(data)
  }

  static async getOrdenesById(req, reply) {
    const info = req.params
    const data = await ProduccionModel.getOrdenesById(info)
    reply.json(data)
  }

  static async pushItems(req, resp) {
    const info = req.body
    const user_data = req.session
    const data = await ProduccionModel.pushItems(info, user_data)
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
    resp.json(data)
  }

  static async updateItems(req, resp) { }

  static async deleteOrden(req, resp) {
    let id = req.params.id
    const data = await ProduccionModel.deleteOrden(id)
    resp.json(data)
  }

  static async getListaEstampados(req, res) {
    const data = await ProduccionModel.getListaEstampados()
    res.json(data)
  }

  static async getInfoEstampado(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoEstampado(id)
    res.json(data)
  }

  static async saveInfoEstampado(req, res) {
    const data = await ProduccionModel.saveInfoEstampado(req.body)
    res.json({ ok: true, message: 'datos guardados' })
  }

  static async eliminarInfoEstampado(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoEstampado(id)
    res.json(data)
  }

  static async ShowInforme(req, res) {
    const params = req.params
    const data = await ProduccionModel.getInfoEstampado(params.id)
    const data2 = await ProduccionModel.getInfoEstampadoCab(params.id)
    res.render('estampado', {
      info: params,
      detalle: data,
      fecha: new Date(Date.parse(data2[0].created_at)).toLocaleDateString()
    })
  }

  // ──────────────────────────────────────────────────
  // Sección: Guías
  // ──────────────────────────────────────────────────

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
    const data7 = await ProduccionModel.getPlantillasTallasByOrden(data[0].id_orden_CAB)
    res.json([data[0], data2, data3, data4, data5, data6, data7[0]])
  }

  static async getInfoMuestras(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoMuestraCab(id)
    const data2 = await ProduccionModel.getInfoMuestraDet(id)
    const data3 = await ProduccionModel.getPlantillasTallasByOrden(data[0].id_orden_CAB)
    res.json([data[0], data2, data3[0]])
  }

  static async searchGuia(req, res) {
    const { info } = req.params
    const data = await ProduccionModel.searchGuia(info)
    res.json(data)
  }

  static async saveInfoMuestras(req, res) {
    const data = await ProduccionModel.saveInfoMuestras(req.body)
    res.json(data)
  }

  static async saveInfoGuias(req, res) {
    const data = await ProduccionModel.saveInfoGuias(req.body)
    res.json(data)
  }

  static async saveInfoGuiasGLB(req, res) {
    const data = await ProduccionModel.saveInfoGuiasGLB(req.body)
    res.json(data)
  }

  static async saveInfoGuiasXPQ(req, res) {
    const data = await ProduccionModel.saveInfoGuiasXPQ(req.body)
    res.json(data)
  }

  static async eliminarInfoGuias(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoGuias(id)
    res.json(data)
  }

  static async eliminarInfoGuiasGLB(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoGuiasGLB(id)
    res.json(data)
  }

  static async eliminarInfoMuestras(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoMuestras(id)
    res.json(data)
  }

  static async eliminarInfoGuiasXPQ(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoGuiasXPQ(id)
    res.json(data)
  }

  static async anularInfoGuias(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.anularInfoGuias(id)
    res.json(data)
  }

  static async anularInfoGuiasGLB(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.anularInfoGuiasGLB(id)
    res.json(data)
  }

  static async anularInfoGuiasXPQ(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.anularInfoGuiasXPQ(id)
    res.json(data)
  }

  static async getStatusGuia(req, res) {
    res.render('statusguia', {
      info: { nro_orden: '', fecha: '', proveedor: '', re: '', ruc: '', dirigido: '', girado: '', telefono: '', acuenta: '', entrega: '', observaciones: '' },
      helpers: {
        foo(items) {
          let extra = 18 - items.length
          for (let i = 0; i < extra; i++) items.push(['', '', '', '', '', '', ''])
          return items.map((item, key) =>
            `<tr style="height:22px;">` +
            `<td style="width:35px;text-align:center;background-color:#ddebf7;">${key + 1}</td>` +
            `<td style="width:60px;text-align:left;">${item[0]}</td>` +
            `<td style="width:60px;text-align:center;background-color:#ddebf7;">${item[1]}</td>` +
            `<td style="width:60px;text-align:center;background-color:#ddebf7;">${item[2]}</td>` +
            `<td style="width:60px;text-align:center;background-color:#ddebf7;">${item[3]}</td>` +
            `<td style="width:60px;text-align:center;background-color:#ddebf7;">${item[4]}</td>` +
            `<td style="width:60px;text-align:center;background-color:#ddebf7;">${item[5]}</td></tr>`
          ).join("\n")
        }
      }
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

  static async GeneraPedidoAvios(cabecera, detalle, res, mode) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = await fs.readFile('public/images/logo_next.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')

    const subtotal = detalle.reduce((sum, item) => sum + (parseFloat(item['cantidad'] ?? 0) * parseFloat(item['precio'] ?? 0)), 0).toFixed(2)
    const igvAmount = (subtotal * 0.18).toFixed(2)
    const totalFinal = (parseFloat(subtotal) + parseFloat(igvAmount)).toFixed(2)

    const proveedor = {
      nom: cabecera.Raz_social_DOC || cabecera.nom || '',
      ruc: cabecera.Nro_Doc_Prov || cabecera.ruc || ''
    }

    const CONDICIONES_PAGO = ['', 'Pago contra entrega', 'Pago programado', 'Pago semanal', 'Pago con adelanto + prog.']

    res.render('guia_ingreso_requerimiento_avios', {
      BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
      BINARY_CHUNKS3: BINARY_CHUNKS3.toString('base64'),
      documentTitle: `GUÍA DE INGRESO - ORDEN DE COMPRA`,
      documentNumberLabel: 'N° Requerimiento',
      documentNumber: cabecera.nro_requerimiento || cabecera.id_pedido_CAB || '',
      documentDate: cabecera.fecha_pedido || new Date().toLocaleDateString('es-PE'),
      proveedor: proveedor,
      cabecera: cabecera,
      idref: cabecera.nro_requerimiento || cabecera.id_pedido_CAB || '',
      oc: cabecera.oc || '',
      modelo: cabecera.modelo || '',
      nroGuiaRef: cabecera.nro_requerimiento || '',
      detalle: detalle,
      subtotal: subtotal,
      igv: igvAmount,
      total: subtotal,
      totalFinal: totalFinal,
      condicion_pago: CONDICIONES_PAGO[cabecera.condicion_pago] ?? '', // ← NUEVO
      firmas: [
        'Jefferson Tapia Montoya',
        'July Apellido'
      ],
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE')
    },
      async (err, html) => {
        try {
          if (err) {
            console.error('Error rendering template:', err)
            res.status(500).send('Error al generar el documento')
            return
          }

          if (mode === 'download') {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf({
              width: '20cm', height: '27.94cm',
              landscape: false, printBackground: true,
              margin: { left: 0, right: 0 }, scale: 1
            });
            await browser.close();
            res.send({ data: pdfBuffer.toString('base64') })
          } else {
            res.send(html)
          }
        } catch (error) {
          console.error('Error generating PDF:', error)
          res.status(500).send('Error al generar el PDF');
        }
      })
  }

  static async VistaPreviaPedidoAvios(req, res) {
    const mode = req.params.mode || 'download'
    const data = req.body
    let cabecera, detalle

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    ProduccionController.GeneraPedidoAvios(cabecera, detalle, res, mode, cabecera.documentTitle)
  }

  static async VistaRapidaPedidoAvios(req, res) {
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const data = req.body
    let cabecera, detalle

    console.log("TEST",data)

    if (id !== '') {
      cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(id)
    } else if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    ProduccionController.GeneraPedidoAvios(cabecera, detalle, res, mode, cabecera.documentTitle)
  }

  static async VistaRapidaPedidoTelas(req, res) {
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const data = req.body
    let cabecera, detalle

    if (id !== '') {
      cabecera = (await ProduccionModel.getInfoPedidoCab(id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(id)
    } else if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    ProduccionController.GenerarPedidoTelas(cabecera, detalle, res, mode, cabecera.documentTitle)
  }

  static async GenerarPedidoTelas(cabecera, detalle, res, mode, documentTitle) {
    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = cabecera.emisor == 'NEXT'
      ? await fs.readFile('public/images/logo_next.png')
      : await fs.readFile('public/images/logo_elenex_company.png')

    const totalImporte = detalle.reduce((sum, item) =>
      sum + (parseFloat(item['cantidad_pedida'] ?? item['cantidad'] ?? 0) * parseFloat(item['precio_unitario'] ?? item['precio'] ?? 0)), 0
    ).toFixed(2)
    const igvAmount = (totalImporte * 0.18).toFixed(2)
    const totalConIgv = (parseFloat(totalImporte) + parseFloat(igvAmount)).toFixed(2)

    const proveedor = {
      nom: cabecera.proveedor || '',
      ruc: cabecera.ruc || ''
    }

    const CONDICIONES_PAGO = ['', 'Pago contra entrega', 'Pago programado', 'Pago semanal', 'Pago con adelanto + prog.']

    res.render('telas_v2', {
      BINARY_CHUNKS: BINARY_CHUNKS.toString('base64'),
      BINARY_CHUNKS2: BINARY_CHUNKS2.toString('base64'),
      documentTitle: documentTitle || 'GUÍA DE INGRESO - ORDEN DE COMPRA',
      documentNumberLabel: 'N° ORDEN',
      documentNumber: cabecera.orden_ref || cabecera.nro_requerimiento || '',
      documentDate: cabecera.fecha_pedido || new Date().toLocaleDateString('es-PE'),
      proveedor: proveedor,
      cabecera: cabecera,
      idref: cabecera.orden_ref || '',
      oc: cabecera.oc || '',
      modelo: cabecera.modelo || '',
      nroGuiaRef: cabecera.orden_ref || '',
      detalle: detalle,
      totalImporte: totalImporte,
      observaciones: cabecera.observaciones || '',
      condicion_pago: CONDICIONES_PAGO[cabecera.condicion_pago] ?? '', // ← NUEVO
      firmas: [
        'Encargado de Compras',
        'Gerente de Operaciones'
      ],
      date: new Date().toLocaleDateString('es-PE'),
      time: new Date().toLocaleTimeString('es-PE')
    },
      async (err, html) => {
        try {
          if (mode === 'download') {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf({
              width: '20cm', height: '27.94cm',
              landscape: false, printBackground: true,
              margin: { left: 0, right: 0 }, scale: 1
            });
            await browser.close();
            res.send({ data: pdfBuffer.toString('base64') })
          } else {
            res.send(html)
          }
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
        }
      })
  }

  static async VistaRapidaCuadreTelas(req, res) {
    const id = req.params.id || ''
    const mode = req.params.mode || 'download'
    const info = await ProduccionModel.getInfoCuadreTelas(id)
    ProduccionController.GenerarCuadreTelas(info, res, mode)
  }

  static async GenerarCuadreTelas(detalle, res, mode = 'download') {
    res.render('cuadretelas', {
      info: detalle,
      helpers: {
        cuerpo(info) {
          return info.reduce((c, v) => {
            const head = `<tr><td>${v.producto}</td><td>${v.color}</td></tr>`
            const body = v.ingresos.map(dat =>
              `<tr><td>${dat.nroguia}</td><td>${dat.fec_despacho}</td><td>${dat.despacho}</td><td>${dat.costo}</td></tr>`
            )
            c.push(head.concat(body.join('')))
            return c
          }, []).join("\n")
        }
      }
    },
      async (err, html) => {
        try {
          if (mode === 'download') {
            const browser = await puppeteer.launch();
            const page = await browser.newPage();
            await page.setContent(html);
            const pdfBuffer = await page.pdf({
              width: '20cm', height: '27.94cm',
              landscape: false, printBackground: true,
              margin: { left: 0, right: 0 }, scale: 1
            });
            await browser.close();
            res.send({ data: pdfBuffer.toString('base64') })
          } else {
            res.send(html)
          }
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
        }
      })
  }

  static async VistaPreviaPedido(req, res) {
    const tipo = req.params.tipo
    const data = req.body
    let cabecera, detalle

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }

    const BINARY_CHUNKS = await fs.readFile('public/images/firma_jefferson.png')
    const BINARY_CHUNKS2 = cabecera.emisor == 'NEXT'
      ? await fs.readFile('public/images/logo_next.png')
      : await fs.readFile('public/images/logo_elenex_company.png')
    const BINARY_CHUNKS3 = await fs.readFile('public/images/requerimiento.png')

    if (tipo == 'avios') {
      ProduccionController.GeneraPedidoAvios(cabecera, detalle, res, 'download', cabecera.documentTitle)
    } else {
      ProduccionController.GenerarPedidoTelas(cabecera, detalle, res, 'download', cabecera.documentTitle)
    }
  }

  static async VistaPreviaPedidoAvios(req, res) {
    const mode = req.params.mode || 'download'
    const data = req.body
    let cabecera, detalle

    if (data.id) {
      cabecera = (await ProduccionModel.getInfoPedidoCab(data.id))[0]
      detalle = await ProduccionModel.getInfoPedidoDet(data.id)
    } else {
      cabecera = JSON.parse(data.info)
      detalle = JSON.parse(data.detalle)
    }
    ProduccionController.GeneraPedidoAvios(cabecera, detalle, res, mode, cabecera.documentTitle)
  }

  // ──────────────────────────────────────────────────
  // Sección: Pedidos
  // ──────────────────────────────────────────────────

  static async getListaPedidos(req, res) {
    const search = req.params.search ?? ''
    const data = await ProduccionModel.getListaPedidos(search)
    res.json(data)
  }

  static async getNuevoPedido(req, res) {
    const data = await ProduccionModel.getNuevoPedido()
    res.json(data)
  }

  static async saveInfoPedidosTelas(req, res) {
    const data = await ProduccionModel.saveInfoPedidosTelas(req.body)
    res.json(data)
  }

  static async saveInfoPedidosAvios(req, res) {
    const data = await ProduccionModel.saveInfoPedidosAvios(req.body)
    res.json(data)
  }

  static async saveInfoPedidosAdicionales(req, res) {
    const data = await ProduccionModel.saveInfoPedidosAdicionales(req.body)
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

    let lista_despachos = [...new Set(cruce.reduce((c, v) => [...c, v.id_despacho], []))]

    let formateo = cruce.reduce((carry, valor) => {
      if (carry.find(row => row.idx == valor.idx)) {
        let itm = carry.find(row => row.idx == valor.idx)
        lista_despachos.forEach(item => { itm[item] = itm[item] + (valor.id_despacho == item ? valor.despacho : 0) })
      } else {
        lista_despachos.forEach(item => { valor[item] = (item == valor.id_despacho ? valor.despacho : 0) })
        carry.push(valor)
      }
      return carry
    }, [])

    let final = formateo.reduce((carry, valor) => {
      valor['total_despacho'] = 0
      lista_despachos.forEach(item => { valor['total_despacho'] += valor[item] })
      valor['diferencia'] = (valor['total_despacho'] - valor['cantidad']).toFixed(2)
      valor['importe_inicial'] = (valor['cantidad'] * valor['precio']).toFixed(2)
      valor['importe_despacho'] = (valor['total_despacho'] * valor['precio_despacho']).toFixed(2)
      valor['importe_diferencia'] = valor['importe_despacho'] - valor['importe_inicial']
      carry.push(valor)
      return carry
    }, [])

    res.render('pedidoinforme', {
      datos: data[0],
      detalle: final,
      despachos: lista_despachos,
      date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      helpers: {
        plusindex(index) { return index + 1 },
        foo(items) {
          let total_inicial = 0, total_final = 0
          let rows = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `<tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};">` +
              `<td style="width:25px;text-align:center;font-size:.65rem;">${key + 1}</td>` +
              `<td style="width:130px;font-size:.65rem;font-weight:bold;">${item['producto']} ${item['color']}</td>` +
              `<td style="width:30px;text-align:center;font-size:.65rem;">${item['cantidad']}</td>` +
              `<td style="width:40px;text-align:center;font-size:.65rem;">${item['precio']}</td>` +
              `<td style="width:40px;text-align:center;font-weight:bold;font-size:.65rem;">${item['importe_inicial']}` +
              `<td style="width:40px;text-align:center;font-size:.65rem;">${lista_despachos.map(id => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("")}</td>` +
              `<td style="width:40px;text-align:center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.65rem;">${item['diferencia']}</td>` +
              `</td><td style="width:40px;text-align:center;font-size:.65rem;">${item['precio_despacho']}</td>` +
              `<td style="width:40px;text-align:center;font-weight:bold;font-size:.65rem;">${item['importe_despacho']}</td></tr>`
          })
          rows.push(
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr>` +
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr>` +
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${5 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">DIFERENCIA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`
          )
          return rows.join("\n")
        }
      }
    },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfBuffer = await page.pdf({
            height: '27.94cm', width: '20cm',
            landscape: false, printBackground: true,
            margin: { left: 0, right: 0 }, scale: 1
          });
          await browser.close();
          res.send({ data: pdfBuffer.toString('base64') })
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
        }
      })
  }

  static async ShowInformeServicio(req, res) {
    const params = req.params
    const data = await ProduccionModel.getInfoGuiaCab(params.id)
    const cruce = await ProduccionModel.getInfoGuiaDespacho(params.id)

    let lista_despachos = [...new Set(cruce.reduce((c, v) => [...c, v.id_despacho], []))]

    let formateo = cruce.reduce((carry, valor) => {
      if (carry.find(row => row.idx == valor.idx)) {
        let itm = carry.find(row => row.idx == valor.idx)
        lista_despachos.forEach(item => { itm[item] = itm[item] + (valor.id_despacho == item ? valor.despacho : 0) })
      } else {
        lista_despachos.forEach(item => { valor[item] = (item == valor.id_despacho ? valor.despacho : 0) })
        carry.push(valor)
      }
      return carry
    }, [])

    let final = formateo.reduce((carry, valor) => {
      valor['total_despacho'] = 0
      lista_despachos.forEach(item => { valor['total_despacho'] += valor[item] })
      valor['diferencia'] = (valor['total_despacho'] - valor['cantidad']).toFixed(2)
      valor['importe_inicial'] = (valor['cantidad'] * valor['costo']).toFixed(2)
      valor['importe_despacho'] = (valor['total_despacho'] * valor['costo']).toFixed(2)
      valor['importe_diferencia'] = valor['importe_despacho'] - valor['importe_inicial']
      carry.push(valor)
      return carry
    }, [])

    res.render('servicioinforme', {
      datos: data[0],
      detalle: final,
      despachos: lista_despachos,
      date: (new Date(data[0].created_at)).toLocaleDateString('en-GB'),
      time: (new Date(data[0].created_at)).toLocaleTimeString('en-GB'),
      helpers: {
        plusindex(index) { return index + 1 },
        foo(items) {
          let total_inicial = 0, total_final = 0
          let rows = items.map((item, key) => {
            total_inicial += parseFloat(item['importe_inicial'])
            total_final += parseFloat(item['importe_despacho'])
            return `<tr style="height:32px;background-color:${(key + 1) % 2 > 0 ? '#e9e9e9' : 'white'};">` +
              `<td style="width:25px;text-align:center;font-size:.65rem;">${key + 1}</td>` +
              `<td style="width:130px;font-size:.65rem;font-weight:bold;">${item['articulo']} ${item['color']}</td>` +
              `<td style="width:30px;text-align:center;font-size:.65rem;">${item['cantidad']}</td>` +
              `<td style="width:40px;text-align:center;font-size:.65rem;">${item['costo']}</td>` +
              `<td style="width:40px;text-align:center;font-weight:bold;font-size:.65rem;">${item['importe_inicial']}` +
              `<td style="width:40px;text-align:center;font-size:.65rem;">${lista_despachos.map(id => parseFloat(item[id]) > 0 ? item[id] + '/' : '').join("")}</td>` +
              `<td style="width:40px;text-align:center;color:${item['diferencia'] > 0 ? 'green' : 'red'};font-size:.65rem;">${item['diferencia']}</td>` +
              `</td><td style="width:40px;text-align:center;font-weight:bold;font-size:.65rem;">${item['importe_despacho']}</td></tr>`
          })
          rows.push(
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. FINAL:</td><td style="text-align:center;">${total_inicial.toFixed(2)}</td></tr>` +
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">TOTAL IMP. INICIAL:</td><td style="text-align:center;">${total_final.toFixed(2)}</td></tr>` +
            `<tr style="height:32px;border-top:.2px solid gray;"><td colspan='${4 + lista_despachos.length * 0 + 1}'></td><td colspan="2" style="text-align:right;font-weight:bold;">RESTA:</td><td style="text-align:center;">${(total_inicial - total_final).toFixed(2)}</td></tr>`
          )
          return rows.join("\n")
        }
      }
    },
      async (err, html) => {
        try {
          const browser = await puppeteer.launch();
          const page = await browser.newPage();
          await page.setContent(html);
          const pdfBuffer = await page.pdf({
            height: '27.94cm', width: '20cm',
            landscape: false, printBackground: true,
            margin: { left: 0, right: 0 }, scale: 1
          });
          await browser.close();
          res.send(html) // mantiene el comportamiento original
        } catch (error) {
          res.status(500).send('Error al generar el PDF');
        }
      })
  }

  static async ShowInformeServicio2(req, res) {
    const params = req.query
    const data = await ProduccionModel.getInfoInforme(params)
    const data2 = await ProduccionModel.getInfoAbonos(params)

    const colorfase = {
      'CONFECCION': 'rgb(168, 85, 247)', 'ESTAMPADO': 'rgb(107, 114, 128)',
      'ACABADOS': 'rgb(234, 49, 8)', 'LAVANDERIA': 'rgb(34, 197, 94)',
      'OJAL BOTON': 'rgb(8, 132, 234)', 'BORDADO': 'rgb(234, 179, 8)'
    }

    res.render('informe', {
      datos: data,
      abonos: data2,
      helpers: {
        plusindex(index) { return index + 1 },
        foo(cab, abonos) {
          let itemsAsHtml = []
          let formateo = cab.reduce((carry, item) => {
            if (Object.keys(carry).includes(item.proveedor) && Object.keys(carry[item.proveedor]).includes(`${item.id_guia}`)) {
              carry[item.proveedor][`${item.id_guia}`].push(item)
            } else {
              carry[item.proveedor] = { [item.id_guia]: [item] }
            }
            return carry
          }, {})

          Object.keys(formateo).forEach(prov => {
            let fila = `<tr style="height:32px;font-size:14px;font-weight:900;background-color:#ebebeb;"><td colspan='8'>${prov}</td></tr>`
            let total_despacho = 0, total_cantidad = 0, total_imp = 0

            Object.keys(formateo[prov]).forEach(guia => {
              fila += `<tr style="height:32px;font-size:12px;"><td colspan='8'>
                <div style='width:80px;color:white;text-align:center;border-radius:20px;font-size:9px;padding:2px;background-color:${colorfase[formateo[prov][guia][0].servicio]}'>${formateo[prov][guia][0].servicio}</div>
                <div style="padding:5px;"><strong>Guia:</strong>#${guia} - <strong>FechaEmision:</strong>${formateo[prov][guia][0].fec_emision} - <strong>FechaRetorno:</strong>${formateo[prov][guia][0].fec_retorno} - <strong>OC:</strong>${formateo[prov][guia][0].orden_ref}</div>
              </td></tr>`

              formateo[prov][guia].forEach((item) => {
                fila += `
                  <tr style="height:28px;border-bottom:.2px solid gray;">
                    <td style="width:10px;text-align:center;font-size:.9rem;"></td>
                    <td style="width:30px;text-align:center;font-size:.9rem;">${item['cantidad']}</td>
                    <td style="width:130px;font-size:.9rem;font-weight:bold;">${item['articulo']}</td>
                    <td style="width:40px;text-align:center;font-size:.9rem;">${item['costo']}</td>
                    <td style="width:40px;text-align:center;font-weight:bold;font-size:.9rem;background-color:#ebebeb;">${(item['cantidad'] * item['costo']).toFixed(2)}</td>
                    <td style="width:40px;text-align:center;font-size:.9rem;">${item['guia'] ?? '-'}</td>
                    <td style="width:40px;text-align:center;color:${(item['total_despacho'] - item['cantidad']) >= 0 ? 'green' : 'red'};font-size:.9rem;">${item['total_despacho'] ?? '-'}</td>
                    <td style="width:40px;text-align:center;font-weight:bold;font-size:.9rem;">${(item['total_despacho'] * item['costo']).toFixed(2)}</td>
                  </tr>`
                total_imp += parseFloat(item['total_despacho'] * item['costo'])
                total_despacho += parseFloat(item['total_despacho'] ?? 0)
                total_cantidad += parseFloat(item['cantidad'] ?? 0)
              })

              fila += `<tr style="height:30px;border-bottom:.2px solid gray;"><td></td><td style="text-align:center;">${total_cantidad}</td><td></td><td></td><td></td><td></td><td style="text-align:center;">${total_despacho}</td><td style="text-align:center;">${total_imp.toFixed(2)}</td></tr>`

              abonos.filter(row => row.id_servicio_CAB == guia).forEach((item, key) => {
                fila += `<tr style="height:30px;"><td></td><td></td><td></td><td></td><td></td><td></td><td style="text-align:center;color:red;">ABONO-${key + 1}</td><td style="text-align:center;color:red;">${item['importe']}</td></tr>`
              })
              fila += `<tr style="height:30px;"><td></td></tr>`
            })
            itemsAsHtml.push(fila)
          })
          return itemsAsHtml.join("\n")
        }
      }
    })
  }

  // ──────────────────────────────────────────────────
  // Sección: Despachos
  // ──────────────────────────────────────────────────

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

  static async saveInfoDespachosGuiaGLB(req, res) {
    const data = await ProduccionModel.saveInfoDespachosGuiaGLB(req.body)
    res.json(data)
  }

  static async saveInfoDespachosGuiaXPQ(req, res) {
    const data = await ProduccionModel.saveInfoDespachosGuiaXPQ(req.body)
    res.json(data)
  }

  static async getInfoDespachos(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoDespachoCab(id)
    const data2 = await ProduccionModel.getInfoDespachoDet(id, data[0].tipo)
    const data3 = await ProduccionModel.getInfoDespachoAdi(id, data[0].tipo)
    res.json([data[0], data2, data3])
  }

  static async eliminarInfoDespachosPedido(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoDespachosPedido(id)
    res.json(data)
  }

  static async eliminarInfoDespachosGuia(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoDespachosGuia(id)
    res.json(data)
  }

  static async eliminarInfoDespachosGuiaGLB(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoDespachosGuiaGLB(id)
    res.json(data)
  }

  static async eliminarInfoDespachosGuiaXPQ(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarInfoDespachosGuiaXPQ(id)
    res.json(data)
  }

  static async validaInventario(req, res) {
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

  static async saveRecepcionAcabados(req, res) {
    const data = await ProduccionModel.saveRecepcionAcabados(req.body)
    res.json(data)
  }

  static async updateRecepcionAcabados(req, res) {
    const data = await ProduccionModel.updateRecepcionAcabados(req.body)
    res.json(data)
  }

  static async eliminarRecepcionAcabados(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.eliminarRecepcionAcabados(id)
    res.json(data)
  }

  static async getAcabadosPendientes(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getAcabadosPendientes(id)
    res.json(data)
  }

  static async getAcabadosDisponible(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getAcabadosDisponible(id)
    res.json(data)
  }

  static async UpdateEstadoGuiaAcabados(req, res) {
    const data = await ProduccionModel.UpdateEstadoGuiaAcabados()
    res.json({ ok: true, message: 'No implementado aun' })
  }

  static async getInfoEmpaquetado(req, res) {
    const id = req.params.id
    const data = await ProduccionModel.getInfoDespachoEmpaquetadoCab(id)
    const data2 = await ProduccionModel.getInfoDespachoEmpaquetadoDet(id, data[0].id_orden_origen)
    res.json([data[0], data2])
  }

  static async getListaDespachosAcabados(req, res) {
    const search = req.params.search ?? ''
    const tipo = req.params.tipo ?? ''
    const data = await ProduccionModel.getListaDespachosAcabados(tipo, search)
    res.json(data)
  }
}