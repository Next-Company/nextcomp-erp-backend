import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
export default class ReporteService{
  static async getInformeLetras(filters){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      // const [result] = await conn.query(`select tb1.*,MONTH(tb1.fec_emision) as mes from tbl2_letras_cab tb1 where tb1.estado = 'EMIT'`)
      const [result] = await conn.query(`
        SELECT tb1.proveedor,MONTH(tb1.fec_vencimiento) as mes,tb1.documentos_ref,tb1.num_letra,DATE_FORMAT(tb1.fec_emision,'%d/%m/%Y') as fec_emision,DATE_FORMAT(tb1.fec_vencimiento,'%d/%m/%Y') as fec_vencimiento,IF(tb1.moneda = 'MN',tb1.importe,0) AS importe_soles,IF(tb1.moneda = 'USD',tb1.importe,0) AS importe_dolares,GROUP_CONCAT(CONCAT(IF(tda.tipodoc = 1,'FT','NC'),tda.serie,'-',tda.numero)) as facturas_ref
        FROM tbl2_letras_cab tb1
        LEFT JOIN tbl2_letras_adi tla on tb1.idx = tla.id_letra_CAB 
        LEFT JOIN tbl2_despachos_adi tda on tda.idx = tla.id_factura_CAB 
        WHERE tb1.estado = 'EMIT'
        GROUP BY tb1.proveedor,tb1.moneda,tb1.documentos_ref,tb1.num_letra,tb1.fec_emision,tb1.fec_vencimiento ,tb1.importe
      `)
      await conn.end()
      return result
    } catch (error) {
      console.log(error)
    } finally{
      if(conn) conn.end()
    }
  }
  static async getResumenConsolidado(filters = {}){
    let conn = undefined
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      
      let query = `select t1.oc,t1.id_cliente_CAB,t1.cliente,t1.fec_emitida,t1.fec_entrega,t1.base,t1.precio,t1.modelos,t1.estado_orden,t1.ruta_proceso,t2.id_orden_CAB,t2.orden_ref,t2.tipo,t2.motivo_traslado,t2.id_proveedor_CAB,t2.proveedor,t2.servicio,t2.responsable,t2.marca,t2.modelo,t2.producto,t2.fec_emision,t2.fec_retorno,t2.costo,t2.observaciones,t2.estado
      from tbl2_fases_prod_ordenes t1
      join tbl2_guias_traslado_cab t2 on t1.idx = t2.id_orden_CAB
      where t1.estado_orden NOT IN ('ANULADO','OTRO')`
      let [result,fields] = await conn.query(query)
      console.log("Consulta ejecutada:", result);
      console.log("Info de las columnas:", fields.map(f => f.name));
      return [result,fields]
    } catch (error) {
      return error
    } finally {
      if(conn) conn.end()
    }
  }
  static async getDespachosConsolidado(filters = {}){
    console.log("Dentro de despachos consolidado")
    let conn = undefined
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      
      let query = `select 
        t0.orden_ref,
        t0.proveedor,
        t0.servicio,
        t0.responsable,
        t0.marca,
        t0.modelo,
        t0.producto,
        DATE(t0.fec_emision) as fec_emision_servicio,
        DATE(t0.fec_retorno) as fec_retorno,
        t0.costo,
        t0.observaciones,
        t0.estado,
        t1.idx as id_despacho,
        t1.nro_guia as nro_guia_despacho,
        DATE(t1.fec_emision_guia) as fec_guia_despacho,
        DATE(t1.fec_despacho) as fec_emision_despacho,
        t3.talla,
        t3.despachos,
        t3.caidos,
        t3.incompletos
        from tbl2_fases_prod_ordenes tt
        join tbl2_guias_traslado_cab t0 on t0.id_orden_CAB = tt.idx
        join tbl2_despachos_cab t1 on t1.id_guia_origen = t0.idx
        join tbl2_despachos_det t2 on t1.idx = t2.id_despacho_CAB
        join tbl2_despachos_det_fracciones t3 on t3.id_despacho_DET = t2.idx
        where t0.tipo = 'SERVICIOS' and t0.estado <> 'ANULADO' and tt.estado_orden not in ('ANULADO','OTRO')`
      let [result,fields] = await conn.query(query)
      console.log("Informacion obtenida de la consulta:",result)
      return [result,fields]
    } catch (error) {
      return error
    } finally {
      if(conn) conn.end()
    }
  }
}