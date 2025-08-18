import mysql from 'mysql2/promise';
import { configs } from '../../Main/utils.js';

export default class AlmacenModel{
  static async getListaAlmacenes(){
    return [{info:1}]
  }
  static async generarGuiaDespachoAlmacen(info,tipo){
    // GENEREA EL DOCUMENTO DE SALIDA/INGRESO DE MERCADERIA CON FECHA HORA Y DOCUMENTO VINCULADO
    return [{info:1}]
  }
  static async InOutStore(info,tipo){
    return [{info:1}]
  }
  static async saveMovimientoInOut(info,tipo){
    // ACTUALIZA EL STOCK DE ALMACEN Y REGISTRA MVIMIENTO DE KARDEX
    return [{info:1}]
  }
  static async getMovimientosAlmacen(info,tipo){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      
      // const filters = info.filters ? JSON.parse(info.filters) : {};
      // let whereClauses = [
      //   'tkc.Suc_Tienda = ?',
      //   'tp.ruc_ = ?',
      //   `tkc.ruc IN (?, '10462873684')`
      // ];
      // let params = [info.almacen_, info.ruc_, info.ruc_];
  
      // if (Object.keys(filters).length > 0) {
      //   Object.entries(filters).forEach(([key, value]) => {
      //     whereClauses.push(`${key} = ?`);
      //     params.push(value);
      //   });
      // }
      let whereClauses = []
  
      const query = `
        SELECT tkc.*, tp.idx as id_proveedor_CAB, tp.nom as proveedor, tmc.cod_comprobante, tmc.anulado
        FROM tbl_kard_compras_CAB tkc
        JOIN tbl2_almacen_mov_cab tmc ON tkc.id_CAB = tmc.idx_documento_asoc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc
        WHERE 1=1
        ORDER BY tkc.fecha_sys DESC
        LIMIT 10
      `;
  
      const [result] = await conn.execute(query);
      console.log("El resultado de la consulta es:", result)
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveGuia(data){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      let cabecera = JSON.parse(data.info) 
      let detalle = JSON.parse(data.detalle)

      console.log("La informacion de la cebecra es:",cabecera)
      console.log("La informacion de la cebecra es:",detalle)

      // let consulta_proveedor;
      // if (postData.nro_producto_doc_prov) {
      //   consulta_proveedor = {
      //     ruc: postData.nro_producto_doc_prov,
      //     nom: postData.raz_producto_social,
      //     direccion: postData.txt_producto_direc
      //   };
      // } else {
      //   const [rows] = await conn.execute(
      //     "SELECT * FROM tbl2_proveedor WHERE idx = ?",
      //     [parseInt(postData.id_proveedor_CAB)]
      //   );
      //   consulta_proveedor = rows[0];
      // }

      // Obtener cod_cuenta
      const cod_cnta = 20;
      const tip_prod_cdp = 2;
      const serie_prod = 0;

      // Insertar en tbl_kard_compras_CAB
      const data_guia = {
        ruc: '20522094120',
        tip_DOC: tip_prod_cdp,
        serie_DOC: serie_prod,
        num_doc_CDP: cabecera.num_doc_CDP,
        Nro_Doc_Prov: cabecera.ruc,
        Raz_social_DOC: cabecera.nom,
        Dir_DOC: cabecera.direccion,
        Suc_Tienda: '',
        fecha_registro: cabecera.fecha_registro || '',
        observaciones: cabecera.observaciones || '',
        fec_Reg_DOC: cabecera.fec_producto_registro || '',
        fec_Emision_DOC: cabecera.fec_Emision_DOC || '',
        idx_usu: info.userid_,
        motivo: cabecera.motivo || null,
      };

      if(conn) conn.rollback()
      return {ok:true,message:'ok'}

      const [resultGuia] = await conn.execute(
        `INSERT INTO tbl_kard_compras_CAB (${Object.keys(data_guia).join(',')}) VALUES (${Object.keys(data_guia).map(() => '?').join(',')})`,
        Object.values(data_guia)
      );
      const id_guia = resultGuia.insertId;

      for (let key = 0; key < detalle.length; key++) {
        // let value = detalle[key];
        // if (!value.idx) {
        //   const [subprodRows] = await conn.execute(
        // `SELECT ts.idx FROM tbl2_subproductos ts WHERE ts.idx_CAB_PROD = ? AND ts.nro_lote = ? AND ts.idx_condicion = ?`,
        // [parseInt(value.idx_CAB_PROD), parseInt(value.nro_lote), parseInt(value.idx_condicion)]
        //   );
        //   if (subprodRows.length === 0) {
        // const [fieldsRows] = await conn.execute(`SHOW COLUMNS FROM tbl2_subproductos`);
        // const fields_table = fieldsRows.map(f => f.Field);
        // const new_value = {};
        // for (const k in value) {
        //   if (fields_table.includes(k)) new_value[k] = value[k];
        // }
        // const [insertSubprod] = await conn.execute(
        //   `INSERT INTO tbl2_subproductos (${Object.keys(new_value).join(',')}) VALUES (${Object.keys(new_value).map(() => '?').join(',')})`,
        //   Object.values(new_value)
        // );
        // value.idx = insertSubprod.insertId;
        //   } else {
        // value.idx = subprodRows[0].idx;
        //   }
        // }

        const data_guia_det = {
          ruc: info.ruc_,
          id_CAB_DET: id_guia,
          id_producto_DET: parseInt(value.idx_CAB_PROD),
          Cod_producto_DET: value.cod_producto,
          Cant_producto_DET: parseFloat(value.cantidad),
          Suc_Tienda: info.almacen_,
          id_subprod: value.idx
        };
        const [resultGuiaDet] = await conn.execute(
          `INSERT INTO tbl_kard_compras_DET (${Object.keys(data_guia_det).join(',')}) VALUES (${Object.keys(data_guia_det).map(() => '?').join(',')})`,
          Object.values(data_guia_det)
        );
        value.idx = value.idx;
        detalle[key].idx = value.idx;
      }

      // Preparar data_comprobante
      const data_comprobante = {
        id_comprobante_CAB: postData.id_comprobante_CAB,
        cod_comprobante: postData.cod_comprobante,
        num_comprobante: parseInt(postData.num_comprobante) + 1,
        observaciones: postData.observaciones || '',
        idx_documento_asoc: id_guia,
        origen: 'KARD',
        articulos: JSON.stringify(detalle),
      };
        // $result = json_decode($this->save_movimiento_inventario_hq($data_comprobante),true);




      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveMovimiento(){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()



      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
}