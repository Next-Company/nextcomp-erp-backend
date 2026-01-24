import { raceWith } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise";
import { ConsoleMessage } from "puppeteer-core";
import { CdpKeyboard } from "puppeteer-core";
import { ifError } from "node:assert";
// import { inventario } from "../../Main/config.js";

export class OrdenesModel {
  static async getInfoPrintSugerido(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [info] = await conn.query("SELECT *FROM viewProduccionOrdenesV2 t1 LEFT JOIN tbl2_pedidos_insumos_cab t2 on t1.id_pedido_origen = t2.idx WHERE t1.idx = ?",[id])
      return info
    } catch(error){
      
    } finally{
      if(conn) await conn.end()
    }
  }
  static async getOrdenes_back_19082025(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''),' ',COALESCE(TRIM(estado_orden),''),' ',COALESCE(TRIM(status_servicio),''))) > 0").join(" ") : ""

      let [results] = await conn.query(`
        SELECT *,
        DATE_FORMAT(fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),STR_TO_DATE(fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes
        FROM viewProduccionOrdenesV2
        WHERE 1=1 ${extra} ORDER BY idx desc
      `);
      await conn.end();

      console.log("Info general:",results)

      results = results.reduce((carry,value)=>{
        value['total_orden'] = value.ordenes_combos.length == 0 ? 0 : value.ordenes_combos.reduce((c,v)=>{
          c += parseInt(v.cantidad_combo)
          return c
        },0)
        // value['total_orden'] = value.ordenes_combos.length == 0 ? 0 : value.ordenes_combos.map(row=>row.fracciones).reduce((c,v)=>{
        //   return v.reduce((cc,vv)=>{
        //     cc += parseInt(vv.cantidad)
        //     return cc
        //   },c)
        // },0)
        value['total_corte'] = value.cortes_combos.length == 0 ? 0 : value.cortes_combos.reduce((c,v)=>{
          c += parseInt(v.cantidad_combo)
          return c
        },0)
        // value['total_corte'] = value.cortes_combos.length == 0 ? 0 : value.cortes_combos.map(row=>row.fracciones).reduce((c,v)=>{
        //   return v.reduce((cc,vv)=>{
        //     cc += parseInt(vv.cantidad)
        //     return cc
        //   },c)
        // },0)

        // const RUTA_COLOR = {'MOLDES':'bg-orange-400','CORTE':'bg-rose-400','CONFECCION':'bg-purple-400','OJAL':'bg-blue-400','ESTAMPADO':'bg-gray-400','LAVANDERIA':'bg-green-400','BORDADO':'bg-yellow-400','ACABADOS':'bg-red-400'}
        const RUTA_COLOR = {'AVIOS':'bg-gray-500','MOLDE':'bg-gray-500','CORTE':'bg-gray-500','CONFECCION':'bg-gray-500','OJAL':'bg-gray-500','ESTAMPADO':'bg-gray-500','LAVANDERIA':'bg-gray-500','BORDADO':'bg-gray-500','ACABADOS':'bg-gray-500'}
        let ruta_ordenada = ['MOLDE','CORTE','AVIOS','CONFECCION','OJAL','ESTAMPADO','LAVANDERIA','BORDADO','ACABADOS']
        let ruta_actual = JSON.parse(value.ruta_proceso)
        let servicios = value.lista_servicios ? value.lista_servicios.split(',') : []

        console.log("La lista de servicios es:",servicios)
        console.log("La ruta actual es :",ruta_actual)

        if(servicios.length > 0){
          let generado = ruta_actual.concat(servicios).reduce((carry,value)=>{!carry.includes(value) && carry.push(value);return carry;},['MOLDE','CORTE','AVIOS'])
          value.ruta_final = ruta_ordenada.filter(fase=>generado.includes(fase))

          let pp = ruta_ordenada.filter(fase=>generado.includes(fase)).map(row=>{
            return {
              fase: row,
              color: RUTA_COLOR[row],
              estado: value.nro_guias > 0
                ? value.lista_servicios.split(',').concat(['MOLDE','CORTE','AVIOS']).includes(row)
                : row == value.status,
              pendiente: value.status_servicio.split('-').includes(row),
              cadudo: value.servicios_caducos && value.servicios_caducos.split(',').includes(row)
            }
          })

          // value.ruta_test = [...pp.filter(item=>item.estado),...pp.filter(item=>!item.estado)]
          value.ruta_test = [...[...pp.filter(item=>item.estado && !item.pendiente),...pp.filter(item=>item.estado && item.pendiente)],...pp.filter(item=>!item.estado)]
          // value.ruta_test = [...pp.filter(item=>item.estado && !value.status_servicio.split('-').includes(item.fase)),...pp.filter(item=>!item.estado || value.status_servicio.split('-').includes(item.fase))]

        }else{

          // let lista_pre = value.status == 'CORTE' ? ['MOLDE','CORTE'] : ( value.status == 'MOLDE' ? ['MOLDE'] : [] )
          let lista_pre = value.nro_cortes > 0 ? ['MOLDE','CORTE'] : (value.estado_molde ? ['MOLDE'] : [])
          // let lista_pre = ['MOLDE','CORTE']
          value.ruta_final = ['MOLDE','CORTE','AVIOS']
          value.ruta_test = ['MOLDE','CORTE','AVIOS'].concat(ruta_actual).reduce((carry,item)=>{if(!carry.includes(item)) carry.push(item); return carry;},[]).map(row=>{
            return {
              fase:row,
              color:RUTA_COLOR[row],
              estado: lista_pre.includes(row),
                // ? row == 'MOLDE' ? (value.estado_molde == 'FINALIZADO' ? true : false) : (value.estado_corte == 'FINALIZADO' ? true : false)
                // : false,
              // estado: ['MOLDE','CORTE','AVIOS'].includes(row)
              //   ? row == 'MOLDE' ? (value.estado_molde == 'FINALIZADO' ? true : false) : (value.estado_corte == 'FINALIZADO' ? true : false)
              //   : false,
              // pendiente: false,
              pendiente: row == 'MOLDE' ? (value.estado_molde == 'PENDIENTE' ? true : false) : (value.estado_corte == 'PENDIENTE' ? true : false),
              caduco: false
            }
          })
        }
        carry.push(value)
        return carry
      },[])

      let bb = Object.groupBy(results,(item)=>item.nro_guias)
      let kk = Object.keys(bb).reduce((carry,item)=>{
        console.log(`La info de bb(${item}) es :`,bb[item].map(row=>({idx:row.idx,modelos:row.modelos})))
        carry = [...carry,...bb[item]]
        return carry
      },[])

      // return results
      return kk
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getOrdenes(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''),' ',COALESCE(TRIM(estado_orden),''),' ',COALESCE(TRIM(status_servicio),''),' ',estado_preprod)) > 0").join(" ") : ""

      let [results] = await conn.query(`
        SELECT t1.*,
        DATE_FORMAT(t1.fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(t1.fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(t1.fec_entrega,'%Y-%m-%d'),STR_TO_DATE(t1.fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(t1.fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
        (
          select count(1)
          from tbl2_guias_traslado_cab tgtc 
          join tbl2_despachos_cab tdc on tgtc.idx = tdc.id_guia_origen
          where tgtc.id_orden_CAB = t1.idx  and tdc.fase = 0
        ) as despachos_conteo
        FROM viewProduccionOrdenesV2 t1
        WHERE 1=1 ${extra} ORDER BY t1.idx desc
      `);
      await conn.end();

      // console.log("Resultado de la busquda:",results)
      ///////////////////////////////////////////////////////
      // Se reduce la informacion de las ordenes para agregar 
      // los totales de combos, el estado de las fases y la ruta de produccion 
      ///////////////////////////////////////////////////////
      results = results.reduce((carry,value)=>{
        value['total_orden'] = value.ordenes_combos.length == 0 ? 0 : value.ordenes_combos.reduce((c,v)=>{
          c += parseInt(v.cantidad_combo)
          return c
        },0)
        value['total_corte'] = value.cortes_combos.length == 0 ? 0 : value.cortes_combos.reduce((c,v)=>{
          c += parseInt(v.cantidad_combo)
          return c
        },0)

        const RUTA_COLOR = {'MATERIALES':'bg-gray-500','MOLDE':'bg-gray-500','CORTE':'bg-gray-500','CONFECCION':'bg-gray-500','OJAL':'bg-gray-500','ESTAMPADO':'bg-gray-500','LAVANDERIA':'bg-gray-500','BORDADO':'bg-gray-500','ACABADOS':'bg-gray-500'}
        let ruta_ordenada = ['MOLDE','CORTE','MATERIALES','CONFECCION','OJAL','ESTAMPADO','LAVANDERIA','BORDADO','ACABADOS']
        let ruta_actual = JSON.parse(value.ruta_proceso)
        let servicios = value.lista_servicios ? value.lista_servicios.split(',') : []

        // console.log("La lista de servicios es:",servicios)
        // console.log("La ruta actual es :",ruta_actual)

        let faltantes = []
        // (JSON.parse(value.ruta_proceso).map(ruta=>!['MOLDE','CORTE','MATERIALES'].includes(ruta))).forEach(fase=>{
        // ruta_actual.forEach(fase=>{
        JSON.parse(value.ruta_proceso).filter(ruta=>!['MOLDE','CORTE','MATERIALES'].includes(ruta)).forEach(fase=>{   
          if(!servicios.includes(fase)){
            faltantes.push(fase)
          }
        })
        value.tomate = JSON.stringify(JSON.parse(value.ruta_proceso).filter(ruta=>!['MOLDE','CORTE','MATERIALES'].includes(ruta)))
        value.faltantes = 10 - faltantes.length

        if(servicios.length > 0){
          //////////////////////////////////////
          /// ORDENES SIN GUIAS DE SERVICIOS ///
          //////////////////////////////////////
          let generado = ruta_actual.concat(servicios).reduce((carry,value)=>{!carry.includes(value) && carry.push(value);return carry;},['MOLDE','CORTE','MATERIALES'])
          value.ruta_final = ruta_ordenada.filter(fase=>generado.includes(fase))

          let pp = ruta_ordenada.filter(fase=>generado.includes(fase)).map(row=>{
            return {
              fase: row,
              color: RUTA_COLOR[row],
              estado: value.nro_guias > 0
                ? value.lista_servicios.split(',').concat(['MOLDE','CORTE','MATERIALES']).includes(row)
                : row == value.status,
              pendiente: value.status_servicio.split('-').includes(row),
              cadudo: value.servicios_caducos && value.servicios_caducos.split(',').includes(row)
            }
          })
          value.ruta_test = [...[...pp.filter(item=>item.estado && !item.pendiente),...pp.filter(item=>item.estado && item.pendiente)],...pp.filter(item=>!item.estado)]
          value.running_state = value.despachos_conteo > 0 ? 'PAUSE' : (value.status_servicio == 'TRANSITO' ? 'STOP' : 'PLAY')
          // let status = ''
          // ruta_ordenada.filter(fase=>generado.includes(fase)).forEach(fase => {
          //   if(v.calculo.filter(row=>row.servicio == fase)[0]?.cantidad > 0) fase_servicio = fase
          // });
          // value.status = status
        }else{
          //////////////////////////////////////
          /// ORDENES SIN GUIAS DE SERVICIOS ///
          //////////////////////////////////////
          let lista_pre = value.estado_materiales ? ['MOLDE','CORTE','MATERIALES'] : (value.nro_cortes > 0 ? ['MOLDE','CORTE'] : (value.estado_molde ? ['MOLDE'] : []))
          value.ruta_final = ['MOLDE','CORTE','MATERIALES']
          // value.ruta_test = ['MOLDE','CORTE','MATERIALES'].concat(ruta_actual).reduce((carry,item)=>{if(!carry.includes(item)) carry.push(item); return carry;},[]).map(row=>{
          value.ruta_test = ruta_actual.map(row=>{
            return {
              fase:row,
              color:RUTA_COLOR[row],
              estado: lista_pre.includes(row),
              pendiente: row == 'MOLDE' ? (value.estado_molde == 'PENDIENTE' ? true : false) : (row == 'CORTE' ? (value.estado_corte == 'PENDIENTE' ? true : false) : (value.estado_materiales == 'PENDIENTE' ? true : false)),
              caduco: false
            }
          })
          // value.meica = JSON.stringify(lista_pre)
          value.longitud = lista_pre.length
          value.running_state = lista_pre.length == 0 ? 'OFF' : (value.estado_materiales == 'PENDIENTE' || value.estado_molde == 'PENDIENTE' || value.estado_corte == 'PENDIENTE' ? 'PLAY' : 'STOP')
          // value.status = value.estado_materiales ? 'MATERIALES' : (value.nro_cortes > 0 ? 'CORTE' : (value.estado_molde ? 'MOLDE' : 'ORDENES'))
        }
        carry.push(value)
        return carry
      },[])

      ///////////////////////////////////////////////////////
      // Se procede con el ordenamiento de las ordenes 
      // por nro_guias
      ///////////////////////////////////////////////////////

      // let aa = results.filter(item=>item.nro_guias == 0)
      // console.log("Ordenes sin guias:",aa)
      let aa = Object.groupBy(results.filter(item=>item.nro_guias == 0),(orden)=>orden.longitud)
      // console.log("Ordenes con guias:",aa)
      let kk1 = Object.keys(aa).reduce((carry,item)=>{
        carry = [...carry,...aa[item]]
        return carry
      },[])

      // let bb = Object.groupBy(results.filter(item=>item.nro_guias > 0),(item)=>item.nro_guias)
      let bb = Object.groupBy(results.filter(item=>item.nro_guias > 0),(item)=>item.faltantes)
      // console.log("Ordenes con guias:",bb)
      let kk2 = Object.keys(bb).reduce((carry,item)=>{
        // console.log(`La info de bb(${item}) es :`,bb[item].map(row=>({idx:row.idx,modelos:row.modelos})))  
        carry = [...carry,...bb[item]]
        return carry
      },[])

      // return results
      return [...kk1,...kk2]
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getOrdenesCorte(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''),' ',COALESCE(TRIM(estado_orden),''))) > 0").join(" ") : ""

      let query = `
        SELECT *,
        DATE_FORMAT(fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),STR_TO_DATE(fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes
        FROM viewProduccionOrdenes t1
        WHERE 1=1 ${extra} ORDER BY idx desc
      `
      let [results] = await conn.query(query);
      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getOrdenesFull(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''),' ',COALESCE(TRIM(estado_orden),''))) > 0").join(" ") : ""

      let query = `
        SELECT *,
        DATE_FORMAT(fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),STR_TO_DATE(fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes
        FROM (
          select
            tfpo.idx AS idx,
            tfpo.oc AS oc,
            tfpo.cliente AS cliente,
            tfpo.fec_emitida AS fec_emitida,
            tfpo.fec_entrega AS fec_entrega,
            tfpo.marca AS marca,
            tfpo.producto AS producto,
            tfpo.base AS base,
            tfpo.estilo,
            tfpo.presentacion,
            tfpo.precio AS precio,
            tfpo.modelos AS modelos,
            tfpo.estado_orden AS estado_orden,
            tfph.observaciones_fase_hojacorte AS observaciones_fase_hojacorte,
            if(((tfph.estado_corte is not null) and (tfph.estado_corte <> '-')), 'CORTE', if(((tfpm.estado_molde is not null) and (tfpm.estado_molde <> '-')), 'MOLDES', if(((tfpt.estado_telas is not null) and (tfpt.estado_telas <> '-')), 'TELAS', 'ORDENES'))) AS status,
            (
            select
                count(0)
            from
                BD_FACTURADOR.tbl2_guias_traslado_cab tgtc
            where
                ((tgtc.id_orden_CAB = tfpo.idx)
                    and (tgtc.estado <> 'ANULADO'))) AS nro_guias,
            (
            select
                count(0)
            from
                BD_FACTURADOR.tbl2_guias_traslado_cab tgtc
            where
                ((tgtc.id_orden_CAB = tfpo.idx)
                    and (tgtc.servicio = 'ACABADOS')
                        and (tgtc.estado = 'FINALIZADO'))) AS nro_guias_acabados,
            (
            select
                coalesce(group_concat(distinct tgtc.servicio separator '-'), 'TRANSITO')
            from
                BD_FACTURADOR.tbl2_guias_traslado_cab tgtc
            where
                ((tgtc.id_orden_CAB = tfpo.idx)
                    and (tgtc.estado = 'PENDIENTE'))) AS status_servicio,
            (
            select
                group_concat(distinct tgtc.servicio separator ',')
            from
                BD_FACTURADOR.tbl2_guias_traslado_cab tgtc
            where
                ((tgtc.id_orden_CAB = tfpo.idx)
                    and (tgtc.estado <> 'ANULADO'))) AS lista_servicios,
            (
            select
                group_concat(distinct tgtc.servicio separator ',')
            from
                BD_FACTURADOR.tbl2_guias_traslado_cab tgtc
            where
                ((tgtc.id_orden_CAB = tfpo.idx)
                    and (cast(now() as date) > cast(tgtc.fec_retorno as date))
                        and (tgtc.estado not in ('FINALIZADO', 'ANULADO')))) AS servicios_caducos,
            coalesce((select sum(coalesce(tfphcf.produccion_total, 0)) from (BD_FACTURADOR.tbl2_fases_prod_hojacorte_combos tfphc join 
            BD_FACTURADOR.tbl2_fases_prod_hojacorte_combos_fracciones tfphcf on((tfphc.idx = tfphcf.id_combo_CAB))) where (tfphc.id_hojacorte_CAB = tfph.idx)), 0) AS disponible
          from
              (((BD_FACTURADOR.tbl2_fases_prod_ordenes tfpo
          left join BD_FACTURADOR.tbl2_fases_prod_telas tfpt on
              ((tfpo.idx = tfpt.id_cab_orden)))
          left join BD_FACTURADOR.tbl2_fases_prod_molde tfpm on
              ((tfpo.idx = tfpm.id_cab_orden)))
          left join BD_FACTURADOR.tbl2_fases_prod_hojacorte tfph on
              ((tfpo.idx = tfph.id_cab_orden)))
          where
              ((tfpo.estado_orden <> 'OTRO') and (tfpo.estado_orden <> 'ANULADO'))
        ) t1
        WHERE 1=1 ${extra} ORDER BY idx desc
      `
      
      console.log('Consulta de listado de ordenes:',query)
      let [results] = await conn.query(query);
      await conn.end();

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  // static async ExtraerItemsCaja_backup(idorden,idhoja) {
  static async ExtraerItemsCaja(idorden,idhoja) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      console.log("Id orden:",idorden,"Id hoja:",idhoja)

      let [infotallas] = await conn.execute("select *from tbl2_fases_prod_ordenes t1 join tbl2_tallas_template t2 on t1.tallasbase = t2.idx where t1.idx = ?",[idorden])
      const tallasbase = infotallas[0].tallas.map(row=>row.desc)

      let [results] = await conn.query(`SELECT 
        tfphc.idx as id_combo,
        -- CONCAT(tfpo.producto,' ',tfpo.marca,' ',tfpo.modelos,' ',tfphc.color_combo) as articulo,
        CONCAT(tfpo.producto,' ',tfphc.color_combo) as articulo,
        COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',tfphcf.talla,'cantidad',COALESCE(tfphcf.produccion_total,0),'produccion_total',COALESCE(tfphcf.produccion_total,0),'caidos_total',COALESCE(tfphcf.caidos_total,0),'incompletos_total',COALESCE(tfphcf.incompletos_total,0))) 
        FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf where tfphcf.id_combo_CAB = tfphc.idx),JSON_ARRAY()) as fracciones,
        (select sum(COALESCE(tfphcf.produccion_total,0)) FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf where tfphcf.id_combo_CAB = tfphc.idx) as cantidad_fracciones,
        tfphc.cantidad_combo
      from tbl2_fases_prod_hojacorte_combos tfphc 
      join tbl2_fases_prod_hojacorte tfph on tfphc.id_hojacorte_CAB = tfph.idx
      join tbl2_fases_prod_ordenes tfpo on tfph.id_cab_orden = tfpo.idx
      where tfpo.idx = ? and tfph.idx = ?
      having cantidad_fracciones > 0`,[idorden,idhoja])
      console.log("Resultados de extraer items de caja:",results)

      results = results.reduce((c,v)=>{
        let total = 0
        let pp = undefined
        v.tallasbase = tallasbase
        if(v.fracciones.length > 0){
          pp = v.fracciones.reduce((cc,vv)=>{
            total += parseInt(vv.produccion_total)
            // v.tallasbase.push(vv.talla)
            return {...cc,[vv.talla]:parseInt(vv.cantidad),cantidad:parseInt(total)}
          },v)
        }else{
          const initaltallas = tallasbase.reduce((c,v)=>{
            c[v] = 0
            return c
          },{})
          // pp = {...v,'xs':0,'s':0,'m':0,'l':0,'xl':0,'xxl':0,cantidad:parseInt(v.cantidad_combo)}
          // v.tallasbase = tallasbase
          pp = {...v,...initaltallas,cantidad:parseInt(v.cantidad_combo)}
        }
        c.push(pp)
        return c
      },[])

      console.log("Nuevo result:",results)

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async ExtraerDisponible(idorden,idhoja) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      console.log("Id orden:",idorden,"Id hoja:",idhoja)

      let [infotallas] = await conn.execute("select *from tbl2_fases_prod_ordenes t1 join tbl2_tallas_template t2 on t1.tallasbase = t2.idx where t1.idx = ?",[idorden])
      const tallasbase = infotallas[0].tallas.map(row=>row.desc)

      let [results] = await conn.query(`
        SELECT 
          tfphc.idx as id_combo,
          CONCAT(tfpo.producto,' ',tfphc.color_combo) as articulo,
          COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',tfphcf.talla,'cantidad',COALESCE(tfphcf.produccion_total,0),'produccion_total',COALESCE(tfphcf.produccion_total,0),'caidos_total',COALESCE(tfphcf.caidos_total,0),'incompletos_total',COALESCE(tfphcf.incompletos_total,0))) 
          FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf where tfphcf.id_combo_CAB = tfphc.idx),JSON_ARRAY()) as fracciones,
          (select sum(COALESCE(tfphcf.produccion_total,0)) FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf where tfphcf.id_combo_CAB = tfphc.idx) as cantidad_fracciones,
          tfphc.cantidad_combo
        from tbl2_fases_prod_hojacorte_combos tfphc 
        join tbl2_fases_prod_hojacorte tfph on tfphc.id_hojacorte_CAB = tfph.idx
        join tbl2_fases_prod_ordenes tfpo on tfph.id_cab_orden = tfpo.idx
        where tfpo.idx = ? and tfph.idx = ?
        having cantidad_fracciones > 0
      `,[idorden,idhoja])
      console.log("Resultados de extraer items de caja:",results)

      results = results.reduce((c,v)=>{
        let total = 0
        let pp = undefined
        v.tallasbase = tallasbase
        if(v.fracciones.length > 0){
          pp = v.fracciones.reduce((cc,vv)=>{
            total += parseInt(vv.produccion_total)
            // v.tallasbase.push(vv.talla)
            return {...cc,[vv.talla]:parseInt(vv.cantidad),cantidad:parseInt(total)}
          },v)
        }else{
          const initaltallas = tallasbase.reduce((c,v)=>{
            c[v] = 0
            return c
          },{})
          // pp = {...v,'xs':0,'s':0,'m':0,'l':0,'xl':0,'xxl':0,cantidad:parseInt(v.cantidad_combo)}
          // v.tallasbase = tallasbase
          pp = {...v,...initaltallas,cantidad:parseInt(v.cantidad_combo)}
        }
        c.push(pp)
        return c
      },[])

      console.log("Nuevo result:",results)

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async ExtraerItemsCaja_(idorden,idhoja) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      console.log("Id orden:",idorden,"Id hoja:",idhoja)
      let [results] = await conn.query(`SELECT 
        tfphc.idx as id_combo,
        CONCAT(tfpo.producto,' ',tfpo.marca,' ',tfpo.modelos,' ',tfphc.color_combo) as articulo,
        JSON_ARRAY() as fracciones,
        (select sum(COALESCE(tfphcf.produccion_total,0)) FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf where tfphcf.id_combo_CAB = tfphc.idx) as cantidad_fracciones,
        tfphc.cantidad_combo,
        tfphc.disponible_total
      from tbl2_fases_prod_hojacorte_combos tfphc 
      join tbl2_fases_prod_hojacorte tfph on tfphc.id_hojacorte_CAB = tfph.idx
      join tbl2_fases_prod_ordenes tfpo on tfph.id_cab_orden = tfpo.idx
      where tfpo.idx = ? and tfph.idx = ?
      having cantidad_fracciones > 0`,[idorden,idhoja])

      console.log("Resultados de extraer items de caja:",results)

      results = results.reduce((c,v)=>{
        let total = 0
        let pp = undefined
        if(v.fracciones.length > 0){
          pp = v.fracciones.reduce((cc,vv)=>{
            total += parseInt(vv.produccion_total)
            return {...cc,[vv.talla]:parseInt(vv.cantidad),cantidad:parseInt(total)}
          },v)
        }else{
          pp = {...v,'xs':0,'s':0,'m':0,'l':0,'xl':0,'xxl':0,cantidad:parseInt(v.cantidad_combo)}
        }
        c.push(pp)
        return c
      },[])

      console.log("Nuevo result:",results)

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getMaterialesProduccion(categoria) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      
      let [results] = await conn.query(`SELECT *FROM tbl2_materiales_sugerido WHERE ruc_ = '20522094120'`)

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getFasesProduccion(categoria) {
    console.log("La categoria filtrada es :",categoria)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let [results] = await conn.query(`SELECT *FROM tbl2_fases_produccion WHERE 1=1 ` + (categoria !== '' ? " AND categoria = '" + categoria +"'" : ''))

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getOrdenesByParams(info) {
    let conn
    let query = ''
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      // console.log("Esta es mi connectoin control:", conn)
      if (info == '') {
        query = 'SELECT * FROM `viewProduccionOrdenes`'
      } else {
        let formateo = JSON.parse(info).map(filter => {
          return `${Object.keys(filter)[0]} like '%` + Object.values(filter)[0] + `%'`
        }).join(' and ')
        query = 'SELECT * FROM `viewProduccionOrdenes` where ' + formateo
      }
      console.log('Busqueda de ordenes produccion :', query)
      const [results, fields] = await conn.query(query)
      console.log("Respuesta busqueda por param :", results)
      await conn.end();
      return results
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getOrdenesById(info) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT * FROM `viewProduccionOrdenes` where idx = ' + info.id + ' order by idx desc');
      await conn.end();
      return results
    } catch (err) {
      console.log("Estamos en error:", err);
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getRequerimientosByOrden(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      
      const [requerimientos] = await conn.query(`select t2.orden_ref,t2.fec_emision,t2.fec_retorno,t2.proveedor,t2.forma_pago,t2.estado,t1.*
      from tbl2_fases_prod_ordenes_requerimientos t1
      join tbl2_pedidos_insumos_cab t2 on t1.id_pedido_CAB = t2.idx
      where t1.id_orden_CAB = ?`,[id]);

      await conn.end();
      return requerimientos
    } catch (err) {
      console.log("Estamos en error:", err);
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async testMultiSelect(info) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const results = [{ ok: true, mensaje: 'Guardado con exito' }]
      const otro = "'[" + info.frutas.map(ele => '"' + ele + '"') + "]'"
      console.log("Volviendo en texto :" + otro)
      console.log("Informacion enviadad del fronted :", info.frutas, info.frutas.toString())
      const sql = "INSERT INTO `tbl2_testmulti`(ruta_proceso) VALUES (" + otro + ")"
      console.log("Mi consulta : ", sql)
      const [result] = await conn.query("INSERT INTO `tbl2_testmulti`(ruta_proceso) VALUES (" + otro + ")")
      await conn.end();
      return results
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) await conn.end();
    }
  }
  static async traerMultiSelect() {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [result] = await conn.query("select *from tbl2_testmulti")
      console.log(result)
      await conn.end();
      return result
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) await conn.end();
    }
  }

  static async saveInfoOrdenes(info, user_data) {
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const table = info.table
      const id = info.idx
      console.log("Empezando guardado de orodenses",info,user_data)

      const info_combos_orden = info.combos_orden && JSON.parse(info.combos_orden)
      const info_combos_corte = info.combos_corte && JSON.parse(info.combos_corte)
      // if(info.combos_corte){
      //   console.log("Parsando combos corte")
      // }
      console.log("Monstrando combos orden:",JSON.parse(info.combos_orden))

      if (id == '') {
        sql = 'SELECT *FROM `' + table + '` LIMIT 1';
      } else {
        sql = 'SELECT *FROM `' + table + '` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id + ' LIMIT 1';
      }
      const [consulta, fields] = await conn.execute(sql)

      console.log("La primera busqueda es: ", consulta, fields)
      if (id == '') {
        let busqueda = `select *from tbl2_fases_prod_ordenes tfpo where tfpo.oc = ${info.oc}`
        console.log("La busqueda de duplicados :",busqueda)
        let [validacion] = await conn.query(`select *from tbl2_fases_prod_ordenes tfpo where tfpo.oc = ?`,[info.oc])
        if(validacion.length > 0) throw new Error("La oc ingresada ya se encuentra registrada. Por favor verifique.")

        try {
          console.log("Dentro de nueva orden de produccion")
          const campos = Object.keys(info).reduce((carry, current) => {
            fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
            return carry
          }, [])
          const values = campos.map(row => info[row])
          sql = 'INSERT INTO `' + table + '`(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')';
          console.log(sql, values)
          const [result] = await conn.execute(sql, values)
          const idinsert = result.insertId

          if(table == 'tbl2_fases_prod_ordenes' && info_combos_orden){
            
            let combos_orden = info_combos_orden.map(row=>{
              return [idinsert,row.color_combo,row.cantidad_combo]
            })
            await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ?",[combos_orden])
          }

          nameimg = `op_${idinsert}.jpg`
          
        } catch (error) {
          console.log(error)
        }
  
      } else {
        let newid = null
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])

        console.log("Lista de valores a insertar:",values)

        if (consulta.length > 0) {
          sql = 'UPDATE `' + table + '` SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE `' + (table == 'tbl2_fases_prod_ordenes' ? 'idx' : 'id_cab_orden') + '` = ' + id;
        } else {
          sql = 'INSERT INTO `' + table + '`(id_cab_orden,' + campos.toString() + ') VALUES (' + id + ',' + campos.map(row => "NULLIF(?, '')").toString() + ')';
        }
        console.log("Consulta de insertado:", sql)
        const [result] = await conn.execute(sql, values)


        if(table == 'tbl2_fases_prod_ordenes' && info_combos_orden){
          let new_combos_orden = info_combos_orden.map(row=>{
            return [id,row.color_combo,row.cantidad_combo]
          })
          await conn.query("delete from tbl2_fases_prod_ordenes_combos where id_orden_CAB = ?",[id])
          await conn.query("insert into tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) values ?",[new_combos_orden])
        }
        if(table == 'tbl2_fases_prod_hojacorte' && info_combos_corte){
          let infocorte = await conn.query(`select *from tbl2_fases_prod_hojacorte where id_cab_orden = ?`,[id])
          let new_combos_corte = info_combos_corte.map(row=>{
            return [infocorte[0].idx,row.color_combo,row.cantidad_combo]
          })
          await conn.query("delete from tbl2_fases_prod_hojacorte_combos where id_hojacorte_CAB = ?",[id])
          await conn.query("insert into tbl2_fases_prod_hojacorte_combos(id_hojacorte_CAB,color_combo,cantidad_combo) values ?",[new_combos_corte])
        }
        nameimg = `op_${id}.jpg`
        // console.log(sql)
      }
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito', filename: nameimg }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message, filename: nameimg }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveFaseOrden_backup(info, user_data) {
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const id = info.idx
      console.log("Empezando guardado de orodenses",info,user_data)
      const combos = JSON.parse(info.combos)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_ordenes WHERE idx = ?",[id])
      if (id == '') {
        // let busqueda = `select *from tbl2_fases_prod_ordenes tfpo where tfpo.oc = ${info.oc}`
        // console.log("La busqueda de duplicados :",busqueda)
        let [validacion] = await conn.query(`SELECT *FROM tbl2_fases_prod_ordenes tfpo WHERE tfpo.oc = ?`,[info.oc])
        if(validacion.length > 0) throw new Error("La oc ingresada ya se encuentra registrada. Por favor verifique.")

        try {
          console.log("Dentro de nueva orden de produccion")

          let correlativo = await OrdenesModel.getCorrelativoProduccion('ORDEN',conn)
          info.oc = correlativo.resp

          const campos = Object.keys(info).reduce((carry, current) => {
            fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
            return carry
          }, [])
          const values = campos.map(row => info[row])
          const [result] = await conn.execute('INSERT INTO tbl2_fases_prod_ordenes(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', values)
          const idinsert = result.insertId


          let recursive = async()=>{
            let combo_data = combos.shift()
            if(combo_data){
              console.log("Ejecutando nuevamente",combo_data)
              let [insert_combo] = await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES (?,?,?)",[idinsert,combo_data.color_combo,combo_data.cantidad_combo])

              let fraccionado = [];
              ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
                // if(parseInt(combo_data[v]) > 0) c.push([insert_combo.insertId,v,parseInt(combo_data[v])])
                c.push([insert_combo.insertId,v,parseInt(combo_data[v]) > 0 ? parseInt(combo_data[v]) : 0])
                return c
              },fraccionado)
              console.log("Imprimiento fraccionado",fraccionado)

              await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos_fracciones(id_combo_CAB,talla,cantidad) values ?",[fraccionado])
              await recursive()
            }else{
              return Promise.resolve()
            }
          }
          await recursive()
          console.log("Finalizando recursive")
          // let combos_formateado = combos.map(row=>{
          //   return [idinsert,row.color_combo,row.cantidad_combo]
          // })
          // let [info_insert] = await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ?",[combos_formateado])

          // let fracciones_orden = combos.reduce((carry,row)=>{
          //   return ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
          //     if(row[v] > 0) c.push([info_insert.insertId,v,parseInt(row[v])])
          //     return c
          //   },carry)
          // },[])
          // await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos_fracciones(id_combo_CAB,talla,cantidad) values ?",[fracciones_orden])

          nameimg = `op_${idinsert}.jpg`
        } catch (error) {
          console.log(error)
        }
  
      } else {
        let newid = null
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])
        console.log("Informacion de campos :",campos)
        let result_update = await conn.query('UPDATE tbl2_fases_prod_ordenes SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE idx = ' + id,values)

        console.log("Resultado de la actualziaoo : ",result_update)


        await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos WHERE id_orden_CAB = ?",[id])
        await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos_fracciones WHERE id_combo_CAB in (select idx from tbl2_fases_prod_ordenes_combos where id_orden_CAB = ?)",[id])
        let recursive = async ()=>{
          let rdata = combos.shift()
          if(rdata){
            // rdata --> {color_combo:'',cantidad_combo:3,xs:3,s:3,m:2,l:4,xl:1,xxl:9}
            let [insert_info] = await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES (?,?,?)",[id,rdata.color_combo,rdata.cantidad_combo])

            let fracciones = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
              // if(parseInt(rdata[v]) > 0) c.push([insert_info.insertId,v,parseInt(rdata[v])])
              c.push([insert_info.insertId,v,parseInt(rdata[v]) > 0 ? parseInt(rdata[v]) : 0])
              return c
            },[])
            await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos_fracciones(id_combo_CAB,talla,cantidad) VALUES ?",[fracciones])

            await recursive()
          }else{
            return Promise.resolve()
          }
        }
        await recursive()
        // let combos_formateo = combos.map(row=>{
        //   return [id,row.color_combo,row.cantidad_combo]
        // })
        // await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos WHERE id_orden_CAB = ?",[id])
        // await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ?",[combos_formateo])

        nameimg = `op_${id}.jpg`
        // console.log(sql)
      }
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito',filename: nameimg }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message,filename: nameimg }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveFaseOrden(info, user_data) {
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      const id = info.idx
      console.log("Empezando guardado de orodenses",info,user_data)
      const combos = JSON.parse(info.combos)
      const insumos = JSON.parse(info.insumos)
      const requerimientos = JSON.parse(info.requerimientos)

      console.log("La info de los combos es:",combos)

      const [infotallas] = await conn.execute("select *from tbl2_tallas_template where idx = ?",[info.tallasbase])
      const tallasbase = infotallas[0].tallas.map(row=>row.desc)
      console.log("Info tallas:",tallasbase)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_ordenes WHERE idx = ?",[id]) 
      let [validacion] = await conn.query(`SELECT *FROM tbl2_fases_prod_ordenes tfpo WHERE tfpo.oc = ?`,[info.oc])
      if(validacion.length > 0) throw new Error("La oc ingresada ya se encuentra registrada. Por favor verifique.")

      console.log("Dentro de nueva orden de produccion")

      let correlativo = await OrdenesModel.getCorrelativoProduccion('ORDEN',conn)
      info.oc = correlativo.resp

      const campos = Object.keys(info).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
        return carry
      }, [])
      console.log("La lista de campos es:",campos)
      const values = campos.map(row => info[row])
      console.log("La lista de valores es:",values)
      const [result] = await conn.execute('INSERT INTO tbl2_fases_prod_ordenes(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', values)
      const idinsert = result.insertId

      for(let combo of [...combos]){
        console.log("Ejecutando nuevamente",combo)
        let [insert_combo] = await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo,insumos) VALUES (?,?,?,?)",[idinsert,combo.color_combo,combo.cantidad_combo,JSON.stringify(combo.insumos ?? [])])

        let fraccionado = [];
        // ['st','xs','s','m','l','xl','xxl'].reduce((c,v)=>{
        tallasbase.reduce((c,v)=>{
          c.push([insert_combo.insertId,v,parseInt(combo[v]) > 0 ? parseInt(combo[v]) : 0])
          return c
        },fraccionado)
        console.log("Imprimiento fraccionado",fraccionado)

        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos_fracciones(id_combo_CAB,talla,cantidad) values ?",[fraccionado])
      }
      for(let insumo of [...insumos]){
        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_insumos(id_orden_CAB,id_producto_CAB,id_subprod_CAB,cantidad) VALUES (?,?,?,?)",[idinsert,insumo.id_producto_CAB,insumo.id_subprod_CAB,insumo.cantidad])
      }
      for(let requerimiento of [...requerimientos]){
        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_requerimientos(id_orden_CAB,id_pedido_CAB) VALUES (?,?)",[idinsert,requerimiento.id_pedido_CAB])
      }
      nameimg = `op_${idinsert}.jpg`

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito',filename: nameimg }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message,filename: nameimg }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async updateFaseOrden(info, user_data) {
    console.log("Empezando con la actualizacion de las ordenes melcochita")
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const id = info.idx
      console.log("Empezando guardado de orodenses",info,user_data)
      const combos = JSON.parse(info.combos)
      const insumos = JSON.parse(info.insumos)
      const requerimientos = JSON.parse(info.requerimientos)

      console.log("El listado de los insumos es :",insumos)
      console.log("El listado de los requerimientos es :",requerimientos)

      const [infotallas] = await conn.execute("select *from tbl2_tallas_template where idx = ?",[info.tallasbase])
      const tallasbase = infotallas[0].tallas.map(row=>row.desc)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_ordenes WHERE idx = ?",[id])

      let newid = null
      const campos = Object.keys(info).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
        return carry
      }, [])
      const values = campos.map(row => info[row])
      console.log("Informacion de campos :",campos)
      console.log("Informacion de values :",values)
      let result_update = await conn.query('UPDATE tbl2_fases_prod_ordenes SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE idx = ' + id,values)

      console.log("Resultado de la actualziaoo : ",result_update)

      await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos WHERE id_orden_CAB = ?",[id])
      await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos_fracciones WHERE id_combo_CAB in (select idx from tbl2_fases_prod_ordenes_combos where id_orden_CAB = ?)",[id])
      for(let rdata of [...combos]){
        // console.log("Validacion insumos:",rdata.insumos,JSON.stringify(rdata.insumos ?? []))
        let [insert_info] = await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo,insumos) VALUES (?,?,?,?)",[id,rdata.color_combo,rdata.cantidad_combo,JSON.stringify(rdata.insumos ?? [])])

          // let fracciones = ['st','xs','s','m','l','xl','xxl'].reduce((c,v)=>{
          let fracciones = tallasbase.reduce((c,v)=>{
            c.push([insert_info.insertId,v,parseInt(rdata[v]) > 0 ? parseInt(rdata[v]) : 0])
            return c
          },[])
          await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos_fracciones(id_combo_CAB,talla,cantidad) VALUES ?",[fracciones])
      }

      await conn.query("DELETE FROM tbl2_fases_prod_ordenes_insumos WHERE id_orden_CAB = ?",[id])
      for(let insumo of [...insumos]){
        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_insumos(id_orden_CAB,id_producto_CAB,id_subprod_CAB,cantidad,fases) VALUES (?,?,?,?,?)",[id,insumo.id_producto_CAB,insumo.id_subprod_CAB,insumo.cantidad,JSON.stringify(insumo.fases ?? [])])
      }
      await conn.query("DELETE FROM tbl2_fases_prod_ordenes_requerimientos WHERE id_orden_CAB = ?",[id])
      for(let requerimiento of [...requerimientos]){
        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_requerimientos(id_orden_CAB,id_pedido_CAB) VALUES (?,?)",[id,requerimiento.id_pedido_CAB])
      }

      nameimg = `op_${id}.jpg`
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito',filename: nameimg }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message,filename: nameimg }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveFaseMolde(info, user_data) {
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const id = info.idx
      console.log("Empezando guardado de molde",info,user_data)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_molde WHERE idx = ?",[id])
      if (id == '') {
        try {
          const campos = Object.keys(info).reduce((carry, current) => {
            fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
            return carry
          }, [])
          const values = campos.map(row => info[row])
          const [result] = await conn.execute('INSERT INTO tbl2_fases_prod_molde(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', values)
          const idinsert = result.insertId
        } catch (error) {
          console.log(error)
        }
  
      } else {
        let newid = null
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])
        console.log("Informacion de campos :",campos)
        await conn.query('UPDATE tbl2_fases_prod_molde SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE idx = ' + id,values)
        // console.log(sql)
      }

      // const [verifica] = await conn.query("SELECT *FROM tbl2_fases_prod_molde WHERE id_cab_orden = ?",[id])
      // console.log("Resultado de la verificacion :",verifica)

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito' }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveFaseCorte(info, user_data) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      console.log("Empezando guardado de corte",info,user_data)
      let data = JSON.parse(info.info)
      let id_orden = info.id
      let [base_cortes] = await conn.query("SELECT *FROM tbl2_fases_prod_hojacorte WHERE id_cab_orden = ?",[id_orden])
      let base_ids = base_cortes.map(row=>row.idx)

      let base_add = data.filter(row=>row.idx == '' || !row.idx)
      let base_update = data.filter(row=>base_ids.includes(row.idx))
      let base_delete = base_cortes.filter(row=>!data.map(item=>item.idx).includes(row.idx))

      console.log("Info formateada :",base_add,base_update,base_delete)
      const tallasbase = JSON.parse(info.tallasbase)
      console.log("Las tallas base son:",tallasbase)

      // ///////////////////////////////////////
      // INFORMARCCION DE NUEVAS HOJAS DE CORTE
      // ///////////////////////////////////////

      if(base_add.length > 0){
        console.log("Dentro de seccion 1")

        const processCortes = async (id_orden, base_add, conn) => {
          try {
              // Itera sobre cada 'corte' en base_add
              // Crea una copia del array para no mutar el original si 'base_add' viene de fuera
              for (const corte of [...base_add]) {
                  // Asegúrate de que 'base_add' se pase como un array de objetos,
                  // y que 'corte.combos' también lo sea.

                  console.log(`Procesando corte número: ${corte.numero_corte}`);

                  // Insertar hoja de corte
                  const [hojaCorteResult] = await conn.query(
                      "INSERT INTO tbl2_fases_prod_hojacorte(id_cab_orden, numero_corte, estado_corte, fec_emision) VALUES (?,?,?,?)",
                      [id_orden, corte.numero_corte, corte.estado_corte, corte.fec_emision]
                  );
                  const idHojaCorte = hojaCorteResult.insertId;

                  // Itera sobre los 'combos' de este corte
                  // También creamos una copia de los combos para el bucle
                  for (const combo of [...corte.combos]) {
                    console.log(`  Procesando combo: ${combo.color_combo}, Cantidad: ${combo.cantidad_combo}`);

                    // Insertar combo de hoja de corte
                    const [comboInsertResult] = await conn.query(
                        "INSERT INTO tbl2_fases_prod_hojacorte_combos(id_hojacorte_CAB, idx_color, color_combo, cantidad_combo, disponible_total, insumos) VALUES (?,?,?,?,?,?)",
                        [idHojaCorte, combo.idx_color, combo.color_combo, combo.cantidad_combo, combo.cantidad_combo, JSON.stringify(combo.insumos ?? [])]
                    );
                    const idComboCorte = comboInsertResult.insertId;
                    
                    // Preparar los datos de fraccionado
                    const fraccionado = [];
                    // ['xs', 's', 'm', 'l', 'xl', 'xxl'].forEach(talla => {
                    tallasbase.forEach(talla => {
                        const cantidad = parseInt(combo[talla]);
                        fraccionado.push([idComboCorte, talla, isNaN(cantidad) ? 0 : cantidad > 0 ? cantidad : 0, isNaN(cantidad) ? 0 : cantidad > 0 ? cantidad : 0]);
                    });

                    console.log("  La info del fraccionado es:", fraccionado);

                    // Insertar fracciones
                    await conn.query(
                      "INSERT INTO tbl2_fases_prod_hojacorte_combos_fracciones(id_combo_CAB, talla, cantidad, produccion_total) VALUES ?",
                      [fraccionado]
                    );
                  }
                  console.log("Corte procesado completamente:", corte.numero_corte);
              }
              console.log("Todos los cortes y sus combos/fracciones procesados.");
              return true;
          } catch (error) {
              console.error("Error en el proceso de inserción recursiva:", error);
              throw error; // Propaga el error para que la función que llama lo maneje
          }
        };
        await processCortes(id_orden,base_add,conn)
      }

      // ///////////////////////////////////////
      // INFORMARCCION DE HOJAS DE CORTE ACTUALES
      // ///////////////////////////////////////
      if(base_update.length > 0){
        console.log("Dentro de seccion 2",base_update)
        console.log("otroasd sdaf :",base_update.map(row=>row.combos))
        let base_combos = base_update.map(row=>row.combos).filter(item=>item)

        let recursive = async (id_orden,base_update,conn)=>{
          try {
            for(let corte of [...base_update]){

              console.log("Info del corte",corte)

              let base = ['numero_corte','estado_corte','fec_emision']
              let acumulado = []

              base.forEach(campo=>{
                let text = `${campo} = CASE `
                text += `WHEN idx = ${parseInt(corte['idx'])} THEN '${corte[campo]}'`
                text += `ELSE ${campo} END`
                acumulado.push(text)
              })
              console.log("Imprimiendo acumulado :",acumulado)
              let [combosbase] = await conn.query(`SELECT *FROM tbl2_fases_prod_hojacorte_combos WHERE id_hojacorte_CAB = ?`,[parseInt(corte['idx'])])
              await conn.query(`UPDATE tbl2_fases_prod_hojacorte SET ${acumulado.join(',')} WHERE idx in (${base_update.map(row=>row.idx).join(',')}) and id_cab_orden = ?`,[id_orden])

              for(let combo of [...combosbase.filter(row=>!corte.combos.map(item=>item.idx).includes(row.idx))]){
                console.log("Combo a eliminar:",combo)
                let [validacion] = await conn.query(`SELECT *FROM tbl2_guias_traslado_cab t1 JOIN tbl2_guias_traslado_det t2 ON t1.idx = t2.id_guia_CAB WHERE t1.tipo = 'SERVICIOS' AND t1.estado <> 'ANULADO' AND t1.id_corte_CAB = ? AND t2.id_combo = ?`,[parseInt(corte['idx']),combo.idx ?? 0])

                if(validacion.length == 0){
                  await conn.query("DELETE FROM tbl2_fases_prod_hojacorte_combos WHERE idx = ?",[combo.idx])
                  await conn.query("DELETE FROM tbl2_fases_prod_hojacorte_combos_fracciones WHERE id_combo_CAB = ?",[combo.idx])
                }
              }

              for(let combo of [...corte.combos]){
                let [validacion] = await conn.query(`SELECT *FROM tbl2_guias_traslado_cab t1 JOIN tbl2_guias_traslado_det t2 ON t1.idx = t2.id_guia_CAB WHERE t1.tipo = 'SERVICIOS' AND t1.estado <> 'ANULADO' AND t1.id_corte_CAB = ? AND t2.id_combo = ?`,[parseInt(corte['idx']),combo.idx ?? 0])
                console.log("Validacion de combos:",validacion,parseInt(corte['idx']),combo.idx)

                if(validacion.length == 0){
                  console.log("Dentro del update de combos complejo")
                  await conn.query("DELETE FROM tbl2_fases_prod_hojacorte_combos WHERE idx = ?",[combo.idx])
                  await conn.query("DELETE FROM tbl2_fases_prod_hojacorte_combos_fracciones WHERE id_combo_CAB = ?",[combo.idx])
  
                  let [info_insert] = await conn.query("INSERT INTO tbl2_fases_prod_hojacorte_combos(id_hojacorte_CAB,idx_color,color_combo,cantidad_combo,disponible_total,insumos) VALUES (?,?,?,?,?,?)",[corte.idx,combo.idx_color,combo.color_combo,combo.cantidad_combo,combo.cantidad_combo,JSON.stringify(combo.insumos)])
  
                  let fraccionado = []
                  if(combo.idx && combo.idx !== ''){
                    fraccionado = combo.fracciones.reduce((c,v)=>{
                      c.push([info_insert.insertId,v.talla,v.cantidad,v.cantidad])
                      return c
                    },[])
                  }else{
                    // fraccionado = ['xs','s','m','l','xl','xxl'].map(talla=>([info_insert.insertId,talla,combo[talla] ?? 0, combo[talla] ?? 0]))
                    fraccionado = tallasbase.map(talla=>([info_insert.insertId,talla,combo[talla] ?? 0, combo[talla] ?? 0]))
                  }
                  console.log("Info del fraccionado:",fraccionado)
                  await conn.query("INSERT INTO tbl2_fases_prod_hojacorte_combos_fracciones(id_combo_CAB,talla,cantidad,produccion_total) values ? ",[fraccionado.filter(row=>row.cantidad > 0)])
                } else {
                  console.log("Dentro del update de combos simple")
                  await conn.query("UPDATE tbl2_fases_prod_hojacorte_combos SET idx_color = ?,color_combo = ?, insumos = ? WHERE idx = ? and id_hojacorte_CAB = ?",[combo.idx_color,combo.color_combo,JSON.stringify(combo).insumos,combo.idx,parseInt(corte['idx'])])
                }
              }
            }
            return true
          } catch (error) {
            throw error
          }

        }
        await recursive(id_orden,base_update,conn)
      }
      // ///////////////////////////////////////////
      // INFORMARCCION DE HOJAS DE CORTE A ELIMINAR
      // ///////////////////////////////////////////
      if(base_delete.length > 0){
        console.log("Dentro de seccion 3")
        for(let corte of [...base_delete]){
          await conn.query("DELETE t1,t2,t3 FROM tbl2_fases_prod_hojacorte t1 LEFT JOIN tbl2_fases_prod_hojacorte_combos t2 ON t1.idx = t2.id_hojacorte_CAB LEFT JOIN tbl2_fases_prod_hojacorte_combos_fracciones t3 ON t2.idx = t3.id_combo_CAB WHERE t1.idx = ? and t1.id_cab_orden = ?",[corte.idx,id_orden])
        }
      }
      let [verificar] = await conn.query("select *from tbl2_fases_prod_hojacorte t1 join tbl2_fases_prod_hojacorte_combos t2 on t1.idx = t2.id_hojacorte_CAB where t1.id_cab_orden = ?",id_orden)
      console.log("Verificando la informacion de corte :",verificar)
      console.log("Terminando el actulizado de corte")

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito' }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveFaseMateriales(info, user_data) {
    // dentro de la fases de matirales de contruccion de la produccion
    console.log("Dentro de la fase de materiales :",info)
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const id = info.idx
      console.log("Empezando guardado de materiales",info,user_data)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_materiales WHERE idx = ?",[id])
      if (id == '') {
        try {
          const campos = Object.keys(info).reduce((carry, current) => {
            fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
            return carry
          }, [])
          const values = campos.map(row => info[row])
          const [result] = await conn.execute('INSERT INTO tbl2_fases_prod_materiales(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', values)
          const idinsert = result.insertId
        } catch (error) {
          console.log(error)
        }
  
      } else {
        let newid = null
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])
        console.log("Informacion de campos :",campos)
        await conn.query('UPDATE tbl2_fases_prod_materiales SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE idx = ' + id,values)
        // console.log(sql)
      }
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito' }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message }
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getAll(user_data) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT tb1.*,CASE WHEN tb1.categoria = "IMPL" THEN "Implementaciones" WHEN tb1.categoria = "SOPT" THEN "Soportes" ELSE "Proyectos" END categoria_nom,tb2.nom FROM `tbl2_soportes_cab` tb1 INNER JOIN `tbl_user` tb2 ON tb1.usuario = tb2.idx ' + `${user_data.niv !== 1 ? 'WHERE tb1.usuario = ?' : 'WHERE tb1.usuario = ? or tb1.usuario <> ?'}` + ' ORDER BY tb1.created_at DESC', [user_data.id, user_data.id]);
      await conn.end();
      return results
    } catch (err) {
      console.log(err);
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async updateItems() {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'INSERT INTO `tbl2_soportes_cab`(`usuario`,`descripcion`,`fec_programado`,`prioridad`) VALUES("Juan","Avanzar con campo vendedor en modulo de ventas","2024-06-15","ALTA")'
      );

      // const sql = 'INSERT INTO `users`(`name`, `age`) VALUES (?, ?), (?,?)';
      // const values = ['Josh', 19, 'Page', 45];
      // const [result, fields] = await conn_jsjfact.execute(sql, values);


      // console.log(results);
      // console.log(fields);
      // const [{ok:true,mensaje:'Guardado con exito'}]
      await conn.end();
      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    } finally {
      if (conn) {
        console.log("Cerrando session")
        await conn.end();
      }
    }
  }
  static async deleteOrden(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      console.log("El id dela orden es :",id)
      await conn.query('DELETE FROM `tbl2_fases_prod_ordenes` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_fases_prod_ordenes_combos` WHERE `id_orden_CAB` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_fases_prod_molde` WHERE `id_cab_orden` = ? ',[id]);
      await conn.query('DELETE FROM `tbl2_fases_prod_hojacorte` WHERE `id_cab_orden` = ? ',[id]);
      await conn.query('DELETE FROM `tbl2_fases_prod_hojacorte_combos` WHERE id_hojacorte_CAB in (select idx FROM tbl2_fases_prod_hojacorte WHERE `id_cab_orden` = ? )',[id]);
      
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return { ok: true, mensaje: 'Registro Eliminado con exito' }
    } catch (err) {
      if (conn) conn.rollback()
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }

  static async getListaProveedores(limit) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" limit ?', [parseInt(limit)]);
      // console.log("Lista de provedored :",results)
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async searchProveedor(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(ruc),' ',TRIM(nom),' ',TRIM(direccion))) > 0").join(" ") : ""

      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? 'and ( ruc like ? or nom like ? )' : '') + ' limit 50',[`%${search}%`,`%${search}%`]);
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? extra : '') + ' limit 50');
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async searchProveedorById(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" and idx = ?', [id]);
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getStatusGeneral(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      
      // const [ordenes] = await conn.query(`
      //   SELECT tfpo.*,
      //   ( COALESCE(tfpo.combo1_orden,0) + COALESCE(tfpo.combo2_orden,0) + COALESCE(tfpo.combo3_orden,0) + COALESCE(tfpo.combo4_orden,0) + COALESCE(tfpo.combo5_orden,0) + COALESCE(tfpo.combo6_orden,0) + COALESCE(tfpo.combo7_orden,0) + COALESCE(tfpo.combo8_orden,0) + COALESCE(tfpo.combo9_orden,0) ) as total_orden,
      //   (COALESCE(tfph.combo1_corte,0) + COALESCE(tfph.combo2_corte,0) + COALESCE(tfph.combo3_corte,0) + COALESCE(tfph.combo4_corte,0) + COALESCE(tfph.combo5_corte,0) + COALESCE(tfph.combo6_corte,0) + COALESCE(tfph.combo7_corte,0) + COALESCE(tfph.combo8_corte,0) + COALESCE(tfph.combo9_corte,0) ) as total_corte,
      //   COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      //   tfph.numero_corte,tfph.ruta_proceso
      //   FROM tbl2_fases_prod_ordenes tfpo 
      //   LEFT JOIN tbl2_fases_prod_hojacorte tfph on tfpo.idx = tfph.id_cab_orden 
      //   where tfpo.idx = ?
      // `, [id]);

      const [ordenes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_ordenes_combos tb2 where tb2.id_orden_CAB = tb1.idx),JSON_ARRAY()) as combos,COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_fases_prod_ordenes tb1 WHERE tb1.idx = ? ORDER BY tb1.idx desc",[id]);

      const [moldes] = await conn.query('SELECT tb1.* FROM tbl2_fases_prod_molde tb1 WHERE tb1.id_cab_orden = ?',[id]);

      const [cortes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_hojacorte_CAB',tb2.id_hojacorte_CAB,'id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_hojacorte_combos tb2 where tb2.id_hojacorte_CAB = tb1.idx),JSON_ARRAY()) as combos FROM tbl2_fases_prod_hojacorte tb1 WHERE tb1.id_cab_orden = ?",[id]);

      let query = `SELECT idx,id_orden_CAB,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos, DATE_FORMAT(created_at,'%Y-%m-%d') as created_at
      FROM tbl2_guias_traslado_cab where tipo = 'SERVICIOS' and estado <> 'ANULADO' and id_orden_cab = ? order by created_at desc`
      
      let [infoguias] = await conn.query(query,[id])
      infoguias = Object.groupBy(infoguias,(item)=>item.created_at)

      // console.log("Informcion agrupada",Object.groupBy(infoguias,(created_at)=>created_at))

      return [ordenes,moldes,cortes,infoguias]
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getStatusGeneral2(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      
      // const [ordenes] = await conn.query(`
      //   SELECT tfpo.*,
      //   ( COALESCE(tfpo.combo1_orden,0) + COALESCE(tfpo.combo2_orden,0) + COALESCE(tfpo.combo3_orden,0) + COALESCE(tfpo.combo4_orden,0) + COALESCE(tfpo.combo5_orden,0) + COALESCE(tfpo.combo6_orden,0) + COALESCE(tfpo.combo7_orden,0) + COALESCE(tfpo.combo8_orden,0) + COALESCE(tfpo.combo9_orden,0) ) as total_orden,
      //   (COALESCE(tfph.combo1_corte,0) + COALESCE(tfph.combo2_corte,0) + COALESCE(tfph.combo3_corte,0) + COALESCE(tfph.combo4_corte,0) + COALESCE(tfph.combo5_corte,0) + COALESCE(tfph.combo6_corte,0) + COALESCE(tfph.combo7_corte,0) + COALESCE(tfph.combo8_corte,0) + COALESCE(tfph.combo9_corte,0) ) as total_corte,
      //   COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      //   tfph.numero_corte,tfph.ruta_proceso
      //   FROM tbl2_fases_prod_ordenes tfpo 
      //   LEFT JOIN tbl2_fases_prod_hojacorte tfph on tfpo.idx = tfph.id_cab_orden 
      //   where tfpo.idx = ?
      // `, [id]);

      const [ordenes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_ordenes_combos tb2 where tb2.id_orden_CAB = tb1.idx),JSON_ARRAY()) as combos,COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_fases_prod_ordenes tb1 WHERE tb1.idx = ? ORDER BY tb1.idx desc",[id]);

      const [moldes] = await conn.query('SELECT tb1.* FROM tbl2_fases_prod_molde tb1 WHERE tb1.id_cab_orden = ?',[id]);

      const [cortes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_hojacorte_CAB',tb2.id_hojacorte_CAB,'id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_hojacorte_combos tb2 where tb2.id_hojacorte_CAB = tb1.idx),JSON_ARRAY()) as combos FROM tbl2_fases_prod_hojacorte tb1 WHERE tb1.id_cab_orden = ?",[id]);

      let query = `SELECT idx,id_orden_CAB,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos, DATE_FORMAT(created_at,'%Y-%m-%d') as created_at
      FROM tbl2_guias_traslado_cab where tipo = 'SERVICIOS' and estado <> 'ANULADO' and id_orden_cab = ? order by created_at desc`
      
      let [infoguias] = await conn.query(query,[id])
      infoguias = Object.groupBy(infoguias,(item)=>item.created_at)

      // console.log("Informcion agrupada",Object.groupBy(infoguias,(created_at)=>created_at))
      let ruta = eval(ordenes[0].ruta_proceso)
      // let ruta_ordenada = ['MOLDE','CORTE','AVIOS','CONFECCION','OJAL','ESTAMPADO','LAVANDERIA','BORDADO','ACABADOS']
      
      ruta = ruta.filter(item=>!['MOLDE','CORTE','MATERIALES'].includes(item)).reduce((c,v)=>{
        c[v] = []
        return c
      },{})

      console.log("La ruta de la orden es:",ruta)      
      let [info_guias] = await conn.query(`
      select 
      t1.*,
      DATEDIFF(t1.fec_retorno,t1.fec_emision) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = t1.idx
      ) as cantidad_servicio,
      (select t0.identificador from tbl2_fases_produccion t0 where t0.ruta = t1.servicio) as color,
      (
      select JSON_ARRAYAGG(JSON_OBJECT('id',tdc.idx,'fase',tdc.fase,'idguia',tdc.id_guia_origen,'nro_guia',tdc.nro_guia,'fecha_ingreso',tdc.fec_despacho,'despacho',(select sum(tdd.despacho) from tbl2_despachos_det tdd where tdc.idx = tdd.id_despacho_CAB)))
      from tbl2_despachos_cab tdc
      where tdc.id_guia_origen = t1.idx
      ) as despachos	
      from tbl2_guias_traslado_cab t1
      where t1.estado <> 'ANULADO' and t1.id_orden_CAB = ? and t1.tipo = 'SERVICIOS'
      `,[id])

      let final = Object.groupBy(info_guias,(row)=>row.servicio)

      let formateado = Object.keys(ruta).reduce((c,v)=>{
        if(!Object.keys(c).includes(v)) c[v] = []
        return c
      },final)

      let estadofase = Object.keys(ruta).reduce((c,v)=>{
        c[v] = formateado[v].length == 0 || formateado[v].filter(row=>row.estado !== 'FINALIZADO').length > 0 ? true : false
        return c
      },{})

	    console.log("La informafion organizada por servicio es:",formateado,estadofase)
      const [infodespachoacabados] = await conn.query(`
        select JSON_ARRAYAGG(JSON_OBJECT('id',tdc.idx,'fase',tdc.fase,'idguia',tdc.id_guia_origen,'nro_guia',tdc.nro_guia,'id_orden_origen',tdc.id_orden_origen,'nro_orden_origen',tdc.nro_orden_origen,'fecha_ingreso',tdc.fec_despacho,'despacho',
        (select sum(tdd.despacho) from tbl2_despachos_det tdd where tdc.idx = tdd.id_despacho_CAB))) as despachos
        from tbl2_despachos_cab tdc
        where tdc.id_orden_origen = ?
        HAVING COUNT(tdc.idx) > 0
      `,[id])

      console.log("Info de despacho y acabados :",infodespachoacabados)

      return [ordenes,moldes,cortes,infoguias,formateado,estadofase,infodespachoacabados]
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  static async ActualizaCombos(){
    let conn
    console.log("Comienza la actualizadoin")
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let [info] = await conn.query("SELECT *FROM tbl2_fases_prod_hojacorte tb1 WHERE idx NOT IN (SELECT DISTINCT id_orden_CAB FROM tbl2_fases_prod_hojacorte_combos)")
      let contador = 1

      let grupo_combos = [1,2,3,4,5,6,7,8,9,10,11,12,13,14]

      // console.log("Info de ordenes :",info)
      let pp = info.reduce((carry,value)=>{
        // console.log("Info de orden: ",value)
        let array_combos = grupo_combos.reduce((c,v)=>{
          value[`combo${v}_corte`] && c.push([value.idx,'NEGRO',value[`combo${v}_corte`]])
          return c
        },carry)
        // console.log("Array de combos:",array_combos)
        // carry.push({idx:value.idx,array_combos})
        return carry
      },[])

      await conn.query("INSERT INTO tbl2_fases_prod_hojacorte_combos(id_hojacorte_CAB,color_combo,cantidad_combo) VALUES ? ",[pp])

      console.log("Lista de ordene formateado para combos :",pp)

      // let actualiza = async ()=>{
      //   let orden = lista_ordenes.shift()
      //   if(orden){
      //     await conn.query("insert into tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) values(?,?,?)",[info.id_hojacorte,'NEGRO',info[0][`combo${contador}_orden`]])
      //     contador += 1
      //     await actualiza()
      //   }else{

      //   }
      // }
    

      // if (conn) conn.rollback();
      if (conn) conn.commit();
      return {ok:true,message:'aja'}
    } catch (err) {
      if (conn) conn.rollback();
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async regulaLizzet(){
    let conn
    console.log("Dentro de regula lizzet")
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      // console.log("La data de lizset es:",info de lizzet pronto)

      // let p1 = ''
      // for(let combo of [...infolizzet]){
      //   p1 += " WHEN idx = " + combo.idx + " THEN " + combo.cantidad
      // }
      // p1 = `CASE ${p1} END`

      // await conn.query("UPDATE tbl2_inventario_det SET cantidad = " + p1 + " WHERE id_inventario_CAB = 789")

      // let [verifica] = await conn.query("select sum(cantidad) from tbl2_inventario_det where id_inventario_CAB = 789")
      // console.log("El tocal actuzliado 3es :",verifica)

      // if (conn) conn.rollback();
      if (conn) conn.commit();
      return {ok:true,message:'aja'}
    } catch (err) {
      if (conn) conn.rollback();
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getCorrelativoProduccion(tipo,conn){
    let correlativo = null
    try {
      const [result] = await conn.execute("SELECT CONCAT(DATE_FORMAT(NOW(),'%y'),SUBSTRING(numero,-5,5)) as numero FROM tbl2_fases_produccion_correlativo WHERE ruc_ = ? AND anio = YEAR(NOW()) AND tipo = ? FOR UPDATE",['20522094120',tipo])
      if(result.length == 0){
        await conn.execute("UPDATE tbl2_fases_produccion_correlativo SET anio = YEAR(NOW()), numero = 1 WHERE ruc_ = ? AND tipo = ?",['20522094120',tipo])
        correlativo = (new Date()).toLocaleDateString("es-MX",{year:"numeric"}) + '00001'
      } else{
        correlativo = result[0].numero
      }
      await conn.execute("UPDATE tbl2_fases_produccion_correlativo SET anio = YEAR(NOW()), numero = numero + 1 WHERE ruc_ = ? AND tipo = ?",['20522094120',tipo])
      return {ok:true,resp:correlativo}
    } catch (error) {
      return {ok:false,resp:0}
    }
  }
  static async getCorrelativoProduccionPreview(tipo){
    let correlativo = null
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      const [result] = await conn.execute("SELECT CONCAT(DATE_FORMAT(NOW(),'%y'),SUBSTRING(numero,-5,5)) as numero FROM tbl2_fases_produccion_correlativo WHERE ruc_ = ? AND anio = YEAR(NOW()) AND tipo = ? FOR UPDATE",['20522094120',tipo])
      if(result.length == 0){
        correlativo = (new Date()).toLocaleDateString("es-MX",{year:"numeric"}) + '00001'
      } else{
        correlativo = result[0].numero
      }
      return {ok:true,resp:correlativo}
    } catch (error) {
      console.log(error)
      return {ok:false,resp:0}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getPlantillasTallas(){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.execute("select *from tbl2_tallas_template")
      result = result.reduce((c,v)=>{
        v.tallasformateado = v.tallas.map(row=>row.desc).join("-")
        v.selected = c.length > 0 ? false : true
        c.push(v)
        return c
      },[])
      console.log("La info de plantillas de tallas es :",result)
      return result
    } catch (error) {
      console.log(error)
      return {ok:false,resp:0}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getInsumosOrden(idorden,idalmacen) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      
      let [results] = await conn.query(`
        SELECT
          t1.id_subprod_CAB,
          t1.id_producto_CAB,
          (select tp.nom from tbl2_productos tp where tp.idx = t1.id_producto_CAB) as producto,
          ts.idx_CAB_COLOR,
          (select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR) as color,
          ts.idx_talla,
          ts.talla,
          (select tp.codUnidadMedida from tbl2_productos tp where tp.idx = t1.id_producto_CAB) as unidad,
          (select tp.tipo from tbl2_productos tp where tp.idx = t1.id_producto_CAB) as tipo,
          COALESCE(pc.lote,0) AS lote,
          if(ISNULL(tc.idx),
            COALESCE((
              select sum(tboc.cantidad_combo) from tbl2_fases_prod_ordenes_combos tboc 
              where tboc.id_orden_CAB = t1.id_orden_CAB and JSON_CONTAINS(tboc.insumos,CAST(ifnull(t1.id_subprod_CAB,-1) as CHAR))
            ),0),
            COALESCE((
              select sum(tbcc.cantidad_combo) from tbl2_fases_prod_hojacorte_combos tbcc 
              where tbcc.id_hojacorte_CAB = tc.idx and JSON_CONTAINS(tbcc.insumos,CAST(ifnull(t1.id_subprod_CAB,-1) as CHAR))
            ),0)
          )*t1.cantidad as comprometido,
          -- COALESCE(t1.cantidad,0) as comprometido,
          COALESCE((
            select SUM(COALESCE(tkcd.Cant_despacho_DET,0)) from tbl_kard_compras_CAB tkcc 
            join tbl_kard_compras_DET tkcd on tkcc.id_CAB = tkcd.id_CAB_DET 
            where tkcc.id_orden = t1.id_orden_CAB and tkcd.id_subprod = t1.id_subprod_CAB and tkcd.num_lote = COALESCE(pc.lote,0)
          ),0) as entregado,
          COALESCE((
            select SUM(COALESCE(tad.cantidad,0)) from tbl2_almacen_det tad where tad.id_CAB_DET = ? and tad.idx_subproducto = t1.id_subprod_CAB and tad.lote = COALESCE(pc.lote,0)
          ),0) as stock
        FROM tbl2_fases_prod_ordenes t0
        LEFT JOIN tbl2_fases_prod_hojacorte tc on t0.idx = tc.id_cab_orden 
        JOIN tbl2_fases_prod_ordenes_insumos t1 on t0.idx = t1.id_orden_CAB
        JOIN tbl2_subproductos ts ON t1.id_subprod_CAB = ts.idx
        LEFT JOIN (
          SELECT tor.id_pedido_CAB as lote,tor.id_orden_CAB,tpi.id_subprod_CAB 
          FROM tbl2_fases_prod_ordenes_requerimientos tor
          JOIN tbl2_pedidos_insumos_det tpi ON tor.id_pedido_CAB = tpi.id_pedido_CAB
        ) as pc ON pc.id_orden_CAB = t1.id_orden_CAB and pc.id_subprod_CAB = t1.id_subprod_CAB
        WHERE t0.idx = ?
      `,[idalmacen,idorden])

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) await conn.end();
    }
  }
}
