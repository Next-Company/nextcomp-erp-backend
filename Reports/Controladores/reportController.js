import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise"
import fs from 'node:fs/promises'
import path from 'node:path';
import ReporteService from "../Servicios/reportServicio.js"
import ExcelJS from 'exceljs';

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
          console.log('Renombrando :',oldPath,newPath)
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
        console.log('Aca estamos :',base_letras)
        try {
          conn = await mysql.createConnection(configs[1])
          await conn.connect()
          conn.beginTransaction()
          let insert = async ()=>{
            let data = base_letras.shift()
            console.log('Fila a insertar :',data)
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
          console.log(error)
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
      console.log(error)
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
      console.log(error)
      res.json(error)
    }
  }
}