import ReporteService from "../Servicios/reportServicio.js"
import ExcelJS from 'exceljs';

export default class ReportController{
  static async getInformeLetras(req,res){
    const result = await ReporteService.getInformeLetras()
    const MESES = ['','ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE']
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile('public/templates/formato_letras.xlsx');
      const worksheet = workbook.getWorksheet('INFORME');

      // res.json("HOla mudo")

      let row  = 2
      let formateo = Object.groupBy(result,row=>row.mes)
      let totalMN = 0, totalUSD = 0

      Object.keys(formateo).forEach(key=>{
        worksheet.getRow(row).values = ['','',MESES[key]]
        worksheet.getCell(`C${row}`).fill = {
          type: 'pattern',
          pattern:'solid',
          fgColor:{argb:'EED202'},
        };
        worksheet.getCell(`C${row}`).font = {
          bold: true
        };
        row+=1
        formateo[key].forEach(item=>{
          worksheet.getRow(row).values = [item.num_letra,item.documentos_ref,item.proveedor,item.fec_vencimiento,item.importe]
          if(item.moneda == 'MN'){
            worksheet.getCell(`E${row}`).numFmt = '"S\/\."#,##0.00;[Red]\-"S\/\."#,##0.00';
            totalMN += parseFloat(item.importe)
          }else{
            worksheet.getCell(`E${row}`).numFmt = '"$\/."#,##0.00;[Red]\-"$\/."#,##0.00';
            totalUSD += parseFloat(item.importe)
          }
          row+=1
        })
        worksheet.insertRow(row)
        row+=1
      })

      row+=1
      worksheet.getRow(row).values = ['','','','TOTAL SOLES:',totalMN]
      worksheet.getCell(`E${row}`).numFmt = '"S\/\."#,##0.00;[Red]\-"S\/\."#,##0.00'
      worksheet.getCell(`E${row}`).font = {
        size: 16,
        bold: true
      };
      row+=1
      worksheet.getRow(row).values = ['','','','TOTAL DOLARES:',totalUSD]
      worksheet.getCell(`E${row}`).numFmt = '"$\/."#,##0.00;[Red]\-"$\/."#,##0.00'
      worksheet.getCell(`E${row}`).font = {
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