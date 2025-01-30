import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise";
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
  static async getListaGuias(){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query("select oc,origen,destino,responsable,fec_emision,fec_retorno,fec_recepcion,costo,(COALESCE(date(fec_retorno),0) - COALESCE(date(fec_emision),0)) as tiempo_produccion,if((COALESCE(date(fec_retorno),0) - COALESCE(date(fec_emision),0)) >= 0 ,'hola','adios') as dias_pendientes from tbl2_guias_traslado_cab");
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
  static async getInfoGuias(id){
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
  static async getInfoGuiaCab(id){
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
  static async saveInfoGuias(data){
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
  static async eliminarInfoGuias(id){
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
}