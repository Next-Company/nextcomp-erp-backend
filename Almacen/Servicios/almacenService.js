import mysql from 'mysql2/promise';
import { configs } from '../../Main/utils.js';

export default class AlmacenModel{
  static async getMovimientosAlmacen(search){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(estado),''),' ',COALESCE(TRIM(Raz_social_DOC),''),' ',COALESCE(TRIM(Nro_Doc_Prov),''))) > 0").join(" ") : ""
  
      const query_ = `
        SELECT tkc.*, tp.idx as id_proveedor_CAB, tp.nom as proveedor, tmc.cod_comprobante, tmc.anulado
        FROM tbl_kard_compras_CAB tkc
        JOIN tbl2_almacen_mov_cab tmc ON tkc.id_CAB = tmc.idx_documento_asoc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc
        WHERE Suc_Tienda in (509,508) ${extra}
        ORDER BY tkc.fecha_sys DESC
        LIMIT 50
      `;
      const query = `
        SELECT tkc.*, tp.idx as id_proveedor_CAB, tp.nom as proveedor, if(COALESCE(tkc.tipomov,0) = 0,'OTRO',if(COALESCE(tkc.tipomov,0) = 9,'INGR','RETR'))  as cod_comprobante
        FROM tbl_kard_compras_CAB tkc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc
        WHERE Suc_Tienda in (509,508) ${extra}
        ORDER BY tkc.fecha_sys DESC
        LIMIT 50
      `;
      console.log("La consulta generada es:",query)
  
      const [result] = await conn.execute(query);
      console.log("El resultado de la consulta es:", result)
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getMovimientosAlmacenById(id){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      const [cabmov] = await conn.execute(`
        SELECT tkc.*, tp.idx as id_proveedor_CAB, tp.nom as proveedor, tmc.cod_comprobante, tmc.anulado
        FROM tbl_kard_compras_CAB tkc 
        JOIN tbl2_almacen_mov_cab tmc ON tkc.id_CAB = tmc.idx_documento_asoc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc
        WHERE Suc_Tienda in (509,508) and tkc.id_CAB = ?
      `,[id]);

      const [inforeq] = await conn.execute(`
        SELECT tpic.orden_ref as nro_requerimiento,tpic.id_proveedor_CAB, tp.ruc as ruc, tp.nom as proveedor
        FROM tbl2_pedidos_insumos_cab tpic 
        JOIN tbl2_proveedor tp ON tpic.id_proveedor_CAB = tp.idx 
        WHERE tpic.idx = ?
      `,[cabmov[0].id_requerimiento]);

      const [detbmov] = await conn.execute(`
        SELECT 
          tpid.*,
          (select COALESCE(tbkd.Cant_producto_DET,0) from tbl_kard_compras_DET tbkd where tbkd.id_subprod = tpid.id_subprod_CAB and tbkd.id_CAB_DET = ?) as despacho
        from tbl2_pedidos_insumos_det tpid 
        where tpid.id_pedido_CAB = ?
        having despacho > 0
      `,[id,cabmov[0].id_requerimiento]);
  
      console.log("El resultado de la consulta es:", cabmov, detbmov)
      return [cabmov[0],inforeq[0], detbmov]
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getInventarioProductos(info,tipo){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    console.log("Dentro de la consulta de inventario")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
  
      const query = `
        SELECT 
          t1.cantidad as stock,
          t2.codigo,
          t3.nom as color,
          t3.idx as idx_color,
          t2.idx_CAB_PROD as id_producto_CAB,
          t2.idx as id_subprod_CAB,
          t2.nom as producto,
          t1.lote,
          t2.idx_talla,
          t2.estado,
          t1.tipo
        FROM tbl2_almacen_det t1 
        join tbl2_subproductos t2 on t2.idx = t1.idx_subproducto
        join tbl2_colores t3 on t3.idx = t2.idx_CAB_COLOR 
        WHERE t1.id_CAB_DET in (509,508) 
        limit 10
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

      console.log("La info recibida es:",data)
      let cabecera = JSON.parse(data.info)
      let detalle = JSON.parse(data.detalle)
      console.log("La informacion de la cebecra es:",cabecera)
      console.log("La informacion del detalle es:",detalle)

      // Obtener cod_cuenta
      const cod_cnta = 20;
      const tip_prod_cdp = 2;
      const serie_prod = 0;

      // Insertar en tbl_kard_compras_CAB
      const data_guia = {
        ruc: '20522094120',
        tip_DOC: tip_prod_cdp,
        serie_DOC: serie_prod,
        num_doc_CDP: 0,
        Nro_Doc_Prov: cabecera.ruc,
        Raz_social_DOC: cabecera.proveedor,
        Dir_DOC: '',
        Suc_Tienda: 509,
        observaciones: cabecera.observaciones,
        fec_Reg_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        fec_Emision_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        idx_usu: 0,
        tipomov: cabecera.tipo_operacion,
        id_requerimiento: parseInt(cabecera.id_pedido_origen)
      };
      console.log("El detalle a insertar es:",data_guia)
      const [resultGuia] = await conn.execute(
        `INSERT INTO tbl_kard_compras_CAB (${Object.keys(data_guia).join(',')}) VALUES (${Object.keys(data_guia).map(() => '?').join(',')})`,
        Object.values(data_guia)
      );
      const id_guia = resultGuia.insertId;

      for(let element of detalle){
        const data_guia_det = {
          ruc: '20522094120',
          id_CAB_DET: id_guia,
          id_producto_DET: parseInt(element.id_producto_CAB),
          Cod_producto_DET: '',
          Cant_producto_DET: parseFloat(element.despacho),
          Suc_Tienda: 509,
          Precio_Unid_Det: 0,
          id_subprod: parseInt(element.id_subprod_CAB)
        };
        const [resultGuiaDet] = await conn.execute(
          `INSERT INTO tbl_kard_compras_DET (${Object.keys(data_guia_det).join(',')}) VALUES (${Object.keys(data_guia_det).map(() => '?').join(',')})`,
          Object.values(data_guia_det)
        );
        // value.idx = value.idx;
        // detalle[key].idx = value.idx;
      }

      // Preparar data_comprobantE
      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera.tipo_operacion)])

      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: cabecera.observaciones,
        idx_documento_asoc: id_guia,
        lote: cabecera.id_pedido_origen,
        origen: 'KARD',
        almacen_destino: 509,
        articulos: JSON.stringify(detalle),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteGuia(id){
    console.log("Dentro del proceso de eliminacion de guia:",id)
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      let [cabecera] = await conn.execute("SELECT *FROM tbl_kard_compras_CAB WHERE id_CAB = ? and ruc = ?",[id,'20522094120'])
      let [detalle] = await conn.execute("SELECT t1.*,COALESCE((select tp.nom from tbl2_productos tp where tp.idx = t1.id_producto_DET),'') as producto FROM tbl_kard_compras_DET t1 WHERE t1.id_CAB_DET = ?",[id])

      // let [detguia] = await conn.execute("SELECT t1.*,ts.nom as producto FROM tbl_kard_compras_DET t1 join tbl2_subproductos ts on t1.id_subprod = ts.idx WHERE id_CAB_DET = ?",[id])
      // let [infomov] = await conn.execute("SELECT *FROM tbl2_almacen_mov_cab WHERE idx_documento_asoc = ?",[id])

      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera[0].tipomov) == 10 ? 9 : 10])

      let articulos = detalle.map(row=>(
        {
          id_producto_CAB:row.id_producto_DET,
          producto:row.producto,
          id_subprod_CAB:row.id_subprod,
          almacen_destino:509,
          lote:cabecera[0].id_requerimiento,
          tipo:'I',
          despacho:row.Cant_producto_DET
        }
      ))
      console.log("El listado de articulo es:",articulos)
      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: 'ANULACION DE GUIA DE TRASLADO',
        idx_documento_asoc: id,
        // lote: cabecera.id_pedido_origen,
        origen: 'KARD',
        almacen_destino: 509,
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)

      await conn.execute("UPDATE tbl_kard_compras_CAB SET estado = 'ANULADO' WHERE ruc = ? and id_CAB = ?",['20522094120',id])

      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveMovimiento(data, conn){
    console.log("Dentro de saveMovimiento:",data)
    try {

      let articulos = [];
      if (data.articulos) {
        articulos = typeof data.articulos === 'string' ? JSON.parse(data.articulos) : data.articulos;
      }
      delete data.filters;
      delete data.articulos;

      console.log("El listado de articulo es:",articulos)

      if (articulos.length > 0) {
        console.log("Inicia el proceso de movimiento de almacen!!!",articulos)

        let id;
        // Insertar cabecera de movimiento
        const data_comprobante = {
          id_comprobante_CAB: data.id_comprobante_CAB,
          cod_comprobante: data.cod_comprobante,
          num_comprobante: data.num_comprobante,
          idx_solicitud_asoc: data.idx_solicitud_asoc ?? null,
          idx_documento_asoc: data.idx_documento_asoc ?? null,
          origen: data.origen ?? null,
          observaciones: data.observaciones
        };
        const [resultCab] = await conn.execute(
          `INSERT INTO tbl2_almacen_mov_cab (${Object.keys(data_comprobante).join(',')}) VALUES (${Object.keys(data_comprobante).map(() => '?').join(',')})`,
          Object.values(data_comprobante)
        );
        id = resultCab.insertId;

        console.log("El id de la cabecera es:",id)

        switch (data.cod_comprobante) {
          case 'INGR':
            for (const value of articulos) {
              let stock = 0;
              let num_rows = 0;
              let almacen_destino = value.almacen_destino ?? 509;

              console.log("El dato a insertar es:", value)

              // Consultar stock actual en almacen
              const [consulta_deposito] = await conn.execute(
                `SELECT SUM(IF(tad.cantidad IS NULL,0,tad.cantidad)) AS cantidad
                FROM tbl2_almacen_det tad
                WHERE tad.id_cabprod = ? AND tad.id_CAB_DET = ? AND tad.tipo = 'I' AND tad.idx_subproducto = ? AND lote = ? AND tad.estado = 1`,
                [value.id_producto_CAB, almacen_destino, value.id_subprod_CAB, parseInt(value.lote)]
              );
              if (consulta_deposito.length == 0 || consulta_deposito[0].cantidad == null) {
                num_rows = 0;
              } else {
                num_rows = 1;
                stock = parseFloat(consulta_deposito[0].cantidad);
              }

              const cantidad = parseFloat(value.despacho);

              // Insertar detalle de movimiento
              const mov_detalle = {
                id_comprobante_CAB: id,
                cod_producto: '',
                id_producto_CAB: value.id_producto_CAB,
                producto: value.producto,
                idxsub: value.id_subprod_CAB,
                id_almacen_CAB: almacen_destino,
                cantidad: cantidad,
                stock: stock,
                saldo: stock + cantidad,
                tipo: 'I',
              };
              await conn.execute(
                `INSERT INTO tbl2_almacen_mov_det (${Object.keys(mov_detalle).join(',')}) VALUES (${Object.keys(mov_detalle).map(() => '?').join(',')})`,
                Object.values(mov_detalle)
              );
              console.log("Termina proceso de insertado")

              // Actualizar o insertar stock en almacen_det
              if (num_rows > 0) {
                console.log("Se actualiza el stock existente")
                let [afectados] = await conn.execute(
                  `UPDATE tbl2_almacen_det SET cantidad = ? WHERE id_cabprod = ? AND idx_subproducto = ? AND id_CAB_DET = ? AND lote = ?`,
                  [cantidad + stock, value.id_producto_CAB, value.id_subprod_CAB, almacen_destino, value.lote]
                );
                console.log("Registros afectados:",afectados.affectedRows)
              } else {
                console.log("Se inserta un nuevo registro de almacen_det")
                const data_almacen_det = {
                  id_CAB_DET: almacen_destino,
                  id_cabprod: value.id_producto_CAB,
                  idx_subproducto: value.id_subprod_CAB,
                  id_kardcomp: id,
                  codigo_cabprod: '',
                  estado: 1,
                  tipo: 'I',
                  lote: value.lote,
                  cantidad: cantidad
                };
                let query = `INSERT INTO tbl2_almacen_det (${Object.keys(data_almacen_det).join(',')}) VALUES (${Object.keys(data_almacen_det).map(() => '?').join(',')})`
                console.log("COmponentes de la consulta mysql:",query,Object.values(data_almacen_det))
                await conn.execute(query,Object.values(data_almacen_det));
              }

            }
            // Actualizar correlativo
            await conn.execute(
              `UPDATE tbl2_cptes_ordenes_tipo SET correlativo = ? WHERE codigo = ?`,
              [parseInt(data.num_comprobante), data.cod_comprobante]
            );
            
            break
          case 'RETR':

            for (const value of articulos) {
              let almacen_destino = value.almacen_destino ?? 509;

              // Consultar stock actual en almacen
              const [consulta_deposito] = await conn.execute(
                `SELECT SUM(IF(tad.cantidad IS NULL,0,tad.cantidad)) AS cantidad
                FROM tbl2_almacen_det tad
                WHERE tad.id_cabprod = ? AND tad.id_CAB_DET = ? AND tad.tipo = 'I' AND tad.idx_subproducto = ? AND lote = ? AND tad.estado = 1`,
                [value.id_producto_CAB, almacen_destino, value.id_subprod_CAB, parseInt(value.lote)]
              );
              console.log("El resultado de la consulta es:",consulta_deposito)
              const stockActual = parseFloat(consulta_deposito[0]?.cantidad ?? 0);

              if (stockActual.toFixed(2) < parseFloat(value.despacho).toFixed(2)) {
                throw new Error("Stock insuficiente, por favor verifique.")
              }

              // Actualizar stock en almacen_det
              console.log("Se actualiza el stock existente")
              await conn.execute(
                `UPDATE tbl2_almacen_det SET cantidad = ? WHERE id_cabprod = ? AND idx_subproducto = ? AND id_CAB_DET = ? AND lote = ?`,
                [stockActual.toFixed(2) - parseFloat(value.despacho).toFixed(2), value.id_producto_CAB, value.id_subprod_CAB, almacen_destino, value.lote]
              );

              // Insertar detalle de movimiento
              console.log("Se inserta un nuevo registro de movimiento")
              const mov_detalle = {
                id_comprobante_CAB: id,
                cod_producto: '',
                id_producto_CAB: value.id_producto_CAB,
                producto: value.producto,
                id_almacen_CAB: almacen_destino,
                cantidad: parseFloat(value.despacho),
                stock: stockActual,
                saldo: stockActual.toFixed(2) - parseFloat(value.despacho).toFixed(2),
                tipo: 'I',
                idxsub: value.id_subprod_CAB
              };
              console.log("El detalle a insertar es:",mov_detalle)
              await conn.execute(
                `INSERT INTO tbl2_almacen_mov_det (${Object.keys(mov_detalle).join(',')}) VALUES (${Object.keys(mov_detalle).map(() => '?').join(',')})`,
                Object.values(mov_detalle)
              );

            }
            // Actualizar correlativo
            await conn.execute(
              `UPDATE tbl2_cptes_ordenes_tipo SET correlativo = ? WHERE codigo = ?`,
              [parseInt(data.num_comprobante), data.cod_comprobante]
            );

            break
          default :
            break
        }
        // if (!data.idx || data.idx === '') {
        // }
      } else {
        // ok = false;
        // message = "Se detecto un problema con la información relacionada al detalle del comprobante. Vuelva a intentarlo nuevamente.";
      }

      // Si hubo error, hacer rollback
      // if (!ok) {
      //   if (conn) await conn.rollback();
      //   throw new Error(message);
      // } else {
      //   if (conn) await conn.commit();
      // }

      // if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      // if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    }
  }
  static async getDisponibilidadRequerimiento(idreq){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [cabreq] = await conn.query(`SELECT DATE_FORMAT(tpic.fec_emision,"%d/%m/%Y") as fec_emision_cuadre,DATE_FORMAT(tpic.fec_retorno,"%d/%m/%Y") as fec_retorno_cuadre,DATEDIFF(STR_TO_DATE(tpic.fec_retorno,"%Y-%m-%d"), STR_TO_DATE(tpic.fec_emision,"%Y-%m-%d")) as duracion,tp.ruc as ruc,
      COALESCE((select GROUP_CONCAT(oc,'-') from tbl2_fases_prod_ordenes tpo where tpo.id_pedido_origen = tpic.idx),'-') as oc,
      COALESCE((
        select GROUP_CONCAT(t1.numero_corte,'-') from tbl2_fases_prod_hojacorte t1 
        join tbl2_fases_prod_ordenes t2 on t1.id_cab_orden = t2.idx
        where t2.id_pedido_origen  = tpic.idx
      ),'-') as nro_corte,tpic.* 
      FROM tbl2_pedidos_insumos_cab tpic join tbl2_proveedor tp on tpic.id_proveedor_CAB = tp.idx where tpic.idx = ?`, [idreq]);

      const [detreq] = await conn.query(`
        SELECT 
          t1.*,
          COALESCE((
            select sum(tbdd.despacho) from tbl2_despachos_cab tbdc
            join tbl2_despachos_det tbdd on tbdc.idx = tbdd.id_despacho_CAB
            where tbdc.id_pedido_origen = t1.id_pedido_CAB and tbdd.id_item = t1.idx
          ),0) as ingresos,
          COALESCE((select sum(COALESCE(cantidad,0)) 
          from tbl2_almacen_det tbad
          where tbad.idx_subproducto = t1.id_subprod_CAB and tbad.lote = t1.id_pedido_CAB)
          ,0) as stock
        FROM tbl2_pedidos_insumos_det t1 
        WHERE t1.id_pedido_CAB = ?
      `, [idreq]);

      return {ok:true,info:[cabreq[0], detreq]};
    } catch (err) {
      console.log(err)
      return {ok: false, message: err.message ?? err};
    } finally {
      if (conn) await conn.end()
    }
  }
}