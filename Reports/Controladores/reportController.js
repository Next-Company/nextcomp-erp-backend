import ReporteService from "../Servicios/reportServicio.js"
import ExcelJS from 'exceljs';

export default class ReportController{
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