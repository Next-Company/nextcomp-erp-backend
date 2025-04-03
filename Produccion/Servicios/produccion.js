import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise";
// import { inventario } from "../../Main/config.js";
export class ProduccionModel {
  static async getOrdenes(user_data) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      console.log(conn)
      const [results, fields] = await conn.query("select * from viewProduccionOrdenes order by idx desc");
      await conn.end();
      // conn = await conn_jsjfact.getConnection()
      // console.log("Mostrando connect de busqueda ordens total:",conn)
      // const sql = "select * from viewProduccionOrdenes"
      // const [results, fields] = await conn.query(sql);
      // console.log("MOstrando total ordenes:",results[0])s

      return results
    } catch (err) {
      console.log(err);
      return { 'msg': err }
    } finally {
      if (conn) {
        // console.log("Cerrando sessio")
        // conn.release()
        await conn.end();
      }
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
      console.log('Busqueda de ordenes produccion :',query)
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

  static async pushItems_back(info, user_data) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      console.log("La conexion creada :", conn)
      let sql = ''
      const table = info.table
      const id = info.idx
      console.log("Empezando push item")

      if (id == '') {
        sql = 'SELECT *FROM `' + table + '` LIMIT 1';
      } else {
        sql = 'SELECT *FROM `' + table + '` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id + ' LIMIT 1';
      }
      const [consulta, fields] = await conn.execute(sql)

      // const [consulta, fields] = await conn_jsjfact.query('SELECT *FROM `'+ table +'` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id +' LIMIT 1');
      // const [consulta, fields] = await conn_jsjfact.query('SELECT *FROM `'+ table +'` LIMIT 1');
      console.log("La primera busqueda es: ", consulta, fields)
      if (id == '') {
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])
        sql = 'INSERT INTO `' + table + '`(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')';
        const [result] = await conn.execute(sql, values)

      } else {

        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])

        if (consulta.length > 0) {
          sql = 'UPDATE `' + table + '` SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE `' + (table == 'tbl2_fases_prod_ordenes' ? 'idx' : 'id_cab_orden') + '` = ' + id;
        } else {
          sql = 'INSERT INTO `' + table + '`(id_cab_orden,' + campos.toString() + ') VALUES (' + id + ',' + campos.map(row => "NULLIF(?, '')").toString() + ')';
        }
        console.log(sql)
        const [result] = await conn.execute(sql, values)
        // console.log(sql)
      }
      await conn.end();
      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con xito'}]
      return [err]
    } finally {
      if (conn) {
        console.log("Cerrando session")
        await conn.end();
      }
    }
  }

  static async pushItems(info, user_data) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      let sql = ''
      const table = info.table
      const id = info.idx
      console.log("Empezando push item")

      if (id == '') {
        sql = 'SELECT *FROM `' + table + '` LIMIT 1';
      } else {
        sql = 'SELECT *FROM `' + table + '` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id + ' LIMIT 1';
      }
      const [consulta, fields] = await conn.execute(sql)

      console.log("La primera busqueda es: ", consulta, fields)
      if (id == '') {
        const campos = Object.keys(info).reduce((carry, current) => {
          fields.map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])
        sql = 'INSERT INTO `' + table + '`(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')';
        console.log(sql,values)
        const [result] = await conn.execute(sql, values)

      } else {

        const campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        const values = campos.map(row => info[row])

        if (consulta.length > 0) {
          sql = 'UPDATE `' + table + '` SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE `' + (table == 'tbl2_fases_prod_ordenes' ? 'idx' : 'id_cab_orden') + '` = ' + id;
        } else {
          sql = 'INSERT INTO `' + table + '`(id_cab_orden,' + campos.toString() + ') VALUES (' + id + ',' + campos.map(row => "NULLIF(?, '')").toString() + ')';
        }
        console.log("Consulta de insertado:",sql)
        const [result] = await conn.execute(sql, values)
        // console.log(sql)
      }
      await conn.end();
      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con xito'}]
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
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
      const [results, fields] = await conn.query('DELETE FROM `tbl2_fases_prod_ordenes` WHERE `idx` = "' + id + '"');
      await conn.end();
      return [{ ok: true, mensaje: 'Registro Eliminado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async getListaEstampados(){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *,if(date(now()) = date(created_at),1,0) as enabled FROM tbl2_seguimiento_estampado_cab ORDER BY created_at DESC');



      results.forEach(row=>{
        const fecha = new Date(Date.now()).toLocaleDateString()
      })



      await conn.end();
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async getInfoEstampado(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_seguimiento_estampado_det where id_seguimiento_cab = ?',[id]);
      await conn.end();
      
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoEstampadoCab(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_seguimiento_estampado_cab where idx = ?',[id]);
      await conn.end();
      
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async saveInfoEstampado(data){
    let conn
    // console.log(info)-
    const results = {ok:true,message:'test'}
    const detalle = JSON.parse(data.info)
    console.log('Detalle multiple:',detalle)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      if(data.id){
        const [res,fld] = await conn.query("select *from tbl2_seguimiento_estampado_det where id_seguimiento_cab = "+ parseInt(data.id))
        // const ids_delete = detalle.filter(row=> row.idx !== ''  && !res.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 
        const ids_delete = res.filter(row=> row.idx !== ''  && !detalle.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 
        console.log("Filas a eliminar:",ids_delete)

        console.log("Actualizando")
        const insert = async ()=>{
          const fila = detalle.shift()
          if(fila){
            if(fila.idx == ''){
              console.log("Dentro de insertado")
              const [results, fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones,cliente,nro_fallados,marca) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[data.id,fila.op,fila.nro_corte,fila.modelo,fila.nro_polos,fila.nro_paquetes,fila.nro_personal,fila.tipo_estampado,fila.estado,fila.avance,fila.observaciones,fila.cliente,fila.nro_fallados,fila.marca]);
              // insert()
            }else{
              console.log("Dentro de actualizados")
              const [results, fields] = await conn.query('UPDATE tbl2_seguimiento_estampado_det SET op=NULLIF(?, ""),nro_corte=NULLIF(?, ""),modelo=NULLIF(?, ""),nro_polos=NULLIF(?, ""),nro_paquetes=NULLIF(?, ""),nro_personal=NULLIF(?, ""),tipo_estampado=NULLIF(?, ""),estado=NULLIF(?, ""),avance=NULLIF(?, ""),observaciones=NULLIF(?, ""),cliente=NULLIF(?, ""),nro_fallados=NULLIF(?, ""),marca=NULLIF(?, "") WHERE idx = ? and id_seguimiento_cab = ?',[fila.op,fila.nro_corte,fila.modelo,fila.nro_polos,fila.nro_paquetes,fila.nro_personal,fila.tipo_estampado,fila.estado,fila.avance,fila.observaciones,fila.cliente,fila.nro_fallados,fila.marca,fila.idx,data.id]);
              // insert()
            }
            await insert()
          }else{
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async ()=>{
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_seguimiento_estampado_det` WHERE `id_seguimiento_cab` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar()
        
        console.log("Continua proceso")
        return results
      }else{
        console.log("Creando")
        const [res,fld] = await conn.query("insert into tbl2_seguimiento_estampado_cab(observaciones) values('OTRAS OBSERVACIONES')")

        const insert = async ()=>{
          const fila = detalle.shift()
          console.log("Nueva fila detalle juan :",fila)
          if(fila){
            console.log("dentro del insertado")
            // const [results,fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.op,fila.nro_corte,fila.modelo,fila.nro_polos,fila.nro_paquetes,fila.nro_personal,fila.tipo_estampado,fila.estado,fila.avance,fila.observaciones,fila.marca]);
            const [results,fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones,marca,cliente) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.op,fila.nro_corte,fila.modelo,fila.nro_polos,fila.nro_paquetes,fila.nro_personal,fila.tipo_estampado,fila.estado,fila.avance,fila.observaciones,fila.marca,fila.cliente]);
            await insert()
          }else{
            return Promise.resolve('')
          }
        }
        await insert()
        await conn.end();
        return results
      }

    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        console.log("Terminando consultas")
        await conn.end();
      }
    }
  }
  static async eliminarInfoEstampado(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.query('DELETE FROM `tbl2_seguimiento_estampado_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_seguimiento_estampado_det` WHERE `id_seguimiento_cab` = "' + id + '"');
      await conn.end();
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }

  //////////////////////////////////
  //seccion guias traslado interno
  //////////////////////////////////
  static async getListaGuias(search){
    console.log("Obteniendo listado de guais de traslado")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(tipo),' ',TRIM(idx),' ',TRIM(orden_ref),' ',TRIM(servicio),' ',TRIM(producto),' ',TRIM(proveedor),' ',TRIM(modelo))) > 0").join(" ") : ""

      // let query = `SELECT idx,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      // (
      //   select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      // ) as cantidad_servicio,
      // (
      //   select sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)) as total from tbl2_despachos_cab tdc 
      //   join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      //   where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      // ) as ingresos
      // FROM tbl2_guias_traslado_cab where 1=1 ${search !== '_' ? extra : ''} order by created_at desc limit 100`

      // console.log("Query de busqueda:",quEry)
      let query = `SELECT idx,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos
      FROM tbl2_guias_traslado_cab where tipo = 'SERVICIOS' ${search !== '_' ? extra : ''} order by created_at desc limit 100`
      console.log("Consulta lista guias:",query)

      const [results, fields] = await conn.query(query);

      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async getListaMuestras(search){
    console.log("Obteniendo listado de guais de trasladosssssssssssss")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(COALESCE(tipo,'')),' ',TRIM(idx),' ',TRIM(COALESCE(orden_ref,'')),' ',TRIM(COALESCE(servicio,'')),' ',TRIM(COALESCE(producto,'')),' ',TRIM(COALESCE(proveedor,'')),' ',TRIM(COALESCE(modelo,'')))) > 0").join(" ") : ""

      // let query = `SELECT idx,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      // (
      //   select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      // ) as cantidad_servicio,
      // (
      //   select sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)) as total from tbl2_despachos_cab tdc 
      //   join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      //   where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      // ) as ingresos
      // FROM tbl2_guias_traslado_cab where tipo <> 'SERVICIOS' ${search !== '_' ? extra : ''} order by created_at desc limit 100`
      let query = `SELECT idx,orden_ref,producto,responsable,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos
      FROM tbl2_guias_traslado_cab where tipo <> 'SERVICIOS' ${search !== '' ? extra : ''} order by created_at desc limit 100`
      console.log("Query de busqueda:",query)

      const [results, fields] = await conn.query(query);

      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  // static async getInfoGuias(id){
  //   let conn
  //   try {
  //     conn = await mysql.createConnection(configs[1])
  //     await conn.connect();
  //     const [results, fields] = await conn.query('SELECT *FROM tbl2_seguimiento_estampado_det where id_seguimiento_cab = ?',[id]);
  //     await conn.end();
      
  //     return results
  //   } catch (err) {
  //     return [err]
  //   } finally {
  //     if (conn) {
  //       await conn.end();
  //     }
  //   }
  // }
  static async getInfoGuiaCab(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT idx,orden_ref,destino,tipo,motivo_traslado,id_proveedor_CAB,proveedor,servicio,responsable,modelo,marca,producto,DATE_FORMAT(fec_emision,"%d/%m/%Y") as fec_emision_guia,fec_emision,fec_recepcion,fec_retorno,DATE_FORMAT(fec_retorno,"%d/%m/%Y") as fec_retorno_guia, date_format(fec_recepcion,"%d/%m/%Y") as fec_recepcion_guia,costo,observaciones,estado,created_at, DATEDIFF(STR_TO_DATE(fec_retorno,"%Y-%m-%d"), STR_TO_DATE(fec_emision,"%Y-%m-%d")) as duracion FROM tbl2_guias_traslado_cab where idx = ?',[id]);
      await conn.end();
      
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoGuiaDet(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT tb2.servicio,tb2.marca,tb2.modelo,tb1.*FROM tbl2_guias_traslado_det tb1 join tbl2_guias_traslado_cab tb2 on tb1.id_guia_CAB = tb2.idx where id_guia_CAB = ?',[id]);
      const ids = results.map(row=>row.idx)

      const [results2] = await conn.query("select id_guia_DET,concat('({',GROUP_CONCAT(concat(talla,':',CAST(cantidad as unsigned))),'})') as fracciones from tbl2_guias_traslado_det_fracciones where id_guia_DET in (?) group by id_guia_DET",[ids])

      let new_articulos = results.map(row=>{
        let add = eval(results2.filter(row2=>row2.id_guia_DET == row.idx)[0].fracciones)
        return {...row,...add}
      })

      await conn.end();
      return new_articulos
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async searchGuia(search){
    let conn
    try {
      console.log("Buscando guias de traslado - searchGuia")
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(idx),' ',TRIM(COALESCE(proveedor,'')),' ',TRIM(COALESCE(servicio,'')),' ',TRIM(COALESCE(producto,'')),' ',TRIM(COALESCE(marca,'')),' ',TRIM(COALESCE(modelo,'')),' ')) > 0").join(" ") : ""

      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? 'and ( ruc like ? or nom like ? )' : '') + ' limit 50',[`%${search}%`,`%${search}%`]);

      let query = 'SELECT *FROM tbl2_guias_traslado_cab where 1=1 ' + (search !== '' ? extra : '') + ' limit 50'
      console.log("Query de busqueda:",query)

      const [results, fields] = await conn.query('SELECT *FROM tbl2_guias_traslado_cab where 1=1 ' + (search !== '_' ? extra : '') + ' limit 50');
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
  static async saveInfoGuias(data){
    let conn
    console.log("Info del formulario:",data)
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)
    console.log('Detalle multiple:',cabecera)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      if(data.id){
        await conn.query('UPDATE tbl2_guias_traslado_cab SET orden_ref=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),servicio=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),fec_recepcion=NULLIF(?, ""),costo=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, ""),motivo_traslado=NULLIF(?, ""),responsable=NULLIF(?, ""),modelo=NULLIF(?, ""),marca=NULLIF(?, ""),producto=NULLIF(?, ""),destino=NULLIF(?, "") WHERE idx = ?',[cabecera.orden_ref,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.servicio,cabecera.fec_emision,cabecera.fec_retorno,cabecera.fec_recepcion,cabecera.costo,cabecera.observaciones,cabecera.estado,cabecera.motivo_traslado,cabecera.responsable,cabecera.modelo,cabecera.marca,cabecera.producto,cabecera.destino,parseInt(data.id)])
        const [res,fld] = await conn.query("SELECT *FROM tbl2_guias_traslado_det WHERE id_guia_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 

        const insert = async ()=>{
          const fila = articulos.shift()
          if(fila){
            let fracciones = []
            if(fila.idx && fila.idx !== ''){
              console.log("Dentro de 1 actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_guias_traslado_det SET articulo=NULLIF(?, ""),cantidad=NULLIF(?, ""),isprototipo=NULLIF(?, "") WHERE idx = ? and id_guia_CAB = ?',[fila.articulo,fila.cantidad,fila.isprototipo,fila.idx,parseInt(data.id)]);
              // insert()
              fracciones = Object.keys(fila).filter(valor=>['xs','s','m','l','xl','xxl'].includes(valor)).reduce((carry,value)=>{
                carry.push([fila.idx,value,parseInt(fila[value])])
                return carry
              },[])
              console.log("Detalle de las fracciones :",fracciones)
            }else{
              console.log("Dentro de 2 insertado")
              const [results, fields] = await conn.query('INSERT INTO tbl2_guias_traslado_det(id_guia_CAB,articulo,cantidad,isprototipo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.articulo,fila.cantidad,fila.isprototipo]);
              // insert()
              fracciones = Object.keys(fila).filter(valor=>['xs','s','m','l','xl','xxl'].includes(valor)).reduce((carry,value)=>{
                carry.push([results.insertId,value,parseInt(fila[value])])
                return carry
              },[])
            }
            // console.log("Dentro de actualizado las fracciones son :",fracciones)
            await conn.query('REPLACE INTO tbl2_guias_traslado_det_fracciones(id_guia_DET,talla,cantidad) values ?',[fracciones])

            await insert()
          }else{
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async ()=>{
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_guias_traslado_det` WHERE `id_guia_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar()
        
      }else{
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_guias_traslado_cab(orden_ref,tipo,id_proveedor_CAB,proveedor,servicio,fec_emision,fec_retorno,costo,observaciones,motivo_traslado,responsable,modelo,marca,producto,destino) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[cabecera.orden_ref,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.servicio,cabecera.fec_emision,cabecera.fec_retorno,cabecera.costo,cabecera.observaciones,cabecera.motivo_traslado,cabecera.responsable,cabecera.modelo,cabecera.marca,cabecera.producto,cabecera.destino])

          const insert = async ()=>{
            const fila = articulos.shift()
            console.log("Nueva fila detalle juan :",fila)
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_guias_traslado_det(id_guia_CAB,articulo,cantidad,isprototipo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.articulo,fila.cantidad,fila.isprototipo]);

              const fracciones = Object.keys(fila).filter(valor=>['xs','s','m','l','xl','xxl'].includes(valor)).reduce((carry,value)=>{
                carry.push([results.insertId,value,parseInt(fila[value])])
                return carry
              },[])
              const [results2] =  await conn.query('INSERT INTO tbl2_guias_traslado_det_fracciones(id_guia_DET,talla,cantidad) values ?',[fracciones]);

              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()

        }catch(err){
          console.log("error en la consulta",err)
        }
      
        // console.log("filas afectadas :",res)
        await conn.end();
        return results
      }

    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        console.log("Terminando consultas")
        await conn.end();
      }
    }
  }
  static async eliminarInfoGuias(id){
    let conn
    // console.log("El id de eliminado es el siguiente:",id)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.query('DELETE FROM `tbl2_guias_traslado_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_guias_traslado_det` WHERE `id_guia_CAB` = "' + id + '"');
      await conn.end();
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoGuiaDespacho(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [results, fields] = await conn.query(`
      SELECT tpid.idx,tpid.articulo,'' as color,tpid.cantidad,tgtc.costo,dp.idx as id_despacho,dp.despacho,COALESCE(dp.precio,0) as precio_despacho
      FROM tbl2_guias_traslado_det tpid 
      JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
      JOIN(
        SELECT tdc.id_guia_origen,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho FROM tbl2_despachos_cab tdc 
        LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
      WHERE tpid.id_guia_CAB = ?`,[id]);

      const ids = results.map(row=>row.idx)
      console.log("Lista de ids:",ids)

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
  static async getListaProveedores(limit){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" limit ?',[parseInt(limit)]);
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
  static async searchProveedor(search){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(ruc),' ',TRIM(nom),' ',TRIM(direccion))) > 0").join(" ") : ""

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
  static async searchProveedorById(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" and idx = ?',[id]);
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
  //////////////////////////////////
  //seccion guias traslado interno
  //////////////////////////////////
  static async getListaPedidos(limit = 100){
    console.log("Obteniendo listado de guais de traslado")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query("SELECT idx,orden_ref,tipo,proveedor,fec_emision,fec_retorno,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,forma_pago,estado FROM tbl2_pedidos_insumos_cab order by created_at desc limit ?",[parseInt(limit)]);

      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async saveInfoPedidos(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      conn.beginTransaction()
      if(data.id){
        await conn.query('UPDATE tbl2_pedidos_insumos_cab SET orden_ref=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),forma_pago=NULLIF(?, ""),nro_contacto=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, ""),moneda=NULLIF(?, ""),igv=NULLIF(?, "") WHERE idx = ?',[cabecera.orden_ref,cabecera.fec_emision,cabecera.fec_retorno,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.forma_pago,cabecera.nro_contacto,cabecera.observaciones,cabecera.estado,cabecera.moneda,cabecera.igv,parseInt(data.id)])

        const [res,fld] = await conn.query("SELECT *FROM tbl2_pedidos_insumos_det WHERE id_pedido_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 

        const insert = async ()=>{
          const fila = articulos.shift()
          if(fila){
            let fracciones = []
            if(fila.idx && fila.idx !== ''){
              console.log("Dentro de 1 actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_pedidos_insumos_det SET id_pedido_CAB=NULLIF(?, ""),id_producto_CAB=NULLIF(?, ""),producto=NULLIF(?, ""),color=NULLIF(?, ""),rollos=NULLIF(?, ""),cantidad=NULLIF(?, ""),unidad=NULLIF(?, ""),precio=NULLIF(?, ""),anulado=NULLIF(?, "") WHERE idx = ?',[parseInt(data.id),fila.id_producto_CAB,fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,fila.precio,fila.anulado,fila.idx]);

            }else{
              console.log("Dentro de 2 insertado")
              const [results,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,id_producto_CAB,producto,color,rollos,cantidad,unidad,precio,anulado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.id_producto_CAB,fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,fila.precio,fila.anulado]);

            }
            await insert()
          }else{
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async ()=>{
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_pedidos_insumos_det` WHERE `id_pedido_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar()
        
      }else{
        console.log("Creandsssso")
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_cab(orden_ref,fec_emision,fec_retorno,tipo,id_proveedor_CAB,proveedor,responsable,forma_pago,nro_contacto,observaciones,estado,moneda,igv) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[cabecera.orden_ref,cabecera.fec_emision,cabecera.fec_retorno,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.forma_pago,cabecera.nro_contacto,cabecera.observaciones,cabecera.estado,cabecera.moneda,cabecera.igv])

          const insert = async ()=>{
            const fila = articulos.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,id_producto_CAB,producto,color,rollos,cantidad,unidad,precio) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.id_producto_CAB,fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,fila.precio]);
              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()

        }catch(err){
          console.log("error en la consulta",err)
        }
        // await conn.end();
        // return results
      }

    } catch (err) {
      console.log(err)
      if (conn) {
        conn.rollback()
        await conn.end();
      }
      return [err]
    } finally {
      if (conn) {
        // conn.rollback()
        conn.commit()
        await conn.end();
      }
    }
  }
  static async getInfoPedidoCab(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT DATE_FORMAT(tpic.fec_emision,"%d/%m/%Y") as fec_emision_cuadre,DATE_FORMAT(tpic.fec_retorno,"%d/%m/%Y") as fec_retorno_cuadre,DATEDIFF(STR_TO_DATE(tpic.fec_retorno,"%Y-%m-%d"), STR_TO_DATE(tpic.fec_emision,"%Y-%m-%d")) as duracion,tp.ruc_ as ruc,tpic.* FROM tbl2_pedidos_insumos_cab tpic join tbl2_proveedor tp on tpic.id_proveedor_CAB = tp.idx where tpic.idx = ?',[id]);
      await conn.end();
      
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoPedidoDet(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_pedidos_insumos_det where id_pedido_CAB = ?',[id]);
      const ids = results.map(row=>row.idx)

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
  static async getInfoPedidoDespacho(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [results, fields] = await conn.query(`
      SELECT tpid.idx,tpid.producto,tpid.color,tpid.cantidad,tpid.precio,dp.idx as id_despacho,dp.despacho,dp.precio as precio_despacho
      FROM tbl2_pedidos_insumos_det tpid 
      JOIN(
        SELECT tdc.id_pedido_origen,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho FROM tbl2_despachos_cab tdc 
        LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      ) AS dp on tpid.id_pedido_CAB = dp.id_pedido_origen and tpid.idx = dp.id_item
      WHERE tpid.id_pedido_CAB = ? and COALESCE(tpid.anulado,0) = 0`,[id]);

      const ids = results.map(row=>row.idx)
      console.log("Lista de ids:",ids)

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
  static async eliminarInfoPedidos(id){
    let conn
    // console.log("El id de eliminado es el siguiente:",id)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.query('DELETE FROM `tbl2_pedidos_insumos_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_pedidos_insumos_det` WHERE `id_pedido_CAB` = "' + id + '"');
      await conn.end();
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  //////////////////////////////////
  //seccion guias traslado interno
  //////////////////////////////////
  static async getListaDespachos(tipo,search){
    console.log("El filtro de busqueda es :",search)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      let extra = search.split(" ").length > 0 ? search.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(COALESCE(tdc.tipo,'')),' ',TRIM(COALESCE(tdc.proveedor,'')),' ',TRIM(COALESCE(tdc.nro_guia,'')),' ',TRIM(COALESCE(COALESCE(tgtc.servicio,''),'')),' ',TRIM(COALESCE(tgtc.producto,'')),' ',TRIM(COALESCE(tgtc.marca,'')),' ',TRIM(COALESCE(tgtc.modelo,'')))) > 0").join(" ") : ""

      const consulta = `SELECT tdc.idx,tdc.fec_emision_guia,tdc.fec_despacho,tdc.id_proveedor_CAB,tdc.proveedor,tdc.tipo,tdc.nro_guia,tdc.id_guia_origen,tdc.nro_guia_origen,tdc.id_pedido_origen,tdc.nro_pedido_origen,tdc.responsable,tdc.observaciones,tdc.created_at,tgtc.servicio,tgtc.producto,tgtc.marca,tgtc.modelo
      FROM tbl2_despachos_cab tdc 
      left join tbl2_guias_traslado_cab tgtc on tdc.id_guia_origen = tgtc.idx
      left join tbl2_pedidos_insumos_cab tpic on tdc.id_pedido_origen = tpic.idx
      WHERE tdc.tipo = '${tipo}' ${extra}
      ORDER BY created_at desc`
      
      console.log("Mostrado query de lista despachos:",consulta)
      
      const [results, fields] = await conn.query(consulta);
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        // console.log("Cerrando session")
        // await conn.end();
        await conn.end();
      }
    }
  }
  static async saveInfoDespachos(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)
    const facturas = JSON.parse(data.facturas)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    console.log("Informacion facturas:",facturas)
    // return results
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()
      if(data.id){
        await conn.query('UPDATE tbl2_despachos_cab SET fec_emision_guia=NULLIF(?, ""),fec_despacho=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),id_guia_origen=NULLIF(?, ""),nro_guia_origen=NULLIF(?, ""),id_pedido_origen=NULLIF(?, ""),nro_pedido_origen=NULLIF(?, ""),observaciones=NULLIF(?, ""),nro_guia=NULLIF(?, ""),nro_factura=NULLIF(?, ""),imp_factura=NULLIF(?, "") WHERE idx = ?',[cabecera.fec_emision_guia,cabecera.fec_despacho,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.id_guia_origen,cabecera.nro_guia_origen,cabecera.id_pedido_origen,cabecera.nro_pedido_origen,cabecera.observaciones,cabecera.nro_guia,cabecera.nro_factura,cabecera.imp_factura,parseInt(data.id)])

        const [res,fld] = await conn.query("SELECT *FROM tbl2_despachos_det WHERE id_despacho_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 

        const insert = async ()=>{
          const fila = articulos.shift()
          if(fila){
            if(fila.idx && fila.idx !== ''){
              console.log("Detro de la actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_despachos_det SET precio=NULLIF(?, ""),despacho=NULLIF(?, ""),caidos=NULLIF(?, "") WHERE idx = ? and id_despacho_CAB = ?',[fila.precio,fila.despacho,fila.caidos,fila.idx,parseInt(data.id)]);
            }else{
              const [results,fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.id_item,fila.despacho,fila.caidos]);
            }
            await insert()
          }else{
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()
        console.log("Lista de filas a eliminar:",ids_delete)
        const eliminar = async ()=>{
          console.log("Eliminando")
          const fila = ids_delete.shift()
          if(fila){
            await conn.query('DELETE FROM `tbl2_despachos_det` WHERE `id_despacho_CAB` = ? and `idx` = ?',[parseInt(data.id),parseInt(fila.idx)])
            await eliminar()
          }else{
            return Promise.resolve('')
          }
        }
        await eliminar()
      }else{
        // console.log("La info de cabecera es:",cabecera)
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_despachos_cab(fec_emision_guia,fec_despacho,tipo,id_proveedor_CAB,proveedor,responsable,id_guia_origen,nro_guia_origen,id_pedido_origen,nro_pedido_origen,observaciones,nro_guia,nro_factura,imp_factura) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[cabecera.fec_emision_guia,cabecera.fec_despacho,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.id_guia_origen,cabecera.nro_guia_origen,cabecera.id_pedido_origen,cabecera.nro_pedido_origen,cabecera.observaciones,cabecera.nro_guia,cabecera.nro_factura,cabecera.imp_factura])

          const insert = async ()=>{
            const fila = articulos.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,precio,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.idx,fila.precio,parseFloat(fila.despacho),parseFloat(fila.caidos ?? 0)]);

              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()

          const insert2 = async ()=>{
            const fila = facturas.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_despachos_adi(id_despacho_CAB,serie,numero,fec_emision,unidades,importe_bruto,base_imponible,monto_inafecto,igv,importe_total) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.serie,fila.numero,fila.fec_emision,parseFloat(fila.unidades),parseFloat(fila.importe_bruto),parseFloat(fila.base_imponible),parseFloat(fila.monto_inafecto),parseFloat(fila.igv),parseFloat(fila.importe_total)]);

              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          ( cabecera.id_pedido_origen ?? false ) && await insert2()

        }catch(err){
          console.log("error en la consulta",err)
        }
        // await conn.end();
        // return results
      }

    } catch (err) {
      if (conn) {
        console.log(err)
        conn.rollback()
        await conn.end();
      }
      return [err]
    } finally {
      if (conn) {
        console.log("Terminando consultas")
        conn.commit()
        // conn.rollback()
        await conn.end();
      }
    }
  }
  static async getInfoDespachoCab(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_despachos_cab where idx = ?',[id]);
      await conn.end();
      
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoDespachoDet(id,tipo=null){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let new_articulos = null
      if(tipo == 'PEDIDOS'){
        const [data, fields] = await conn.query('select tgtd.idx,tgtd.id_pedido_CAB,tgtd.id_producto_CAB,tgtd.producto,tgtd.color,tgtd.rollos,tgtd.cantidad,tgtd.unidad,tgtd.anulado,tdd.precio,tdd.despacho from tbl2_pedidos_insumos_det tgtd join tbl2_despachos_det tdd on tdd.id_item = tgtd.idx where tdd.id_despacho_CAB = ?',[id]);
        new_articulos = data
      }else{
        console.log("El id del despacho es: ",id)
        const [results, fields] = await conn.query(`
          SELECT tdd.idx,tdd.id_item,tgtc.servicio,tgtc.modelo,tgtd.id_guia_CAB,tgtd.articulo,tgtd.cantidad,tgtd.isprototipo,
          tdd.despacho,tdd.caidos 
          FROM tbl2_guias_traslado_det tgtd 
          JOIN tbl2_despachos_det tdd on tdd.id_item = tgtd.idx 
          JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tgtd.id_guia_CAB
          WHERE tdd.id_despacho_CAB = ?
        `,[id]);
        console.log(results)
        const ids = results.map(row=>row.id_item)
  
        const [results2] = await conn.query("select id_guia_DET,concat('({',GROUP_CONCAT(concat(talla,':',CAST(cantidad as unsigned))),'})') as fracciones from tbl2_guias_traslado_det_fracciones where id_guia_DET in (?) group by id_guia_DET",[ids])
        
        console.log(results2)
  
        new_articulos = results.map(row=>{
          let add = eval(results2.filter(row2=>row2.id_guia_DET == row.id_item)[0].fracciones)
          return {...row,...add}
        })

      }
      console.log("detalle desoachoss:",new_articulos)

      await conn.end();
      return new_articulos
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoDespachoAdi(id,tipo=null){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [data, fields] = await conn.query('SELECT tda.* FROM tbl2_despachos_adi tda WHERE tda.id_despacho_CAB = ?',[id]);
      new_articulos = data

      await conn.end();
      return new_articulos
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async eliminarInfoDespachos(id){
    let conn
    // console.log("El id de eliminado es el siguiente:",id)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.query('DELETE FROM `tbl2_despachos_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_despachos_det` WHERE `id_despacho_CAB` = "' + id + '"');
      await conn.end();
      return results
    } catch (err) {
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getStatusGuia(id){
    const conn = await mysql.createConnection(configs[1])
    await conn.connect();

    // const consulta = await conn.query("SELECT *from tbl2_iforme_guia where ruc = '20522094120' and nro_guia = ?",[id])
    // const consulta2 = await conn.query("SELECT *from tbl2_iforme_guia where ruc = '20522094120' and nro_guia = ?",[id])

    // consulta2.map(row=>{
    //   console.log("El valor de la columna es :",row.estado)
    // })

    return 0  
  }
  static async getInfoInforme(params){
    let conn
    try{
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let filtros = Object.keys(params).reduce((carry,valor)=>{
        if(params[valor] !== '')
        switch(valor){
          case 'servicio':
            carry += params[valor] !== 'TODOS' ? ` and ${valor}='${params[valor]}'` : ''
            break;
          case 'fec_desde':
            carry += `fec_emision >= '${params[valor]}'`
            break;
          case 'fec_hasta':
            carry += `fec_emision <= '${params[valor]}'`
            break;
          default:
            carry += ` and ${valor}='${params[valor]}'`
            break;
        }
        // carry += params[valor] !== '' ? ` and ${valor}='${params[valor]}'` : ''
        return carry
      },'')
      console.log(filtros)

      const [resultado] = await conn.query(`SELECT tgtc.idx as id_guia,tgtc.servicio,tgtc.orden_ref,tgtc.fec_emision,tgtc.fec_retorno,tgtc.id_proveedor_CAB,tgtc.proveedor,tpid.idx,tpid.articulo,tpid.cantidad,GROUP_CONCAT(dp.nro_guia) as guia,tgtc.costo,sum(dp.despacho) as total_despacho
        FROM tbl2_guias_traslado_det tpid 
        JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
        LEFT JOIN(
          SELECT tdc.nro_guia,tdc.id_guia_origen,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho FROM tbl2_despachos_cab tdc 
          LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
      WHERE tgtc.estado not in ('ANULADO','PENDIENTE') and COALESCE(tpid.isprototipo,0) = 0 `+ filtros +`
      GROUP BY tgtc.idx,tgtc.servicio,tgtc.orden_ref,tgtc.fec_emision,tgtc.fec_retorno,tgtc.id_proveedor_CAB,tgtc.proveedor,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo`)
      
      await conn.end();
      return resultado;
    }catch(err){

    }finally{
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoAbonos(){
    let conn
    try{
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [resultado] = await conn.query(`select ta.*,tc.id_servicio_CAB from tbl2_abonos ta join tbl2_conciliaciones tc on ta.idx = tc.id_abono_CAB where ta.ruc_ = '20522094120'`)
      await conn.end();
      return resultado;
    }catch(err){
      return err
    }finally{
      if (conn) {
        await conn.end();
      }
    }
  }
  static async validaInventario(){
    // console.log(inventario)

    let conn
    try{
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [resultado] = await conn.query(`select tid.* From tbl2_inventario_cab tic 
      join tbl2_inventario_det tid on tic.idx = tid.id_inventario_CAB
      where tic.idx = 723`)

      let diferencias = inventario.filter(item=>{
        return resultado.find(row=>parseInt(row.idxsub) == parseInt(item.idxsub) && parseInt(row.cantidad) !== parseInt(item.cantidad))
      })
      console.log("Las diferencias: ",diferencias.map(row=>row.producto + " - " + row.talla + " - " + row.color + " - " + row.cantidad))

      await conn.end();
      return ['hola'];
    }catch(err){
      console.log(err)
      return err
    }finally{
      if (conn) {
        await conn.end();
      }
    }
  }
}