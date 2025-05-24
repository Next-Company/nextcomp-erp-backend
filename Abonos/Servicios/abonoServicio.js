import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
import { OtherTarget } from 'puppeteer-core'
import { count } from 'node:console'
export default class AbonoServicio{
  static async getAbonosList(limit){
    console.log("Dentro de la busqueda de abonos")
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      const [cabecera] = await conn.execute(`
        SELECT IF(ISNULL(tc.id_servicio_CAB),tpic.idx,tgtc.idx) as idref,IF(ISNULL(tc.id_servicio_CAB),tpic.proveedor,tgtc.proveedor) as proveedor,ta.* 
        FROM tbl2_abonos ta 
        JOIN tbl2_conciliaciones tc on ta.idx = tc.id_abono_CAB 
        LEFT JOIN tbl2_guias_traslado_cab tgtc on tc.id_servicio_CAB = tgtc.idx
        LEFT JOIN tbl2_pedidos_insumos_cab tpic on tc.id_pedido_CAB = tpic.idx
        WHERE ta.tipo in ('SERV','PRES','CRED') and ta.ruc_ = '20522094120' 
        ORDER BY ta.idx DESC
      `, [limit])
      await conn.end()
      return cabecera
    } catch (error) {
      
    } finally {
      if(conn) conn.end()
    }
  }
  static async getServiciosStatus(search){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      // let [rows] = await conn.execute(`
      //   SELECT resumen.id_guia as idx,resumen.servicio,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo,SUM(resumen.cantidad) as cantidad,
      //   SUM(resumen.despacho) as despacho,sum(resumen.total) as importe,
      //   (
      //     SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
      //     JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
      //     WHERE resumen.id_guia = tc.id_servicio_CAB
      //   ) as cancelado
      //   FROM
      //   (
      //     SELECT tgtc.idx as id_guia,tgtc.servicio,COALESCE(tgtc.proveedor,'') as proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,IF(COALESCE(tpid.isprototipo),0,tpid.cantidad) as cantidad,tgtc.costo,GROUP_CONCAT(dp.nro_guia) as id_despacho,SUM(COALESCE(IF(COALESCE(tpid.isprototipo),0,dp.despacho),0)-COALESCE(dp.caidos,0)) as despacho,SUM(IF(COALESCE(tpid.isprototipo,0) = 1,0,tgtc.costo*(COALESCE(dp.despacho,0)-COALESCE(dp.caidos,0)))) as total
      //     FROM tbl2_guias_traslado_det tpid 
      //     JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
      //     LEFT JOIN(
      //       SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
      //       FROM tbl2_despachos_cab tdc 
      //       LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      //     ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
      //     WHERE tgtc.costo > 0 and tgtc.tipo = 'SERVICIOS' and tgtc.servicio <> 'ACABADOS'
      //     GROUP BY tgtc.idx,tgtc.servicio,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo
      //   ) as resumen
      //   GROUP BY resumen.id_guia,resumen.servicio,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo
      // `, [limit])
      console.log("Buscando por dato envaido del frontent ",search)
      const busqueda = search.length > 0 ? search.split(" ").map(item=>`AND LOCATE('${item}',CONCAT(TRIM(COALESCE(ruc,'')),TRIM(COALESCE(proveedor,'')))) > 0`).join(" ") : ""


      console.log("Busqueda de servicios, filtro",busqueda)

      let [rows] = await conn.execute(`
        SELECT
          resumen.id_proveedor as idx,resumen.ruc,resumen.proveedor,sum(COALESCE(resumen.cantidad,0)) as cantidad,sum(COALESCE(resumen.despacho,0)) as despacho,sum(COALESCE(resumen.cancelado,0)) as cancelado,sum(COALESCE(resumen.importe,0)) as importe
        FROM
        (
          SELECT resumen.id_guia as idx,resumen.id_proveedor,resumen.servicio,resumen.ruc,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo,SUM(resumen.cantidad) as cantidad,
            SUM(resumen.despacho) as despacho,sum(resumen.total) as importe,
            (
              SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
              JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
              WHERE resumen.id_guia = tc.id_servicio_CAB
            ) as cancelado
            FROM
            (
              SELECT tgtc.idx as id_guia,tp.idx as id_proveedor,tgtc.servicio,COALESCE(tp.ruc,'') as ruc,COALESCE(tgtc.proveedor,'OTROS') as proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,IF(COALESCE(tpid.isprototipo),0,tpid.cantidad) as cantidad,tgtc.costo,GROUP_CONCAT(dp.nro_guia) as id_despacho,SUM(COALESCE(IF(COALESCE(tpid.isprototipo),0,dp.despacho),0)-COALESCE(dp.caidos,0)) as despacho,SUM(IF(COALESCE(tpid.isprototipo,0) = 1,0,tgtc.costo*(COALESCE(dp.despacho,0)-COALESCE(dp.caidos,0)))) as total
              FROM tbl2_guias_traslado_det tpid 
              JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
              LEFT JOIN tbl2_proveedor tp on tp.idx = tgtc.id_proveedor_CAB
              LEFT JOIN(
                SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
                FROM tbl2_despachos_cab tdc 
                LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
              ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
              WHERE tgtc.costo > 0 and tgtc.tipo = 'SERVICIOS' and tgtc.servicio <> 'ACABADOS'
              GROUP BY tgtc.idx,tp.idx,tgtc.servicio,tp.ruc,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo
            ) as resumen
            GROUP BY resumen.id_guia,resumen.id_proveedor,resumen.servicio,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo
        ) as resumen
        WHERE 1=1 ${busqueda}
        GROUP BY resumen.ruc,resumen.id_proveedor,resumen.proveedor
      `)
      await conn.end()
      return rows
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getLetrasStatus(){
      let conn = undefined
      try {
        conn = await mysql2.createConnection(configs[1])
        await conn.connect()
        // let [result] = await conn.query(`SELECT tlc.*,COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_letras_cab tlc WHERE 1=1 ORDER BY tlc.idx DESC LIMIT 100`)
        let [result] = await conn.query(`
          SELECT tlc.idx,tlc.id_proveedor_CAB,tlc.proveedor,tlc.documentos_ref,tlc.num_letra,tlc.moneda,DATE_FORMAT(tlc.fec_emision,'%d/%m/%Y') as fec_emision,DATE_FORMAT(tlc.fec_vencimiento,'%d/%m/%Y') as fec_vencimiento,
          tlc.importe,tlc.estado,tlc.observaciones,
          COALESCE(DATEDIFF(STR_TO_DATE(tlc.fec_vencimiento,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
          COALESCE(GROUP_CONCAT(CONCAT(CASE WHEN tda.tipodoc = 1 THEN 'FT' WHEN tda.tipodoc = 2 THEN 'NC' ELSE 'ND' END,tda.serie,tda.numero)),'') as facturas_ref,
          (
            SELECT COALESCE(sum(COALESCE(importe,0)),0) as cancelado FROM tbl2_conciliaciones tc  
            JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
            WHERE tlc.idx = tc.id_letra_CAB
          ) as cancelado
          FROM tbl2_letras_cab tlc 
          LEFT JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
          LEFT JOIN tbl2_despachos_cab tdc on tdc.id_pedido_origen =  tla.id_pedido_CAB
          LEFT JOIN tbl2_despachos_adi tda on tda.id_despacho_CAB = tdc.idx
          WHERE 1=1 
          group by tlc.idx,tlc.id_proveedor_CAB,tlc.proveedor,tlc.documentos_ref,tlc.num_letra,tlc.moneda,tlc.fec_emision,tlc.fec_vencimiento,tlc.importe,tlc.estado,tlc.observaciones
          ORDER BY tlc.idx DESC
          LIMIT 100
          `)
        // console.log(result)
  
        // await conn.end()
        return result 
      } catch (error) {
        console.log(error)
      } finally {
        if(conn) await conn.end()
        // return 0
      }
    }
  static async getAbono(idabono){
    let conn
    try {
      console.log("Llegando a getAbonao",idabono)
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      let infodet = undefined
      let [infocab] = await conn.execute(`
        SELECT ta.*,tc.id_servicio_CAB,tc.id_pedido_CAB,tp.idx as id_proveedor_CAB,tp.nom as proveedor 
        FROM tbl2_abonos ta 
        JOIN tbl2_conciliaciones tc on tc.id_abono_CAB = ta.idx
        LEFT JOIN tbl2_proveedor tp on tp.idx = ta.id_proveedor where ta.ruc_ = '20522094120' and ta.idx = ?`, [idabono])
      console.log("Informacion cabecera:",infocab)
      if(infocab[0].tipo == 'SERV'){

        // [infodet] = await conn.execute(`
        //   select tc.idx,tgtc.orden_ref,tgtc.idx as id_servicio,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo,sum(tgtd.cantidad*tgtc.costo) as importe 
        //   from tbl2_conciliaciones tc 
        //   join tbl2_guias_traslado_cab tgtc on tgtc.idx = tc.id_servicio_CAB 
        //   join tbl2_guias_traslado_det tgtd on tgtd.id_guia_CAB = tgtc.idx
        //   where tc.id_abono_CAB = ?
        //   group by tc.idx,tgtc.orden_ref,tgtc.idx,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo
        //   `, [idabono])

          // const [cabecera,fields] = await conn.query(`SELECT sum(importe) as cancelado FROM tbl2_guias_traslado_cab tgtc JOIN tbl2_conciliaciones tc ON tgtc.idx = tc.id_servicio_CAB JOIN tbl2_abonos ta ON ta.idx = tc.id_abono_CAB WHERE tgtc.idx = ?`,[idguia])

        [infodet] = await conn.query(`
          SELECT tgtc.idx as id_guia,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,tpid.cantidad,tgtc.costo,COALESCE(tpid.isprototipo,0) as isprototipo,GROUP_CONCAT(dp.nro_guia) as id_despacho,sum(COALESCE(dp.despacho,0)) as despacho,sum(COALESCE(dp.caidos,0)) as caidos,
          (
            SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
            JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
            WHERE tgtc.idx = tc.id_servicio_CAB
          ) as cancelado
          FROM tbl2_guias_traslado_det tpid 
          JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
          JOIN(
            SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
            FROM tbl2_despachos_cab tdc 
            LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
          ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
          WHERE tgtc.estado <> 'FINALIZADO' and tgtc.idx = ?
          GROUP BY tgtc.idx,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo,tpid.isprototipo
        `,[infocab[0].id_servicio_CAB])



      }else{
        // let [infodet] = await conn.execute(`select *from tbl2_conciliaciones tc join tbl2_guias_traslado_cab tgtc on tgtc.idx = tc.id_servicio_CAB where tc.id_abono_CAB = ?`, [idabono])
      }
      console.log("INformacion total:",[infocab[0],infodet])

      await conn.end()
      return [infocab[0],infodet]
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getAbonoByServicio(idservicio){
    let conn
    try {
      console.log("Llegando a getAbonao",idservicio)
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      let [infodet] = await conn.execute(`SELECT tgtc.idx,tgtc.servicio,tgtc.producto,ta.* FROM tbl2_abonos ta JOIN tbl2_conciliaciones tc on ta.idx = tc.id_abono_CAB 
        JOIN tbl2_guias_traslado_cab tgtc on tc.id_servicio_CAB = tgtc.idx WHERE tgtc.idx = ?`, [idservicio])
      await conn.end()
      return infodet
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getSaldosServicios(idproveedor){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      let [rows] = await conn.execute(`SELECT tgtc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo,sum(tgtd.cantidad*tgtc.costo) as importe,0 as saldo from tbl2_guias_traslado_cab tgtc 
      JOIN tbl2_guias_traslado_det tgtd ON tgtc.idx = tgtd.id_guia_CAB 
      WHERE tgtc.id_proveedor_CAB = ? GROUP BY tgtc.idx,tgtc.orden_ref,tgtc.servicio,tgtc.producto,tgtc.modelo,tgtc.marca,tgtc.costo`,[idproveedor])
      await conn.end()
      return rows
    } catch (error) {
      console.log(error)   
    } finally {
      if(conn) conn
    }
  }
  static async saveAbonoServicio(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      if(data.id){
        console.log("Actualizando nuevo abono a servicio")
        await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion,parseInt(data.id)])

      }else{     
        console.log("Insertando nuevo a bonno")  
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.pago,cabecera.tipo,cabecera.tipo_operacion])

          const [results] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_servicio_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',articulos[0].id_guia,res.insertId]);

          ///////////////////////////////////////////////
          //// GENERANDO MOVIMIENTOS DE CAJA POR EGRESO
          //////////////////////////////////////////////
          let [infocaja] = await conn.query(`SELECT *FROM tbl2_caja tc JOIN tbl2_caja_movimientos_cab tcmc ON tc.idx = tcmc.id_caja_CAB WHERE tc.id_cuenta_corriente = ? AND tc.ruc_ = ? and tcmc.fec_operacion = ?`,[cabecera.id_cuenta_CAB,'20522094120',cabecera.fec_pago])
          if(infocaja.length > 0){

            let data_mov_caja = {
              id_cuenta_CAB:cabecera.id_cuenta_CAB,
              fec_pago:cabecera.fec_pago,
              usuario:18,
              sucursal:390,
              detalle_mov:cabecera.tipo == 'SERV' ? 'ABONO POR SERVICIO' : 'ABONO OTRO',
              doc_cliente:'0000000000',
              nom_cliente:cabecera.entidad_bancaria,
              tipdoc_ref:'CP',
              serie:'000',
              numero:'00000',
              documento_ref:cabecera.num_operacion,
              vta_no_gra:cabecera.pago*-1,
              vta_gra:'0',
              tot_igv:'0',
              no_gravado:'0',
              pago:cabecera.pago,
              idabono:res.insertId,
            }
            let result_mov_caja = await this.saveMovimientoCaja('EGRE', data_mov_caja)
          }else{
            throw new Error("No se dectecto un movimiento de caja para la fecha seleccionada")
          }
          //////////////////////////////////////////////
          //////////////////////////////////////////////

        }catch(err){
          console.log("error en la consulta",err)
        }
      }

      // await conn.end();
      // conn.rollback()
      conn.commit()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      conn.rollback()
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveAbonoLetra(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      if(data.id){
        console.log("Actualizando cabecera")
        await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion,parseInt(data.id)])

      }else{     
        console.log("Insertando cabecera")   
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.pago,cabecera.tipo,cabecera.tipo_operacion])

          const [results] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_letra_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.idletra,res.insertId]);

        }catch(err){
          console.log("error en la consulta",err)
        }
      }
      console.log("Terminando consultas")
      // await conn.end()
      return {ok:true,message:'Se ha guardado el registros'}

    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) {
        console.log(err)
        conn.rollback()
        await conn.end();
      }
      return [err]
    } finally {
      if (conn) {
        conn.commit()
        // conn.rollback()
        await conn.end();
      }
    }
  }
  static async saveAbonoPrestamo(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      if(data.id){
        console.log("Actualizando cabecera,data.id")
        await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion,parseInt(data.id)])

      }else{     
        console.log("Insertando cabecera nuevo abono")
        const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.pago,cabecera.tipo,cabecera.tipo_operacion])

        const [results] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_prestamo_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',articulos[0].idx,res.insertId]);

        if(parseFloat(articulos[0].monto_cuota) == parseFloat(cabecera.pago)){
          console.log("Realizando la actualizacion del estado de la cuota a cancelado")
          await conn.query("UPDATE tbl2_prestamos_det tb1 SET tb1.estado_cuota = 'Pagada' where tb1.id_prestamo_CAB = ? and tb1.idx = ?",[articulos[0].id_prestamo_CAB,articulos[0].idx])
        }
        // try{
        // }catch(err){
        //   console.log("error en la consulta",err)
        // }

        ///////////////////////////////////////////////
        //// GENERANDO MOVIMIENTOS DE CAJA POR EGRESO
        //////////////////////////////////////////////

        console.log("Generando movimiento de caja :",cabecera.id_cuenta_CAB,cabecera.fec_pago)
        let [infocaja] = await conn.query(`SELECT *FROM tbl2_caja tc JOIN tbl2_caja_movimientos_cab tcmc ON tc.idx = tcmc.id_caja_CAB WHERE tc.id_cuenta_corriente = ? AND tc.ruc_ = ? and tcmc.fec_operacion = ?`,[cabecera.id_cuenta_CAB,'20522094120',cabecera.fec_pago])
        if(infocaja.length > 0){

          let data_mov_caja = {
            id_cuenta_CAB:cabecera.id_cuenta_CAB,
            fec_pago:cabecera.fec_pago,
            usuario:18,
            sucursal:390,
            detalle_mov:cabecera.tipo == 'PRES' ? 'ABONO DE CUOTA POR PRESTAMO' : 'ABONO OTRO',
            doc_cliente:'0000000000',
            nom_cliente:cabecera.entidad_bancaria,
            tipdoc_ref:'CP',
            serie:'000',
            numero:'00000',
            documento_ref:cabecera.num_operacion,
            vta_no_gra:cabecera.pago*-1,
            vta_gra:'0',
            tot_igv:'0',
            no_gravado:'0',
            pago:cabecera.pago,
            idabono:res.insertId,
          }


          let result_mov_caja = await this.saveMovimientoCaja('EGRE', data_mov_caja)
        }else{
          throw new Error("No se dectecto un movimiento de caja para la fecha seleccionada")
        }
        //////////////////////////////////////////////
        //////////////////////////////////////////////


      }
      // conn.commit()
      conn.rollback()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion pedro palotes",err)
      if (conn) conn.rollback()
      return {ok:false,message:'Se produjo el siguiente error :' + err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async deleteAbonoServicio(idabono){
    let conn
    let resp
    try {
      console.log("Comienza la eliminacion de la cuota del prestamo")
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      await conn.query('DELETE FROM tbl2_abonos WHERE idx = ?',[idabono])
      await conn.query(`DELETE FROM tbl2_conciliaciones WHERE ruc_ = ? and id_abono_CAB = ?`,['20522094120',idabono])

      conn.commit()
      // conn.rollback()
      resp = {ok:true,message:'Se ha eliminado el registro'}
    } catch (error) {
      resp = error
      if(conn) conn.rollback()
    } finally {
      if(conn) conn.end()
      return resp

    }
  }
  static async deleteAbonoLetra(idabono){
    let conn
    let resp
    try {
      console.log("Comienza la eliminacion de la cuota del prestamo")
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      await conn.query('DELETE FROM tbl2_abonos WHERE idx = ?',[idabono])
      await conn.query(`DELETE FROM tbl2_conciliaciones WHERE ruc_ = ? and id_abono_CAB = ?`,['20522094120',idabono])

      conn.commit()
      // conn.rollback()
      resp = {ok:true,message:'Se ha eliminado el registro'}
    } catch (error) {
      resp = error
      if(conn) conn.rollback()
    } finally {
      if(conn) conn.end()
      return resp

    }
  }
  static async deleteAbonoPrestamo(idabono){
    let conn
    let resp
    try {
      console.log("Comienza la eliminacion de la cuota del prestamo")
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      await conn.query(`UPDATE tbl2_prestamos_det JOIN tbl2_conciliaciones on tbl2_prestamos_det.idx = tbl2_conciliaciones.id_prestamo_CAB
      set tbl2_prestamos_det.estado_cuota = 'Pendiente'
      WHERE tbl2_conciliaciones.id_abono_CAB = ?`,[idabono])

      await conn.query(`DELETE FROM tbl2_caja_movimientos_det WHERE id_abono_ref = ?`,[idabono])
      await conn.query('DELETE FROM tbl2_abonos WHERE idx = ?',[idabono])
      await conn.query(`DELETE FROM tbl2_conciliaciones WHERE ruc_ = ? and id_abono_CAB = ?`,['20522094120',idabono])

      conn.commit()
      // conn.rollback()
      resp = {ok:true,message:'Se ha eliminado el registro'}
    } catch (error) {
      resp = error
      if(conn) conn.rollback()
    } finally {
      if(conn) conn.end()
      return resp

    }
  }
  static async getServiciosStatusDetalle(idguia){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      const [cabecera,fields] = await conn.query(`SELECT sum(importe) as cancelado FROM tbl2_guias_traslado_cab tgtc JOIN tbl2_conciliaciones tc ON tgtc.idx = tc.id_servicio_CAB JOIN tbl2_abonos ta ON ta.idx = tc.id_abono_CAB WHERE tgtc.idx = ?`,[idguia])

      const [resultado] = await conn.query(`
        SELECT tgtc.idx as id_guia,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,tpid.cantidad,tgtc.costo,COALESCE(tpid.isprototipo,0) as isprototipo,GROUP_CONCAT(dp.nro_guia) as id_despacho,sum(COALESCE(dp.despacho,0)) as despacho,sum(COALESCE(dp.caidos,0)) as caidos,
        (
          SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
          JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
          WHERE tgtc.idx = tc.id_servicio_CAB
        ) as cancelado
        FROM tbl2_guias_traslado_det tpid 
        JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
        JOIN(
          SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
          FROM tbl2_despachos_cab tdc 
          LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
        WHERE tgtc.idx = ?
        GROUP BY tgtc.idx,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo,tpid.isprototipo
      `,[idguia])
      // const [resultado] = await conn.query(`
      //   SELECT tgtc.idx as id_guia,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,tpid.cantidad,tgtc.costo,COALESCE(tpid.isprototipo,0) as isprototipo,GROUP_CONCAT(dp.nro_guia) as id_despacho,sum(COALESCE(dp.despacho,0)) as despacho,sum(COALESCE(dp.caidos,0)) as caidos,
      //   (
      //     SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
      //     JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
      //     WHERE tgtc.idx = tc.id_servicio_CAB
      //   ) as cancelado
      //   FROM tbl2_guias_traslado_det tpid 
      //   JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
      //   JOIN(
      //     SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
      //     FROM tbl2_despachos_cab tdc 
      //     LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      //   ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
      //   WHERE tgtc.estado <> 'FINALIZADO' and tgtc.idx = ?
      //   GROUP BY tgtc.idx,tgtc.servicio,tgtc.id_proveedor_CAB,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo,tpid.isprototipo
      // `,[idguia])

      await conn.end()
      return resultado
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getProveedorServiciosStatusDetalle(idproveedor){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      const [cabecera,fields] = await conn.query(`SELECT sum(importe) as cancelado FROM tbl2_guias_traslado_cab tgtc JOIN tbl2_conciliaciones tc ON tgtc.idx = tc.id_servicio_CAB JOIN tbl2_abonos ta ON ta.idx = tc.id_abono_CAB WHERE tgtc.idx = ?`,[idproveedor])

      let [resultado] = await conn.execute(`
        SELECT resumen.id_guia as idx,resumen.servicio,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo,SUM(resumen.cantidad) as cantidad,
        SUM(resumen.despacho) as despacho,sum(resumen.total) as importe,
        (
          SELECT sum(importe) as cancelado FROM tbl2_conciliaciones tc  
          JOIN tbl2_abonos ta on ta.idx = tc.id_abono_CAB 
          WHERE resumen.id_guia = tc.id_servicio_CAB
        ) as cancelado
        FROM
        (
          SELECT tgtc.idx as id_guia,tgtc.servicio,COALESCE(tgtc.proveedor,'') as proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,'' as color,IF(COALESCE(tpid.isprototipo),0,tpid.cantidad) as cantidad,tgtc.costo,GROUP_CONCAT(dp.nro_guia) as id_despacho,SUM(COALESCE(IF(COALESCE(tpid.isprototipo),0,dp.despacho),0)-COALESCE(dp.caidos,0)) as despacho,SUM(IF(COALESCE(tpid.isprototipo,0) = 1,0,tgtc.costo*(COALESCE(dp.despacho,0)-COALESCE(dp.caidos,0)))) as total
          FROM tbl2_guias_traslado_det tpid 
          JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
          LEFT JOIN(
            SELECT tdc.id_guia_origen,tdc.nro_guia,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho,tdd.caidos
            FROM tbl2_despachos_cab tdc 
            LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
          ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
          WHERE tgtc.costo > 0 and tgtc.tipo = 'SERVICIOS' and tgtc.servicio <> 'ACABADOS' and tgtc.id_proveedor_CAB = ?
          GROUP BY tgtc.idx,tgtc.servicio,tgtc.proveedor,tgtc.producto,tgtc.marca,tgtc.modelo,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo
        ) as resumen
        GROUP BY resumen.id_guia,resumen.servicio,resumen.proveedor,resumen.producto,resumen.marca,resumen.modelo,resumen.costo
      `, [idproveedor])


      await conn.end()
      return resultado
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getLetrasStatusDetalle(idletra){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      console.log("EL id de la letra es: ",idletra)
      
      const [resultado, fields] = await conn.query(`
        SELECT tlc.importe,tla.idx,tb1.idx as idpedido,tb1.orden_ref,tb1.tipo,tb1.proveedor,tb1.fec_emision,tb1.fec_retorno,COALESCE(DATEDIFF(tb1.fec_retorno,tb1.fec_emision),'') as tiempo_produccion,tlc.idx as idletra,
        COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,tb1.forma_pago,tb1.estado,
        (
          SELECT SUM(COALESCE(cantidad,0)) FROM tbl2_pedidos_insumos_det tpid 
          WHERE tpid.id_pedido_CAB = tb1.idx
        ) as cantidad,
        (
          SELECT COALESCE(sum(despacho),0) as despacho FROM tbl2_despachos_cab tdc
          JOIN tbl2_despachos_det tdd ON tdc.idx = tdd.id_despacho_CAB
          WHERE tdc.id_pedido_origen = tb1.idx
        ) as despacho,
        ( 
          select COALESCE(SUM(COALESCE(importe_total,0)),0) FROM tbl2_despachos_cab tdc
          JOIN tbl2_despachos_adi tda ON tda.id_despacho_CAB = tdc.idx
          where tdc.id_pedido_origen = tb1.idx 
        ) as importe_despacho,
        (
          SELECT COALESCE(SUM(COALESCE(ta.importe,0)),0) FROM tbl2_conciliaciones tc
          JOIN tbl2_abonos ta ON tc.id_abono_CAB = ta.idx
          WHERE tc.id_letra_CAB = tla.idx  
        ) as cancelado
        FROM tbl2_pedidos_insumos_cab tb1
        JOIN tbl2_letras_adi tla ON tla.id_pedido_CAB = tb1.idx
        JOIN tbl2_letras_cab tlc ON tlc.idx = tla.id_letra_CAB
        WHERE tla.id_letra_CAB = ?
        `,[idletra]);

      console.log("Resultado lestras status detalle:",resultado)

      await conn.end()
      return resultado
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getPrestamoStatusDetalle(idprestamo){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      
      const [resultado, fields] = await conn.query(`
        SELECT 
        tpd.*,
        (
          SELECT COALESCE(sum(ta.importe),0) FROM tbl2_abonos ta 
          JOIN tbl2_conciliaciones tc ON ta.idx = tc.id_abono_CAB
          WHERE tc.id_prestamo_CAB = tpd.idx
        ) as abono
        FROM tbl2_prestamos_cab tb1
        JOIN tbl2_prestamos_det tpd on tb1.idx = tpd.id_prestamo_CAB 
        WHERE tb1.idx = ? and tpd.estado_cuota <> ?
        `,[idprestamo,'Pagada']);

      console.log("Resultado lestras status detalle:",resultado)
      await conn.end()
      return resultado
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) conn.end()
    }
  }
  static async getCuentasList(search = ''){
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      const busqueda = search.length > 0 ? search.split(" ").map(item=>`AND LOCATE('${item}',CONCAT(TRIM(COALESCE(nom,'')),TRIM(COALESCE(tipo,'')),TRIM(COALESCE(nro_cuenta,'')))) > 0`).join(" ") : ""
      const [cabecera] = await conn.execute(`SELECT *FROM tbl2_cuentas_bancos WHERE 1=1 ${busqueda}`)
      await conn.end()
      return cabecera
    } catch (error) {
      
    } finally {
      if(conn) conn.end()
    }
  }
  static async saveMovimientoCaja(tipo,data){
    let conn
    console.log("Informacion movimiento de caja:",data)
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()

      try {
        /////////////////////////////////////////////////////////////////////////////
        // Verificamos el estap de ultima caja anterior a la fechad preoceso
        // en caso de que este abierta se proede con su cirrere y la obtencion del saldo final
        ///////////////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion A del registro de movimiento de caja")

        let monto = 0;
        let movcaja_anterior = await conn.query(`SELECT *from tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja tc on tc.idx = tcmc.id_caja_CAB WHERE tc.ruc_ = '20522094120' AND tcmc.fec_operacion < ? AND tc.id_cuenta_corriente = ? ORDER BY tcmc.idx DESC LIMIT 1`,[data.fec_pago,parseInt(data.id_cuenta_CAB)])

        if (movcaja_anterior.length > 0) monto = parseFloat(movcaja_anterior[0].saldo_final);


        ///////////////////////////////////////////////////////////////////////////////
        // Verificamos si existe la caja para la fecha de ejecucion actual del abono
        // en caso de que no existiea se precede con su creacion
        ////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion B del registro de movimiento de caja")

        let idcajamov_cab = null
        let [info_caja] = await conn.query("SELECT *FROM tbl2_caja WHERE id_cuenta_corriente = ? LIMIT 1",[parseInt(data.id_cuenta_CAB)])
        let [busqueda_movcaja] = await conn.query(`SELECT tcmc.* FROM tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja tc on tc.idx = tcmc.id_caja_CAB WHERE tc.ruc_ = '20522094120' AND tcmc.fec_operacion = ? AND tc.id_cuenta_corriente = ?`,[data.fec_pago,parseInt(data.id_cuenta_CAB)])

        console.log("El resultado de la busqueda de la caja es:",info_caja, busqueda_movcaja)
        
        if(!(busqueda_movcaja.length > 0)){
          console.log("Dentro de generacon caja movimiento cabecera 1")
          let [insertcaja] = await conn.query(`INSERT INTO tbl2_caja_movimientos_cab(id_caja_CAB,ruc_,fec_operacion,saldo_inicial,ingresos,egresos,saldo_final,referencia,usuario,sucursal) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))`,[info_caja[0].idx,'20522094120',data.fec_pago,monto,0,0,0,'MOV CAJA AL' + data.fec_pago,'NEXT',390])
          idcajamov_cab = insertcaja.insertId
        } else{
          console.log("Dentro de generacion caja movimiento cabecera 2",busqueda_movcaja[0])
          idcajamov_cab = busqueda_movcaja[0].idx
        }

        ////////////////////////////////////////////////////////////////
        // Se precede con el registro del movimietno de caja en realcion
        // al abono realizado
        ////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion C del registro de movimiento de caja")

        let ingresos = 0;
        let egresos = 0;
        if(tipo == 'EGRE'){
          egresos = parseFloat(data.pago)*-1 + (busqueda_movcaja.length > 0 ? parseFloat(busqueda_movcaja[0].egresos) : 0)
          // egresos = parseFloat(data.pago)*-1
        } else if(tipo == 'INGR'){
          ingresos = parseFloat(data.pago) + (busqueda_movcaja.length > 0 ? parseFloat(busqueda_movcaja[0].ingresos) : 0)
          // ingresos = parseFloat(data.pago)
        }
        console.log("El valor de los ingresos es:",ingresos)
        console.log("El valor de los egresos es:",egresos)

        await conn.query(`INSERT INTO tbl2_caja_movimientos_det(ruc_,id_cajamov_CAB,fec_operacion,monto,usuario,sucursal,detalle_mov,doc_cliente,nom_cliente,tipdoc_ref,serie,numero,documento_ref,vta_no_gra,vta_gra,tot_igv,no_gravado,id_abono_ref) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))`,['20522094120',idcajamov_cab,data.fec_pago,parseFloat(data.pago)*-1,data.usuario,data.sucursal,data.detalle_mov,data.doc_cliente,data.nom_cliente,data.tipdoc_ref,data.serie,data.numero,data.documento_ref,data.vta_no_gra,data.vta_gra,data.tot_igv,data.no_gravado,data.idabono])  

        await conn.query("UPDATE tbl2_caja_movimientos_cab SET ingresos = ?, egresos = ? WHERE ruc_ = ? and id_caja_cab = ?",[ingresos,egresos,'20522094120',idcajamov_cab])

      } catch (error) {
        console.log("Se produjo un error durane el registro del movimiento de caja",error)
      }

      conn.commit()
      // conn.rollback()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) conn.rollback()
      return {ok:false,message:'Se produjo el siguiente error :' + err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async deleteMovimientoCaja(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      if(data.id){
        console.log("Actualizando cabecera")
        // await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo,cabecera.tipo_operacion,parseInt(data.id)])

      }else{     
        console.log("Insertando cabecera nuevo abono")
        try{
          // const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.pago,cabecera.tipo,cabecera.tipo_operacion])

          // const [results] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_prestamo_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',articulos[0].idx,res.insertId]);

          // if(parseFloat(articulos[0].monto_cuota) == parseFloat(cabecera.pago)){
          //   console.log("Realizando la actualizacion del estado de la cuota a cancelado")
          //   await conn.query("UPDATE tbl2_prestamos_det tb1 SET tb1.estado_cuota = 'Pagada' where tb1.id_prestamo_CAB = ? and tb1.idx = ?",[articulos[0].id_prestamo_CAB,articulos[0].idx])
          // }
        }catch(err){
          console.log("error en la consulta",err)
        }
      }
      conn.commit()
      // conn.rollback()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) conn.rollback()
      return {ok:false,message:'Se produjo el siguiente error :' + err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getPenalidadBygGuia(idguia){
    console.log("Dentro de la busqueda del las penalidades por guia")
    let conn
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()
      const [cabecera] = await conn.execute(`
        SELECT *FROM tbl2_guias_traslado_adi WHERE id_guia_CAB = ?
      `,[idguia])
      await conn.end()
      return cabecera
    } catch (error) {
      
    } finally {
      if(conn) conn.end()
    }
  }
}
