import { concatMap } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
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
    console.log("Obteniendo listado de guais de traslado")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query("SELECT idx,orden_ref,tipo,servicio,proveedor,fec_emision,fec_retorno,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_guias_traslado_cab order by created_at desc");

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
      const [results, fields] = await conn.query('SELECT idx,orden_ref,tipo,motivo_traslado,id_proveedor_CAB,proveedor,servicio,responsable,modelo,producto,DATE_FORMAT(fec_emision,"%d/%m/%Y") as fec_emision_guia,fec_emision,fec_retorno,DATE_FORMAT(fec_retorno,"%d/%m/%Y") as fec_retorno_guia, date_format(fec_recepcion,"%d/%m/%Y") as fec_recepcion,costo,observaciones,estado,created_at, DATEDIFF(STR_TO_DATE(fec_retorno,"%Y-%m-%d"), STR_TO_DATE(fec_emision,"%Y-%m-%d")) as duracion FROM tbl2_guias_traslado_cab where idx = ?',[id]);
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
      const [results, fields] = await conn.query('SELECT *FROM tbl2_guias_traslado_det where id_guia_CAB = ?',[id]);
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
        console.log("Actualizado")
        console.log("Datos cabecera :", cabecera)
        console.log("Datos articulos :", articulos)

        await conn.query('UPDATE tbl2_guias_traslado_cab SET orden_ref=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),servicio=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),fec_recepcion=NULLIF(?, ""),costo=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, ""),motivo_traslado=NULLIF(?, ""),responsable=NULLIF(?, ""),modelo=NULLIF(?, ""),producto=NULLIF(?, "") WHERE idx = ?',[cabecera.orden_ref,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.servicio,cabecera.fec_emision,cabecera.fec_retorno,cabecera.fec_recepcion,cabecera.costo,cabecera.observaciones,cabecera.estado,cabecera.motivo_traslado,cabecera.responsable,cabecera.modelo,cabecera.producto,parseInt(data.id)])

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
        console.log("Creandsssso")
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_guias_traslado_cab(orden_ref,tipo,id_proveedor_CAB,proveedor,servicio,fec_emision,fec_retorno,costo,observaciones,motivo_traslado,responsable,modelo,producto) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[cabecera.orden_ref,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.servicio,cabecera.fec_emision,cabecera.fec_retorno,cabecera.costo,cabecera.observaciones,cabecera.motivo_traslado,cabecera.responsable,cabecera.modelo,cabecera.producto])

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
  static async getListaProveedores(limit){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" limit ?',[parseInt(limit)]);
      console.log("Lista de provedored :",results)
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
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? 'and ( ruc like ? or nom like ? )' : '') + ' limit 50',[`%${search}%`,`%${search}%`]);
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
  static async getListaPedidos(){
    console.log("Obteniendo listado de guais de traslado")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query("SELECT idx,orden_ref,tipo,proveedor,fec_emision,fec_retorno,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes FROM tbl2_pedidos_insumos_cab order by created_at desc");

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

      if(data.id){
        await conn.query('UPDATE tbl2_pedidos_insumos_cab SET orden_ref=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),forma_pago=NULLIF(?, ""),nro_contacto=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, "") WHERE idx = ?',[cabecera.orden_ref,cabecera.fec_emision,cabecera.fec_retorno,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.forma_pago,cabecera.nro_contacto,cabecera.observaciones,cabecera.estado,parseInt(data.id)])

        const [res,fld] = await conn.query("SELECT *FROM tbl2_pedidos_insumos_det WHERE id_pedido_CAB = "+ parseInt(data.id))
        const ids_delete = res.filter(row=> row.idx !== ''  && !articulos.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 

        const insert = async ()=>{
          const fila = articulos.shift()
          if(fila){
            let fracciones = []
            if(fila.idx && fila.idx !== ''){
              console.log("Dentro de 1 actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_pedidos_insumos_det SET id_pedido_CAB=NULLIF(?, ""),producto=NULLIF(?, ""),color=NULLIF(?, ""),rollos=NULLIF(?, ""),cantidad=NULLIF(?, ""),unidad=NULLIF(?, ""),precio=NULLIF(?, ""),anulado=NULLIF(?, "")',[parseInt(data.id),fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,fila.precio,fila.anulado]);

            }else{
              console.log("Dentro de 2 insertado")
              const [results,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,producto,color,rollos,cantidad,unidad,precio,anulado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[parseInt(data.id),fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,,fila.precio,fila.anulado]);

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
          const [res,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_cab(orden_ref,fec_emision,fec_retorno,tipo,id_proveedor_CAB,proveedor,responsable,forma_pago,nro_contacto,observaciones,estado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[cabecera.orden_ref,cabecera.fec_emision,cabecera.fec_retorno,cabecera.tipo,cabecera.id_proveedor_CAB,cabecera.proveedor,cabecera.responsable,cabecera.forma_pago,cabecera.nro_contacto,cabecera.observaciones,cabecera.estado])

          const insert = async ()=>{
            const fila = articulos.shift()
            if(fila){  
              const [results,fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,producto,color,rollos,cantidad,unidad,precio,anulado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.producto,fila.color,fila.rollos,fila.cantidad,fila.unidad,,fila.precio,fila.anulado]);

              await insert()
            }else{
              return Promise.resolve('')
            }
          }
          await insert()

        }catch(err){
          console.log("error en la consulta",err)
        }
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
  static async getInfoPedidoCab(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_pedidos_insumos_cab where idx = ?',[id]);
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
}