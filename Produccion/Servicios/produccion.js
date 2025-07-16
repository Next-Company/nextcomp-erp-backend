import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise";
// import { inventario } from "../../Main/config.js";
export class ProduccionModel {
  static async getOrdenes(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''))) > 0").join(" ") : ""

      const [results, fields] = await conn.query(`
        select 
        *,
        DATE_FORMAT(fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),STR_TO_DATE(fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        1COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes 
        from viewProduccionOrdenes 
        where 1=1 ${extra} order by idx desc`);
      await conn.end();

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
        query = `SELECT 
        *
        FROM viewProduccionOrdenes 
        where ` + formateo
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
    // ppd
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      // sddssss
      // let [ordenes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_ordenes_combos tb2 where tb2.id_orden_CAB = tb1.idx),JSON_ARRAY()) as combos FROM tbl2_fases_prod_ordenes tb1 WHERE tb1.idx = ? ORDER BY tb1.idx desc",[info.id]);

      // let [ordenes] = await conn.query("SELECT tb1.*,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('id_orden_CAB',cc.id_orden_CAB,'color_combo',cc.color_combo,'cantidad_combo',cc.cantidad_combo,'fracciones',cc.fracciones)) from (select tb2.idx,tb2.id_orden_CAB,tb2.color_combo,tb2.cantidad_combo,(select JSON_ARRAYAGG(JSON_OBJECT('talla',talla,'cantidad',cantidad)) from tbl2_fases_prod_ordenes_combos_fracciones tfr where tfr.id_combo_CAB = tb2.idx) as fracciones from tbl2_fases_prod_ordenes_combos tb2 where tb2.id_orden_CAB = tb1.idx) as cc),JSON_ARRAY()) as combos FROM tbl2_fases_prod_ordenes tb1 WHERE tb1.idx = ? ORDER BY tb1.idx desc", [info.id]);

      let [ordenes] = await conn.query(`SELECT
          tb1.*,
          COALESCE(
              (
                  SELECT
                      JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'id_orden_CAB', tb2.id_orden_CAB,
                              'color_combo', tb2.color_combo,
                              'cantidad_combo', tb2.cantidad_combo,
                              'fracciones', COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('talla', tfr.talla, 'cantidad', tfr.cantidad))
                                            FROM tbl2_fases_prod_ordenes_combos_fracciones tfr
                                            WHERE tfr.id_combo_CAB = tb2.idx)
                                            ,
                                              JSON_ARRAY(
                                                JSON_OBJECT('talla','xs','cantidad',0),
                                                JSON_OBJECT('talla','s','cantidad',0),
                                                JSON_OBJECT('talla','m','cantidad',0),
                                                JSON_OBJECT('talla','l','cantidad',0),
                                                JSON_OBJECT('talla','xl','cantidad',0),
                                                JSON_OBJECT('talla','xxl','cantidad',0)
                                              )
                                            )
                          )
                      )
                  FROM
                      tbl2_fases_prod_ordenes_combos tb2
                  WHERE
                      tb2.id_orden_CAB = tb1.idx -- <--- ¡Aquí tb1.idx SÍ es visible!
              ),
              JSON_ARRAY()
          ) AS combos
      FROM
          tbl2_fases_prod_ordenes tb1
      WHERE
          tb1.idx = ?
      ORDER BY
          tb1.idx DESC`, [info.id]);

      ordenes = ordenes.reduce((c,v)=>{
        let new_combo = v.combos.map(combo=>{
          console.log("Info del combo :",combo)
          let fracciones = combo.fracciones.reduce((cc,vv)=>{
            cc[vv.talla] = vv.cantidad 
            return cc
          },{})
          return {...combo,...fracciones}
        })
        c.push({...v,combos:new_combo})
        return c
      },[])
      console.log("INfo ordnes eSs: ",ordenes)
      
      const [moldes] = await conn.query('SELECT tb1.* FROM tbl2_fases_prod_molde tb1 WHERE tb1.id_cab_orden = ?',[info.id]);

      // const [cortes] = await conn.query("SELECT tb1.*,(select JSON_ARRAYAGG(JSON_OBJECT('id_hojacorte_CAB',tb2.id_hojacorte_CAB,'id_orden_CAB',tb2.id_orden_CAB,'color_combo',tb2.color_combo,'cantidad_combo',tb2.cantidad_combo)) from tbl2_fases_prod_hojacorte_combos tb2 where tb2.id_hojacorte_CAB = tb1.idx) as combos FROM tbl2_fases_prod_hojacorte tb1 WHERE tb1.id_cab_orden = ?",[info.id]);

      let [cortes] = await conn.query(`SELECT
          tb1.*,
          COALESCE(
              (
                  SELECT
                      JSON_ARRAYAGG(
                          JSON_OBJECT(
                              'idx', tb2.idx,
                              'id_orden_CAB', tb2.id_orden_CAB,
                              'color_combo', tb2.color_combo,
                              'cantidad_combo', tb2.cantidad_combo,
                              'fracciones', COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('talla', tfr.talla, 'cantidad', tfr.cantidad))
                                            FROM tbl2_fases_prod_hojacorte_combos_fracciones tfr
                                            WHERE tfr.id_combo_CAB = tb2.idx)
                                            ,
                                              JSON_ARRAY(
                                                JSON_OBJECT('talla','xs','cantidad',0),
                                                JSON_OBJECT('talla','s','cantidad',0),
                                                JSON_OBJECT('talla','m','cantidad',0),
                                                JSON_OBJECT('talla','l','cantidad',0),
                                                JSON_OBJECT('talla','xl','cantidad',0),
                                                JSON_OBJECT('talla','xxl','cantidad',0)
                                              )
                                            )
                          )
                      )
                  FROM
                      tbl2_fases_prod_hojacorte_combos tb2
                  WHERE
                      tb2.id_hojacorte_CAB = tb1.idx
              ),
              JSON_ARRAY()
          ) AS combos
      FROM
          tbl2_fases_prod_hojacorte tb1
      WHERE
          tb1.id_cab_orden = ?`, [info.id]);

      cortes = cortes.reduce((c,v)=>{
        let new_combo = v.combos.map(combo=>{
          console.log("Info del combo :",combo)
          let fracciones = combo.fracciones.reduce((cc,vv)=>{
            cc[vv.talla] = vv.cantidad 
            return cc
          },{})
          return {...combo,...fracciones}
        })
        c.push({...v,combos:new_combo})
        return c
      },[])

      let [fasesprod] = await conn.query("SELECT *FROM tbl2_fases_produccion")
  
      return [ordenes,moldes,cortes,fasesprod]
    } catch (err) {
      console.log("Estamos en error:", err);
      return err
    } finally {
      if (conn) await conn.end()
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
        console.log(sql, values)
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
        console.log("Consulta de insertado:", sql)
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
  static async getListaEstampados() {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *,if(date(now()) = date(created_at),1,0) as enabled FROM tbl2_seguimiento_estampado_cab ORDER BY created_at DESC');



      results.forEach(row => {
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
  static async getInfoEstampado(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_seguimiento_estampado_det where id_seguimiento_cab = ?', [id]);
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
  static async getInfoEstampadoCab(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_seguimiento_estampado_cab where idx = ?', [id]);
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
  static async saveInfoEstampado(data) {
    let conn
    // console.log(info)-
    const results = { ok: true, message: 'test' }
    const detalle = JSON.parse(data.info)
    console.log('Detalle multiple:', detalle)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      if (data.id) {
        const [res, fld] = await conn.query("select *from tbl2_seguimiento_estampado_det where id_seguimiento_cab = " + parseInt(data.id))
        // const ids_delete = detalle.filter(row=> row.idx !== ''  && !res.map(fila=>parseInt(fila.idx)).includes(parseInt(row.idx)) ) 
        const ids_delete = res.filter(row => row.idx !== '' && !detalle.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))
        console.log("Filas a eliminar:", ids_delete)

        console.log("Actualizando")
        const insert = async () => {
          const fila = detalle.shift()
          if (fila) {
            if (fila.idx == '') {
              console.log("Dentro de insertado")
              const [results, fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones,cliente,nro_fallados,marca) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [data.id, fila.op, fila.nro_corte, fila.modelo, fila.nro_polos, fila.nro_paquetes, fila.nro_personal, fila.tipo_estampado, fila.estado, fila.avance, fila.observaciones, fila.cliente, fila.nro_fallados, fila.marca]);
              // insert()
            } else {
              console.log("Dentro de actualizados")
              const [results, fields] = await conn.query('UPDATE tbl2_seguimiento_estampado_det SET op=NULLIF(?, ""),nro_corte=NULLIF(?, ""),modelo=NULLIF(?, ""),nro_polos=NULLIF(?, ""),nro_paquetes=NULLIF(?, ""),nro_personal=NULLIF(?, ""),tipo_estampado=NULLIF(?, ""),estado=NULLIF(?, ""),avance=NULLIF(?, ""),observaciones=NULLIF(?, ""),cliente=NULLIF(?, ""),nro_fallados=NULLIF(?, ""),marca=NULLIF(?, "") WHERE idx = ? and id_seguimiento_cab = ?', [fila.op, fila.nro_corte, fila.modelo, fila.nro_polos, fila.nro_paquetes, fila.nro_personal, fila.tipo_estampado, fila.estado, fila.avance, fila.observaciones, fila.cliente, fila.nro_fallados, fila.marca, fila.idx, data.id]);
              // insert()
            }
            await insert()
          } else {
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async () => {
          const fila = ids_delete.shift()
          if (fila) {
            await conn.query('DELETE FROM `tbl2_seguimiento_estampado_det` WHERE `id_seguimiento_cab` = ? and `idx` = ?', [parseInt(data.id), parseInt(fila.idx)])
            await eliminar()
          } else {
            return Promise.resolve('')
          }
        }
        await eliminar()

        console.log("Continua proceso")
        return results
      } else {
        console.log("Creando")
        const [res, fld] = await conn.query("insert into tbl2_seguimiento_estampado_cab(observaciones) values('OTRAS OBSERVACIONES')")

        const insert = async () => {
          const fila = detalle.shift()
          console.log("Nueva fila detalle juan :", fila)
          if (fila) {
            console.log("dentro del insertado")
            // const [results,fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',[res.insertId,fila.op,fila.nro_corte,fila.modelo,fila.nro_polos,fila.nro_paquetes,fila.nro_personal,fila.tipo_estampado,fila.estado,fila.avance,fila.observaciones,fila.marca]);
            const [results, fields] = await conn.query('INSERT INTO tbl2_seguimiento_estampado_det(id_seguimiento_cab,op,nro_corte,modelo,nro_polos,nro_paquetes,nro_personal,tipo_estampado,estado,avance,observaciones,marca,cliente) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [res.insertId, fila.op, fila.nro_corte, fila.modelo, fila.nro_polos, fila.nro_paquetes, fila.nro_personal, fila.tipo_estampado, fila.estado, fila.avance, fila.observaciones, fila.marca, fila.cliente]);
            await insert()
          } else {
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
  static async eliminarInfoEstampado(id) {
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
  static async getListaGuias(search) {
    console.log("Obteniendo listado de guais de traslado")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tipo),''),' ',COALESCE(TRIM(idx),''),' ',COALESCE(TRIM(orden_ref),''),' ',COALESCE(TRIM(servicio),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(proveedor),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(estado),''))) > 0").join(" ") : ""

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
      let query = `SELECT idx,id_orden_CAB,orden_ref,producto,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      COALESCE((select identificador from tbl2_fases_produccion where ruta = tbl2_guias_traslado_cab.servicio),'bg-gray-300') as identificador,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos
      FROM tbl2_guias_traslado_cab where tipo = 'SERVICIOS' ${search !== '_' ? extra : ''} order by created_at desc limit 100`
      console.log("Consulta lista guias:", query)

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
  static async getListaMuestras_(search) {
    console.log("Obteniendo listado de guais de trasladosssssssssssss", search)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(tipo,'')),' ',TRIM(idx),' ',TRIM(COALESCE(orden_ref,'')),' ',TRIM(COALESCE(servicio,'')),' ',TRIM(COALESCE(producto,'')),' ',TRIM(COALESCE(proveedor,'')),' ',TRIM(COALESCE(responsable,'')),' ',TRIM(COALESCE(modelo,'')))) > 0").join(" ") : ""

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
      console.log("Query de busqueda:", query)

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
  static async getListaMuestras(search) {
    console.log("Obteniendo listado de guais de trasladossssssssssss", search)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(tipo,'')),' ',TRIM(idx),' ',TRIM(COALESCE(orden_ref,'')),' ',TRIM(COALESCE(servicio,'')),' ',TRIM(COALESCE(producto,'')),' ',TRIM(COALESCE(proveedor,'')),' ',TRIM(COALESCE(responsable,'')),' ',TRIM(COALESCE(modelo,'')),' ',TRIM(COALESCE(estado,'')))) > 0").join(" ") : ""

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
      console.log("Query de busqueda:", query)

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
  static async putANewLetras(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      const [results, fields] = await conn.query(`SELECT *FROM tbl2_letras_cab where ruc_ = ?`, ['20522094120'])
    } catch (error) {

    }
    return { ok: true, message: 'Datos generados correctamente' }
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
  static async getInfoGuiaCab(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT idx,id_orden_CAB,orden_ref,destino,tipo,motivo_traslado,id_proveedor_CAB,proveedor,servicio,responsable,modelo,marca,producto,DATE_FORMAT(fec_emision,"%d/%m/%Y") as fec_emision_guia,fec_emision,fec_recepcion,fec_retorno,DATE_FORMAT(fec_retorno,"%d/%m/%Y") as fec_retorno_guia, date_format(fec_recepcion,"%d/%m/%Y") as fec_recepcion_guia,costo,observaciones,estado,created_at, DATEDIFF(STR_TO_DATE(fec_retorno,"%Y-%m-%d"), STR_TO_DATE(fec_emision,"%Y-%m-%d")) as duracion FROM tbl2_guias_traslado_cab where idx = ?', [id]);
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
  static async getInfoGuiaDet(id) {
    let conn
    console.log("Dentro de get info guia det")
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      // const [results, fields] = await conn.query(`
      //   SELECT tb2.servicio,tb2.marca,tb2.modelo,tb1.*FROM tbl2_guias_traslado_det tb1 join tbl2_guias_traslado_cab tb2 on tb1.id_guia_CAB = tb2.idx where id_guia_CAB = ?
      // `, [id]);
      // const ids = results.map(row => row.idx)
      const [results, fields] = await conn.query(`
      SELECT tb2.servicio,tb2.marca,tb2.modelo,tb1.idx,tb1.id_combo,tb1.id_guia_CAB,tb1.articulo,tb1.talla,tb1.categoria,tb1.cantidad,tb1.cantidad_obs,tb1.isprototipo,
      (COALESCE(sum(ingresos.despacho),0) + COALESCE(sum(ingresos.caidos),0)) as ingresos,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('idcombo',tb1.id_combo,'talla',tf.talla,'cantidad',tf.cantidad)) from tbl2_guias_traslado_det_fracciones tf where tf.id_guia_DET = tb1.idx),JSON_ARRAY()) as fracciones,JSON_ARRAY() as fracciones_despacho
      FROM tbl2_guias_traslado_det tb1 
      JOIN tbl2_guias_traslado_cab tb2 on tb1.id_guia_CAB = tb2.idx
      LEFT JOIN (
        select tdc.idx,tdc.id_guia_origen,tdd.id_item,tdd.despacho,tdd.caidos
        from tbl2_despachos_cab tdc
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
      ) as ingresos on ingresos.id_guia_origen = tb2.idx and tb1.idx = ingresos.id_item
      WHERE id_guia_CAB = ?
      GROUP BY tb2.servicio,tb2.marca,tb2.modelo,tb1.idx,tb1.id_guia_CAB,tb1.articulo,tb1.talla,tb1.categoria,tb1.cantidad,tb1.cantidad_obs,tb1.isprototipo
      `, [id]);
      const ids = results.map(row => row.idx)

      const [cruce] = await conn.query("select tdc.idx as id_despacho,DATE_FORMAT(tdc.fec_despacho,'%d/%m') as fec_despacho,tdd.id_item as idx,tdd.despacho from tbl2_despachos_cab tdc join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB where tdc.tipo = 'SERVICIOS' and tdc.id_guia_origen = ?",[id])

      console.log("iNfo del creuce uomo es.:",cruce,id)

      // let lista_despachos = [...new Set(cruce.reduce((carry, valor) => { return [...carry, valor.id_despacho] }, []))]
      let lista_despachos = cruce.reduce((carry,value)=>{
        if(!Object.keys(carry).includes(value.id_despacho)){
          carry[value.id_despacho] = value.fec_despacho
        }
        return carry 
      },{})

      let pp = results.reduce((carry,value)=>{
        value['despachos'] = Object.keys(lista_despachos).reduce((carry,valor)=>{
          let info = cruce.filter(item=>item.id_despacho == valor && item.idx == value.idx)

          carry.push({
            'id_despacho':info.length > 0 ? info[0].id_despacho : parseInt(valor),
            'fec_despacho':info.length > 0 ? info[0].fec_despacho : lista_despachos[valor], 
            'cantidad_despacho':info.length > 0 ? info[0].despacho : 0,
          })
          return carry
        },[])
        carry.push(value)
        return carry
      },[])
      // ste am es asi tu no
      // yo te sp tu nunc vend
      // yo te llorar tu don estaras

      console.log("La info completa es:",pp)
      
      const [results2] = await conn.query("select id_guia_DET,concat('({',GROUP_CONCAT(concat(talla,':',CAST(cantidad as unsigned))),'})') as fracciones from tbl2_guias_traslado_det_fracciones where id_guia_DET in (?) group by id_guia_DET", [ids])

      let new_articulos = pp.map(row => {
        let add = eval(results2.filter(row2 => row2.id_guia_DET == row.idx)[0].fracciones)
        return { ...row, ...add }
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
  static async getInfoGuiaPenalidades(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query(`
      SELECT tgta.id_guia_CAB as idguia,tgta.id_penalidad_CAB as idx,tgta.observaciones as observacion,tgta.importe FROM tbl2_guias_traslado_adi tgta WHERE tgta.id_guia_CAB = ? 
      `, [id]);

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
  static async searchGuia(search) {
    let conn
    try {
      console.log("Buscando guias de traslado - searchGuia")
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(idx),' ',TRIM(COALESCE(proveedor,'')),' ',TRIM(COALESCE(servicio,'')),' ',TRIM(COALESCE(producto,'')),' ',TRIM(COALESCE(marca,'')),' ',TRIM(COALESCE(estado,'')),' ',TRIM(COALESCE(modelo,'')),' ')) > 0").join(" ") : ""

      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? 'and ( ruc like ? or nom like ? )' : '') + ' limit 50',[`%${search}%`,`%${search}%`]);

      let query = 'SELECT *FROM tbl2_guias_traslado_cab where 1=1 ' + (search !== '' ? extra : '') + ' limit 50'
      console.log("Query de busqueda:", query)

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
  static async saveInfoGuias(data) {
    let conn
    console.log("Info del formulario:", data)
    const results = { ok: true, message: 'test' }
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)
    const penalidades = data.penalidades ? JSON.parse(data.penalidades) : []
    const reprogramacion = data.reprogramacion ? JSON.parse(data.reprogramacion) : []

    console.log('Detalle multiple:', cabecera)
    console.log('Detalle penalidades:', penalidades)
    console.log('Detalle reprogramaciones:', reprogramacion)

    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      //////////////////////////////////////
      //////// respaldo info guias /////////
      const [backup_articulos] = await conn.query(`SELECT tgtd.*,COALESCE((SELECT JSON_ARRAYAGG(JSON_OBJECT('talla',tgtdf.talla,'cantidad',tgtdf.cantidad)) 
        FROM tbl2_guias_traslado_det_fracciones tgtdf WHERE tgtdf.id_guia_DET = tgtd.idx),JSON_ARRAY()) AS fracciones
      FROM tbl2_guias_traslado_det tgtd WHERE COALESCE(tgtd.isprototipo,0) <> 1 and tgtd.id_guia_CAB = ?`,[data.id])

      //////////////////////////////////////
      //////////////////////////////////////

      /////////////////////////////////////
      ///// validacion estado guias ///////
      if(cabecera.tipo == 'SERVICIOS'){
        // let service_position = []
        // let [orden] = await conn.query("SELECT *FROM tbl2_fases_prod_ordenes WHERE idx = ?", [parseInt(cabecera.id_orden_CAB)]);
  
        // const RUTA = JSON.parse(orden[0].ruta_proceso).filter(row => !['AVIOS','MOLDE','CORTE'].includes(row))
  
        // let [info_guias] = await conn.query("select *from tbl2_guias_traslado_cab where id_orden_CAB = ? and estado = 'FINALIZADO' ORDER BY fec_emision DESC LIMIT 1", [parseInt(cabecera.id_orden_CAB)]);
  
        // if(info_guias.length > 0){
        //   service_position = [RUTA.indexOf(info_guias[0].servicio) + 1, RUTA.indexOf(info_guias[0].servicio)]
        // }else{
        //   service_position = [0]
        // }
        // if( !service_position.includes(RUTA[cabecera.servicio]) ) throw new Error("El servicio a generar esta fuera de la ruta establecida. Por favor verifique.")
      }

      /////////////////////////////////////
      /////////////////////////////////////

      if (data.id) {
        await conn.query('UPDATE tbl2_guias_traslado_cab SET orden_ref=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),servicio=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),fec_recepcion=NULLIF(?, ""),costo=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, ""),motivo_traslado=NULLIF(?, ""),responsable=NULLIF(?, ""),modelo=NULLIF(?, ""),marca=NULLIF(?, ""),producto=NULLIF(?, ""),destino=NULLIF(?, ""),id_orden_CAB=NULLIF(?, "") WHERE idx = ?', [cabecera.orden_ref, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.servicio, cabecera.fec_emision, cabecera.fec_retorno, cabecera.fec_recepcion, cabecera.costo, cabecera.observaciones, cabecera.estado, cabecera.motivo_traslado, cabecera.responsable, cabecera.modelo, cabecera.marca, cabecera.producto, cabecera.destino, cabecera.id_orden_CAB ?? 1 , parseInt(data.id)])
        const [res, fld] = await conn.query("SELECT *FROM tbl2_guias_traslado_det WHERE id_guia_CAB = " + parseInt(data.id))
        const ids_delete = res.filter(row => row.idx !== '' && !articulos.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))

        const insert = async () => {
          const fila = articulos.shift()
          if (fila) {
            let fracciones = []
            if (fila.idx && fila.idx !== '') {
              console.log("Dentro de 1 actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_guias_traslado_det SET articulo=NULLIF(?, ""),cantidad=NULLIF(?, ""),isprototipo=NULLIF(?, "") WHERE idx = ? and id_guia_CAB = ?', [fila.articulo, fila.cantidad, fila.isprototipo, fila.idx, parseInt(data.id)]);
              // insert()
              fracciones = Object.keys(fila).filter(valor => ['xs', 's', 'm', 'l', 'xl', 'xxl'].includes(valor)).reduce((carry, value) => {
                carry.push([fila.idx, value, parseInt(fila[value])])
                return carry
              }, [])
              console.log("Detalle de las fracciones :", fracciones)
            } else {
              console.log("Dentro de 2 insertado")
              const [results, fields] = await conn.query('INSERT INTO tbl2_guias_traslado_det(id_guia_CAB,articulo,cantidad,isprototipo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [parseInt(data.id), fila.articulo, fila.cantidad, fila.isprototipo]);
              // insert()
              fracciones = Object.keys(fila).filter(valor => ['xs', 's', 'm', 'l', 'xl', 'xxl'].includes(valor)).reduce((carry, value) => {
                carry.push([results.insertId, value, parseInt(fila[value])])
                return carry
              }, [])
            }
            // console.log("Dentro de actualizado las fracciones son :",fracciones)
            await conn.query('REPLACE INTO tbl2_guias_traslado_det_fracciones(id_guia_DET,talla,cantidad) values ?', [fracciones])

            await insert()
          } else {
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async () => {
          const fila = ids_delete.shift()
          if (fila) {
            await conn.query('DELETE FROM `tbl2_guias_traslado_det` WHERE `id_guia_CAB` = ? and `idx` = ?', [parseInt(data.id), parseInt(fila.idx)])
            await eliminar()
          } else {
            return Promise.resolve('')
          }
        }
        await eliminar()

        if(penalidades.length > 0){
          let penalidadesinsert = penalidades.map(row=>[row.idguia,row.idx,row.observacion,row.importe])
          await conn.query("DELETE FROM tbl2_guias_traslado_adi WHERE id_guia_CAB = ?",[parseInt(data.id)])
          await conn.query("INSERT INTO tbl2_guias_traslado_adi(id_guia_CAB,id_penalidad_CAB,observaciones,importe) VALUES ?",[penalidadesinsert])
        }
        if(reprogramacion.length > 0){
          let reprogramacioninsert = reprogramacion.map(row=>[row.idguia,row.fecha_entrega,row.observacion])
          await conn.query("DELETE FROM tbl2_guias_traslado_reprogramacion WHERE id_guia_CAB = ?",[parseInt(data.id)])
          await conn.query("INSERT INTO tbl2_guias_traslado_reprogramacion(id_guia_CAB,fecha_entrega,observacion) VALUES ?",[reprogramacioninsert])
        }

      } else {
        try {
          const [res, fields] = await conn.query('INSERT INTO tbl2_guias_traslado_cab(orden_ref,tipo,id_proveedor_CAB,proveedor,servicio,fec_emision,fec_retorno,costo,observaciones,motivo_traslado,responsable,modelo,marca,producto,destino,id_orden_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?,""))', [cabecera.orden_ref, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.servicio, cabecera.fec_emision, cabecera.fec_retorno, cabecera.costo, cabecera.observaciones, cabecera.motivo_traslado, cabecera.responsable, cabecera.modelo, cabecera.marca, cabecera.producto, cabecera.destino, cabecera.id_orden_CAB ?? 1])

          const insert = async () => {
            const fila = articulos.shift()
            console.log("Nueva fila detalle juan :", fila)
            if (fila) {
              const [results, fields] = await conn.query('INSERT INTO tbl2_guias_traslado_det(id_guia_CAB,articulo,cantidad,isprototipo,id_combo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [res.insertId, fila.articulo, fila.cantidad, fila.isprototipo, fila.id_combo]);

              const fracciones = Object.keys(fila).filter(valor => ['xs', 's', 'm', 'l', 'xl', 'xxl'].includes(valor)).reduce((carry, value) => {
                carry.push([results.insertId, value, parseInt(fila[value])])
                return carry
              }, [])
              const [results2] = await conn.query('INSERT INTO tbl2_guias_traslado_det_fracciones(id_guia_DET,talla,cantidad) values ?', [fracciones]);

              await insert()
            } else {
              return Promise.resolve('')
            }
          }
          await insert()
        } catch (err) { 
          console.log("error en la consulta", err)
        }
        // console.log("filas afectadas :",res)
        // await conn.end();
        // return results
      }
      if(cabecera.tipo == 'SERVICIOS'){
        // UpdateMasterProduccion(backup_articulos,articulos,orden,conn,tipo)
        // formato de data : [ {idcombo:22,xs:[13,1],s:[13,1],m:[13,1],l:[13,1],xl:[13,1],xxl:[13,1]},{},{},... ]
        let param1 = backup_articulos.reduce((c,v)=>{
          let info = {idcombo:v.id_combo}
          info = v.fracciones.reduce((cc,vv)=>{
            return {...cc,[vv.talla]:[parseInt(vv.cantidad),0]}
          },info)
          c.push(info)
          return c
        },[])
        console.log("Informacion del paramentro 1:",param1)

        console.log("IUnfo del detalle",JSON.parse(data.detalle))
        let param2 = JSON.parse(data.detalle).filter(row=>!row.isprototipo && row.id_combo).reduce((c,v)=>{
          let info = {idcombo:v.id_combo}
          info = ['xs','s','m','l','xl','xxl'].reduce((cc,vv)=>{
            return {...cc,[vv]:[parseInt(v[vv]),0]}
          },info)
          c.push(info)
          return c
        },[])
        console.log("Informacion del paramentro 2:",param2)
        let respuesta = await this.UpdateMasterProduccion(param1,param2,cabecera.id_orden_CAB,conn,1)
        if(!respuesta.ok) throw respuesta.message
      }

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Registro completo'}
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      // return {ok:false,message:err.message}
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async UpdateMasterProduccion_backup(backup_articulos,articulos,orden,guia,conn,tipo){
    console.log("La informacion a trabajar es:",backup_articulos,articulos,orden,guia)
    try {
      if(guia){
        backup_articulos = backup_articulos.reduce((c,v)=>{
          v = v.fracciones.reduce((cc,vv)=>{
            return {...cc,[vv.talla]:parseInt(vv.cantidad)}
          },v)
          c.push(v)
          return c
        },[])
        for(let combo of [...backup_articulos]){
          for(let talla of ['xs','s','m','l','xl','xxl']){
            await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones SET produccion_total = produccion_total + (?) WHERE id_combo_CAB = ? and talla = ?`,[tipo ? -1*parseInt(combo[talla]) : parseInt(combo[talla]),combo.idcombo,talla])
          }
        }
      }
      if(articulos.length > 0){
        for(let combo of [...articulos]){
          // console.log("El combo del for es:",combo)
          for(let talla of ['xs','s','m','l','xl','xxl']){
            await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones SET produccion_total = produccion_total + (?) WHERE id_combo_CAB = ? and talla = ?`,[tipo ? parseInt(combo[talla]) : -1*parseInt(combo[talla]),combo.idcombo,talla])
          }
        }
      }
      const [validacion] = await conn.query(`SELECT *FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf WHERE tfphcf.id_combo_CAB IN (SELECT t1.idx FROM tbl2_fases_prod_hojacorte_combos t1 JOIN tbl2_fases_prod_hojacorte t2 ON t1.id_hojacorte_CAB = t2.idx WHERE t2.id_cab_orden = ?) AND (tfphcf.produccion_total > tfphcf.cantidad OR tfphcf.produccion_total < 0)`,[parseInt(orden)])
      if(validacion.length > 0) throw "La informacion ingresada supera el limite permitido"

      return {ok:true,message:''}
    } catch (error) {
      return {ok:false,message:error}
    }
  }
  static async UpdateMasterProduccion(backup_articulos,articulos,orden,conn,tipo){
    let p1 = '', p2 = ''
    console.log("La informacion a trabajar es:",backup_articulos,articulos,orden,tipo == 0 ? 'SUMA' : 'RESTA')
    ////////////////////////////////////
    // formato de data : [ {idcombo:22,xs:[13,1],s:[13,1],m:[13,1],l:[13,1],xl:[13,1],xxl:[13,1]},{},{},... ]
    ////////////////////////////////////
    try {

      if(backup_articulos.length > 0){
        // for(let combo of [...backup_articulos]){
        //   for(let talla of ['xs','s','m','l','xl','xxl']){
        //     console.log("Esperaando por le siguiente")
        //     await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones 
        //       SET 
        //         produccion_total = produccion_total + (?),
        //         caidos_total = caidos_total + (?) 
        //       WHERE id_combo_CAB = ? AND talla = ?
        //     `,[
        //         tipo ? parseInt(combo[talla][0]) : -1*parseInt(combo[talla][0]),
        //         tipo ? parseInt(combo[talla][1]) : -1*parseInt(combo[talla][1]),
        //         combo.idcombo,
        //         talla
        //       ])
        //   }
        // }
        p1 = ''
        p2 = ''
        for(let combo of [...backup_articulos]){
          p1 = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
            c += " WHEN id_combo_CAB = " + combo.idcombo +" and talla = '" + v + "' THEN " + (tipo ? parseInt(combo[v][0]) : -1*parseInt(combo[v][0]))
            return c
          },p1);
          p2 = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
            c += " WHEN id_combo_CAB = " + combo.idcombo + " and talla = '" + v + "' THEN " + (tipo ? parseInt(combo[v][1]) : -1*parseInt(combo[v][1]))
            return c
          },p2)
        }
        p1 = `CASE ${p1} ELSE 0 END`
        p2 = `CASE ${p2} ELSE 0 END`
        await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones SET produccion_total = COALESCE(produccion_total,0) + ` + p1 + `, caidos_total = COALESCE(caidos_total,0) + ` + p2)
      }
      if(articulos.length > 0){
        // for(let combo of [...articulos]){
        //   for(let talla of ['xs','s','m','l','xl','xxl']){
        //     console.log("Esperaando por le siguiente")
        //     await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones 
        //       SET 
        //         produccion_total = produccion_total + (?), 
        //         caidos_total = caidos_total + (?) 
        //       WHERE id_combo_CAB = ? AND talla = ?
        //     `,[
        //         tipo ? -1*parseInt(combo[talla][0]) : parseInt(combo[talla][0]),
        //         tipo ? -1*parseInt(combo[talla][1]) : parseInt(combo[talla][1]),
        //         combo.idcombo,
        //         talla
        //       ])
            
        //   }
        // }
        p1 = ''
        p2 = ''
        for(let combo of [...articulos]){
          p1 = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
            c += " WHEN id_combo_CAB = " + combo.idcombo +" and talla = '" + v + "' THEN " + (tipo ? -1*parseInt(combo[v][0]) : parseInt(combo[v][0]))
            return c
          },p1);
          p2 = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
            c += " WHEN id_combo_CAB = " + combo.idcombo + " and talla = '" + v + "' THEN " + (tipo ? -1*parseInt(combo[v][1]) : parseInt(combo[v][1]))
            return c
          },p2)
        }
        p1 = `CASE ${p1} ELSE 0 END`
        p2 = `CASE ${p2} ELSE 0 END`
        await conn.query(`UPDATE tbl2_fases_prod_hojacorte_combos_fracciones SET produccion_total = COALESCE(produccion_total,0) + ` + p1 + `, caidos_total = COALESCE(caidos_total,0) + ` + p2)
      }
      const [validacion] = await conn.query(`SELECT *FROM tbl2_fases_prod_hojacorte_combos_fracciones tfphcf WHERE tfphcf.id_combo_CAB IN (SELECT t1.idx FROM tbl2_fases_prod_hojacorte_combos t1 JOIN tbl2_fases_prod_hojacorte t2 ON t1.id_hojacorte_CAB = t2.idx WHERE t2.id_cab_orden = ?) AND ((tfphcf.produccion_total + tfphcf.caidos_total) > tfphcf.cantidad OR (tfphcf.produccion_total + tfphcf.caidos_total) < 0)`,[parseInt(orden)])
      console.log("Imprimiendo validacion:",validacion)
      if(validacion.length > 0) throw "La informacion ingresada supera el limite permitido"

      return {ok:true,message:''}
    } catch (error) {
      console.log("dentro de rroe")
      return {ok:false,message:error}
    }
  }
  static async eliminarInfoGuias(id) {
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
  static async anularInfoGuias(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()
      console.log("Comenzando el proceso de anulacion de la guia de servicio.")

      await conn.query("UPDATE tbl2_guias_traslado_cab SET estado = 'ANULADO' WHERE idx = ?",[id]);

      let [info_orden] = await conn.query('select *from tbl2_guias_traslado_cab where idx = ?',[id])
      let [data_backup] = await conn.query(`select tdd.id_combo,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',t1.talla,'cantidad',t1.cantidad)) from tbl2_guias_traslado_det_fracciones t1 where t1.id_guia_DET = tdd.idx),JSON_ARRAY()) as fracciones from tbl2_guias_traslado_det tdd where tdd.id_guia_CAB = ?`,[id])
      
      let param1 = data_backup.reduce((c,v)=>{
        let pp = v.fracciones.reduce((cc,vv)=>{
          cc = {...cc,[vv.talla]:[ parseInt(vv.cantidad),0 ]}
          return cc
        },{idcombo:v.id_combo})
        c.push(pp)
        return c
      },[])
      console.log("Info del parametro 1:",param1)

      let resultado = await this.UpdateMasterProduccion(param1,[],info_orden[0].id_orden_CAB,conn,1)
      if(!resultado.ok) throw resultado.message

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:"El servicio fue anulado con éxito."}
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getInfoGuiaDespacho(id) {
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
      WHERE tpid.id_guia_CAB = ?`, [id]);

      const ids = results.map(row => row.idx)
      console.log("Lista de ids:", ids)

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
  static async getListaClientes(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(nro,'')),' ',TRIM(COALESCE(nom,'')),' ',TRIM(COALESCE(direccion,'')))) > 0").join(" ") : ""

      const [results, fields] = await conn.query(`SELECT *FROM tbl2_cliente where ruc_ = "20522094120" ${extra} limit 50`);
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

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(ruc,'')),' ',TRIM(COALESCE(nom,'')),' ',TRIM(COALESCE(direccion,'')))) > 0").join(" ") : ""

      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? 'and ( ruc like ? or nom like ? )' : '') + ' limit 50',[`%${search}%`,`%${search}%`]);
      console.log("Busqueda de proveedores:", extra)
      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? extra : '') + ' limit 50');
      const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? extra : '') + ' and ruc not in ("20522094121") limit 50');
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
  //////////////////////////////////
  //seccion guias traslado interno
  //////////////////////////////////
  static async getListaPedidos(search = '') {
    console.log("Obteniendo lista de pedidos", search)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      let extra = (search !== '' && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(orden_ref),' ',TRIM(proveedor),' ',TRIM(produccion),' ',TRIM(estado))) > 0").join(" ") : ""

      // SECCION CONSULTA PEDIDOS
      console.log("Consulta extra :", extra)
      const query = `
      SELECT tb1.idx,tb1.orden_ref,tb1.tipo,tb1.proveedor,tb1.fec_emision,tb1.fec_retorno,COALESCE(DATEDIFF(tb1.fec_retorno,tb1.fec_emision),'') as tiempo_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(tb1.fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,tb1.forma_pago,tb1.estado,
        (
          SELECT SUM(COALESCE(cantidad,0)) FROM tbl2_pedidos_insumos_det tpid 
          WHERE tpid.id_pedido_CAB = tb1.idx
        ) as cantidad,
        (
          SELECT SUM(COALESCE(cantidad,0)*COALESCE(precio,0)) FROM tbl2_pedidos_insumos_det tpid 
          WHERE tpid.id_pedido_CAB = tb1.idx
        ) as importe,
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
          SELECT COALESCE(sum(COALESCE(tlc.importe,0)),0) FROM tbl2_letras_cab tlc 
          JOIN tbl2_letras_adi tla on tlc.idx = tla.id_letra_CAB 
          JOIN tbl2_despachos_adi tda on tda.idx = tla.id_factura_CAB 
          JOIN tbl2_despachos_cab tdc on tda.id_despacho_CAB = tdc.idx
          WHERE tdc.id_pedido_origen = tb1.idx
        ) as cancelado
        FROM tbl2_pedidos_insumos_cab tb1
        WHERE 1=1 ${extra}
        ORDER BY created_at DESC 
        LIMIT 100
      `
      console.log("EL query de consulta es el siguiente :",query)
      const [results, fields] = await conn.query(query);

      console.log("El resultado de la busqueda es el siguiente :",results)

      // let extra2 = ''
      // let estado = ''
      // switch(estado){
      //   case 'PENDIENTE':
      //     extra2 = `tb1.estado not in ('FINALIZADO','ANULADO') && tb1.cantidad > tb1.ingresos`
      //     break;
      //   case 'FINALIZADO':
      //     extra2 = `tb1.estado = 'FINALIZADO' || tb1.cantidad <= tb1.ingresos`
      //     break;
      //   case 'ANULADO':
      //     extra2 = `tb1.estado = 'ANULADO'`
      //     break;
      //   default:
      //     break;
      // }

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
  static async getNuevoPedido(tipo) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      // const [results, fields] = await conn.query("SELECT (orden_ref + 1) as correlativo FROM tbl2_pedidos_insumos_cab tpic WHERE estado <> 'ANULADO' ORDER BY idx DESC LIMIT 1");
      // const [results, fields] = await conn.query("SELECT (orden_ref + 1) as correlativo FROM tbl2_pedidos_insumos_cab tpic ORDER BY idx DESC LIMIT 1");

      const [results] = await conn.query("SELECT (codigo_num + 1) as correlativo FROM tbl2_pedidos_insumos_correlativo WHERE ruc_ = ? AND anio = YEAR(NOW()) AND tipo = ?",['20522094120',tipo])

      return results[0].correlativo
    } catch (err) {
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  static async saveInfoPedidos(data) {
    let conn
    const results = { ok: true, message: 'test' }
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:", cabecera)
    console.log("Informacion detalle:", articulos)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      conn.beginTransaction()
      if (data.id) {
        await conn.query('UPDATE tbl2_pedidos_insumos_cab SET orden_ref=NULLIF(?, ""),fec_emision=NULLIF(?, ""),fec_retorno=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),forma_pago=NULLIF(?, ""),nro_contacto=NULLIF(?, ""),observaciones=NULLIF(?, ""),estado=NULLIF(?, ""),moneda=NULLIF(?, ""),igv=NULLIF(?, ""),produccion=NULLIF(?, ""),afec_retencion=NULLIF(?, "") WHERE idx = ?', [cabecera.orden_ref, cabecera.fec_emision, cabecera.fec_retorno, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.responsable, cabecera.forma_pago, cabecera.nro_contacto, cabecera.observaciones, cabecera.estado, cabecera.moneda, cabecera.igv, cabecera.produccion, cabecera.afec_retencion, parseInt(data.id)])

        const [res, fld] = await conn.query("SELECT *FROM tbl2_pedidos_insumos_det WHERE id_pedido_CAB = " + parseInt(data.id))
        const ids_delete = res.filter(row => row.idx !== '' && !articulos.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))

        const insert = async () => {
          const fila = articulos.shift()
          if (fila) {
            let fracciones = []
            if (fila.idx && fila.idx !== '') {
              console.log("Dentro de 1 actualizacion")
              const [results, fields] = await conn.query('UPDATE tbl2_pedidos_insumos_det SET id_pedido_CAB=NULLIF(?, ""),id_producto_CAB=NULLIF(?, ""),producto=NULLIF(?, ""),color=NULLIF(?, ""),rollos=NULLIF(?, ""),cantidad=NULLIF(?, ""),unidad=NULLIF(?, ""),precio=NULLIF(?, ""),anulado=NULLIF(?, "") WHERE idx = ?', [parseInt(data.id), fila.id_producto_CAB, fila.producto, fila.color, fila.rollos, fila.cantidad, fila.unidad, fila.precio, fila.anulado, fila.idx]);

            } else {
              console.log("Dentro de 2 insertado")
              const [results, fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,id_producto_CAB,producto,color,rollos,cantidad,unidad,precio,anulado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [parseInt(data.id), fila.id_producto_CAB, fila.producto, fila.color, fila.rollos, fila.cantidad, fila.unidad, fila.precio, fila.anulado]);

            }
            await insert()
          } else {
            console.log("Devolviendo resolve")
            return Promise.resolve('')
          }
        }
        await insert()

        const eliminar = async () => {
          const fila = ids_delete.shift()
          if (fila) {
            await conn.query('DELETE FROM `tbl2_pedidos_insumos_det` WHERE `id_pedido_CAB` = ? and `idx` = ?', [parseInt(data.id), parseInt(fila.idx)])
            await eliminar()
          } else {
            return Promise.resolve('')
          }
        }
        await eliminar()

        // const [test,otro] = await conn.query("select *from tbl2_pedidos_insumos_det tpid where id_pedido_CAB = 13")
        // console.log("Comprueba actualizacion:",test)

      } else {
        console.log("Creandsssso")
        try {

          const correlativo = await this.getNuevoPedido(cabecera.tipo)

          const [res, fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_cab(orden_ref,fec_emision,fec_retorno,tipo,id_proveedor_CAB,proveedor,responsable,forma_pago,nro_contacto,observaciones,estado,moneda,igv,produccion,afec_retencion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [correlativo, cabecera.fec_emision, cabecera.fec_retorno, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.responsable, cabecera.forma_pago, cabecera.nro_contacto, cabecera.observaciones, cabecera.estado, cabecera.moneda, cabecera.igv, cabecera.produccion, cabecera.afec_retencion])

          const insert = async () => {
            const fila = articulos.shift()
            if (fila) {
              const [results, fields] = await conn.query('INSERT INTO tbl2_pedidos_insumos_det(id_pedido_CAB,id_producto_CAB,producto,modelo,corte,color,rollos,cantidad,unidad,precio) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [res.insertId, fila.id_producto_CAB, fila.producto, fila.modelo, fila.corte, fila.color, fila.rollos, fila.cantidad, fila.unidad, fila.precio]);
              await insert()
            } else {
              return Promise.resolve('')
            }
          }
          await insert()

          await conn.query("update tbl2_pedidos_insumos_correlativo set codigo_num = codigo_num + 1 where ruc_ = ? and anio = YEAR(NOW()) and tipo = ?",['20522094120',cabecera.tipo])

        } catch (err) {
          console.log("error en la consulta", err)
        }
        // await conn.end();
        // return resultS
      }

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Registro completo'}
    } catch (err) {
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getInfoPedidoCab(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT DATE_FORMAT(tpic.fec_emision,"%d/%m/%Y") as fec_emision_cuadre,DATE_FORMAT(tpic.fec_retorno,"%d/%m/%Y") as fec_retorno_cuadre,DATEDIFF(STR_TO_DATE(tpic.fec_retorno,"%Y-%m-%d"), STR_TO_DATE(tpic.fec_emision,"%Y-%m-%d")) as duracion,tp.ruc as ruc,tpic.* FROM tbl2_pedidos_insumos_cab tpic join tbl2_proveedor tp on tpic.id_proveedor_CAB = tp.idx where tpic.idx = ?', [id]);
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
  static async getInfoPedidoDet(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_pedidos_insumos_det where id_pedido_CAB = ?', [id]);
      const ids = results.map(row => row.idx)

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
  static async getInfoPedidoDespacho(id) {
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
      WHERE tpid.id_pedido_CAB = ? and COALESCE(tpid.anulado,0) = 0`, [id]);

      const ids = results.map(row => row.idx)
      console.log("Lista de ids:", ids)

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
  static async eliminarInfoPedidos(id) {
    let conn
    // console.log("El id de eliminado es el siguiente:",id)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let [info_pedido] = await conn.query("SELECT *FROM tbl2_pedidos_insumos_cab WHERE idx = ?",[id])

      await conn.query('DELETE FROM `tbl2_pedidos_insumos_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE FROM `tbl2_pedidos_insumos_det` WHERE `id_pedido_CAB` = "' + id + '"');
      await conn.query('UPDATE tbl2_pedidos_insumos_correlativo SET codigo_num = codigo_num - 1 WHERE ruc_ = ? AND anio = YEAR(NOW()) AND tipo = ?',['20522094120',info_pedido[0].tipo]);
      
      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return results
    } catch (err) {
      if(conn) conn.rollback()
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  //////////////////////////////////
  //seccion guias traslado interno
  //////////////////////////////////
  static async getListaDespachos(tipo, search) {
    console.log("El filtro de busqueda es :", search)
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(tdc.tipo,'')),' ',TRIM(COALESCE(tdc.proveedor,'')),' ',TRIM(COALESCE(tdc.nro_guia,'')),' ',TRIM(COALESCE(COALESCE(tgtc.servicio,''),'')),' ',TRIM(COALESCE(tgtc.producto,'')),' ',TRIM(COALESCE(tgtc.marca,'')),' ',TRIM(COALESCE(tgtc.modelo,'')))) > 0").join(" ") : ""

      const consulta = `SELECT tdc.idx,DATE_FORMAT(tdc.fec_emision_guia,'%d/%m/%Y') as fec_emision_guia,DATE_FORMAT(tdc.fec_despacho,'%d/%m/%Y') as fec_despacho,tdc.id_proveedor_CAB,tdc.proveedor,tdc.tipo,tdc.nro_guia,tdc.id_guia_origen,tdc.nro_guia_origen,tdc.id_pedido_origen,tdc.nro_pedido_origen,tdc.responsable,tdc.observaciones,tdc.created_at,tgtc.servicio,tgtc.producto,tgtc.marca,tgtc.modelo,if(tdc.tipo = 'PEDIDOS',tpic.idx,tgtc.idx) as idguia_ref,tpic.tipo as subtipo
      FROM tbl2_despachos_cab tdc 
      left join tbl2_guias_traslado_cab tgtc on tdc.id_guia_origen = tgtc.idx
      left join tbl2_pedidos_insumos_cab tpic on tdc.id_pedido_origen = tpic.idx
      WHERE tdc.tipo = '${tipo}' ${extra}
      ORDER BY created_at desc`

      console.log("Mostrado query de lista despachos:", consulta)

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
  static async saveInfoDespachos(data) {
    let conn
    const results = { ok: true, message: 'test' }
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)
    const facturas = JSON.parse(data.facturas)

    console.log("Informacion cabecera:", cabecera)
    console.log("Informacion detalle:", articulos)
    console.log("Informacion facturas:", facturas)
    // return resultS
    let data_backup = undefined, info_orden = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      if(cabecera.tipo !== 'PEDIDOS'){
        [data_backup] = await conn.query(`select tdd.id_combo,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',t1.talla,'despachos',t1.despachos,'caidos',t1.caidos)) from tbl2_despachos_det_fracciones t1 where t1.id_despacho_DET = tdd.idx),JSON_ARRAY()) as fracciones from tbl2_despachos_det tdd where tdd.id_despacho_CAB = ?`,[data.id]);
        [info_orden] = await conn.query('select *from tbl2_guias_traslado_cab where idx = ?',[parseInt(cabecera.id_guia_origen)])
      }

      if (data.id) {
        await conn.query('UPDATE tbl2_despachos_cab SET fec_emision_guia=NULLIF(?, ""),fec_despacho=NULLIF(?, ""),tipo=NULLIF(?, ""),id_proveedor_CAB=NULLIF(?, ""),proveedor=NULLIF(?, ""),responsable=NULLIF(?, ""),id_guia_origen=NULLIF(?, ""),nro_guia_origen=NULLIF(?, ""),id_pedido_origen=NULLIF(?, ""),nro_pedido_origen=NULLIF(?, ""),observaciones=NULLIF(?, ""),nro_guia=NULLIF(?, ""),nro_factura=NULLIF(?, ""),imp_factura=NULLIF(?, ""),facturado=NULLIF(?, "") WHERE idx = ?', [cabecera.fec_emision_guia, cabecera.fec_despacho, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.responsable, cabecera.id_guia_origen, cabecera.nro_guia_origen, cabecera.id_pedido_origen, cabecera.nro_pedido_origen, cabecera.observaciones, cabecera.nro_guia, cabecera.nro_factura, cabecera.imp_factura,cabecera.facturado, parseInt(data.id)])

        const [res, fld] = await conn.query("SELECT *FROM tbl2_despachos_det WHERE id_despacho_CAB = " + parseInt(data.id))
        const ids_delete = res.filter(row => row.idx !== '' && !articulos.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))


        for(let fila of [...articulos]){
          let id_det = null
          if (fila.idx && fila.idx !== '') {
            console.log("Detro de la actualizacion")
            const [results, fields] = await conn.query('UPDATE tbl2_despachos_det SET precio=NULLIF(?, ""),despacho=NULLIF(?, ""),caidos=NULLIF(?, "") WHERE idx = ? and id_despacho_CAB = ?', [fila.precio, fila.despacho, fila.caidos, fila.idx, parseInt(data.id)]);
            id_det = fila.idx

          } else {
            const [results, fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [parseInt(data.id), fila.id_item, fila.despacho, fila.caidos]);
            id_det = insertdet.insertId
          }

          if(cabecera.tipo !== 'PEDIDOS' && fila.fracciones_despacho.length > 0){
            // console.log("Informacion de la fraccion :",detalle.fracciones_despacho)
            let fracciones_despacho = fila.fracciones_despacho.reduce((c,v)=>{
              c.push([id_det,v.talla,v.cantidad,v.caidos])
              return c
            },[])
            console.log("La informacion a insertar es:",fracciones_despacho)
            await conn.query(`DELETE FROM tbl2_despachos_det_fracciones WHERE id_despacho_DET = ?`,[parseInt(id_det)])
            await conn.query(`INSERT INTO tbl2_despachos_det_fracciones(id_despacho_DET,talla,despachos,caidos) values ?`,[fracciones_despacho])
            
          }

        }

        // const insert = async () => {
        //   const fila = articulos.shift()
        //   if (fila) {
        //     if (fila.idx && fila.idx !== '') {
        //       console.log("Detro de la actualizacion")
        //       const [results, fields] = await conn.query('UPDATE tbl2_despachos_det SET precio=NULLIF(?, ""),despacho=NULLIF(?, ""),caidos=NULLIF(?, "") WHERE idx = ? and id_despacho_CAB = ?', [fila.precio, fila.despacho, fila.caidos, fila.idx, parseInt(data.id)]);
        //     } else {
        //       const [results, fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,despacho,caidos) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [parseInt(data.id), fila.id_item, fila.despacho, fila.caidos]);
        //     }
        //     await insert()
        //   } else {
        //     console.log("Devolviendo resolve")
        //     return Promise.resolve('')
        //   }
        // }
        // await insert();


        console.log("Lista de filas a eliminar:", ids_delete)
        const eliminar = async () => {
          console.log("Eliminando")
          const fila = ids_delete.shift()
          if (fila) {
            await conn.query('DELETE FROM `tbl2_despachos_det` WHERE `id_despacho_CAB` = ? and `idx` = ?', [parseInt(data.id), parseInt(fila.idx)])
            await eliminar()
          } else {
            return Promise.resolve('')
          }
        }
        await eliminar();

        const [res2] = await conn.query("SELECT *FROM tbl2_despachos_adi WHERE id_despacho_CAB = " + parseInt(data.id))
        const ids_delete2 = res2.filter(row => row.idx !== '' && !facturas.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))
        console.log("Lista de filas a eliminar:", ids_delete2)
        console.log("Las facturas a insertar son:",facturas)
        const insert2 = async () => {
          console.log("Hola mundo facturas")
          const fila = facturas.shift()
          console.log("Dentro de insertado facturas", fila)
          if (fila) {
            if (fila.idx && fila.idx !== '') {
              const [results, fields] = await conn.query('UPDATE tbl2_despachos_adi SET tipodoc=NULLIF(?, ""),moneda=NULLIF(?, ""),serie=NULLIF(?, ""),numero=NULLIF(?, ""),fec_emision=NULLIF(?, ""),unidades=NULLIF(?, ""),importe_bruto=NULLIF(?, ""),base_imponible=NULLIF(?, ""),monto_inafecto=NULLIF(?, ""),igv=NULLIF(?, ""),importe_total=NULLIF(?, "") WHERE idx = ? and id_despacho_CAB = ?', [fila.tipodoc, fila.moneda, fila.serie, fila.numero, fila.fec_emision, fila.unidades, fila.importe_bruto, fila.base_imponible, fila.monto_inafecto, fila.igv, fila.importe_total, fila.idx, parseInt(data.id)]);
            } else {
              const [results, fields] = await conn.query('INSERT INTO tbl2_despachos_adi(id_despacho_CAB,tipodoc,moneda,serie,numero,fec_emision,unidades,importe_bruto,base_imponible,monto_inafecto,igv,importe_total) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [parseInt(data.id), fila.tipodoc, fila.moneda, fila.serie, fila.numero, fila.fec_emision, parseFloat(fila.unidades), parseFloat(fila.importe_bruto), parseFloat(fila.base_imponible), parseFloat(fila.monto_inafecto), parseFloat(fila.igv), parseFloat(fila.importe_total)]);
            }
            await insert2()
          } else {
            return Promise.resolve('')
          }
        }
        await insert2()
        const eliminar2 = async () => {
          console.log("Dentro de eliminando facturas")
          const fila = ids_delete2.shift()
          if (fila) {
            await conn.query('DELETE FROM `tbl2_despachos_adi` WHERE `id_despacho_CAB` = ? and `idx` = ?', [parseInt(data.id), parseInt(fila.idx)])
            await eliminar2()
          } else {
            return Promise.resolve('')
          }
        }
        await eliminar2()

        if(cabecera.tipo !== 'PEDIDOS'){

          let [result,fields] = await conn.query(`
            SELECT idx,orden_ref,producto,responsable,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
            (
              select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
            ) as cantidad_servicio,
            (
              select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
              join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
              where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
            ) as ingresos
            FROM tbl2_guias_traslado_cab where idx = ?
            `,[parseInt(cabecera.id_guia_origen)])
          let valida = result[0].ingresos >= result[0].cantidad_servicio ? 1 : 0
          if(valida){
            await conn.query("UPDATE tbl2_guias_traslado_cab SET estado = 'FINALIZADO' WHERE idx = ?",[parseInt(cabecera.id_guia_origen)])
          }
        }

      //////////////////////////////////////////////////////////////
      //////////////INICIA SEGUNDA SECCION DE INGRE/////////////////
      //////////////////////////////////////////////////////////////
      } else {
        try {
          const [res, fields] = await conn.query('INSERT INTO tbl2_despachos_cab(fec_emision_guia,fec_despacho,tipo,id_proveedor_CAB,proveedor,responsable,id_guia_origen,nro_guia_origen,id_pedido_origen,nro_pedido_origen,observaciones,nro_guia,nro_factura,imp_factura,facturado) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [cabecera.fec_emision_guia, cabecera.fec_despacho, cabecera.tipo, cabecera.id_proveedor_CAB, cabecera.proveedor, cabecera.responsable, cabecera.id_guia_origen, cabecera.nro_guia_origen, cabecera.id_pedido_origen, cabecera.nro_pedido_origen, cabecera.observaciones, cabecera.nro_guia, cabecera.nro_factura, cabecera.imp_factura,cabecera.facturado])


          console.log("Inicia insertado detalle despacho")
          for(let detalle of [...articulos]){

            const [results, fields] = await conn.query('INSERT INTO tbl2_despachos_det(id_despacho_CAB,id_item,precio,despacho,caidos,id_combo) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [res.insertId, detalle.id_item, detalle.precio, parseFloat(detalle.despacho ?? 0), parseFloat(detalle.caidos ?? 0),detalle.id_combo]);

            if(cabecera.tipo !== 'PEDIDOS' && detalle.fracciones_despacho.length > 0){
              console.log("Informacion de la fraccion :",detalle.fracciones_despacho)
              let fracciones_despacho = detalle.fracciones_despacho.reduce((c,v)=>{
                c.push([results.insertId,v.talla,v.cantidad,v.caidos])
                return c
              },[])
              // let fracciones_despacho = ['xs','s','m','l','xl','xxl'].reduce((c,v)=>{
              //   c.push([results.insertId,v,detalle.fracciones_despacho[0][v],detalle.fracciones_despacho[1][v]])
              //   return c
              // },[])
              console.log("La informacion a insertar es:",fracciones_despacho)
              await conn.query(`INSERT INTO tbl2_despachos_det_fracciones(id_despacho_DET,talla,despachos,caidos) values ?`,[fracciones_despacho])
            }
        }
        
        const insert2 = async () => {
          console.log("Insertado de factura bucle contador")
            const fila = facturas.shift()
            if (fila) {
              const [results, fields] = await conn.query('INSERT INTO tbl2_despachos_adi(id_despacho_CAB,tipodoc,moneda,serie,numero,fec_emision,unidades,importe_bruto,base_imponible,monto_inafecto,igv,importe_total) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', [res.insertId, fila.tipodoc, fila.moneda, fila.serie, fila.numero, fila.fec_emision, parseFloat(fila.unidades), parseFloat(fila.importe_bruto), parseFloat(fila.base_imponible), parseFloat(fila.monto_inafecto), parseFloat(fila.igv), parseFloat(fila.importe_total)]);

              await insert2()
            } else {
              return Promise.resolve('')
            }
          }
          (cabecera.id_pedido_origen ?? false) && await insert2()

          if(cabecera.tipo !== 'PEDIDOS'){
            console.log("Comienza validacion del saldo de articulos")
            let [result,fields] = await conn.query(`
              SELECT idx,orden_ref,producto,responsable,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
              (
                select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
              ) as cantidad_servicio,
              (
                select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
                join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
                where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
              ) as ingresos
              FROM tbl2_guias_traslado_cab where idx = ?
              `,[parseInt(cabecera.id_guia_origen)])

            console.log("Info de la validacoines :",result)
        
            let valida = result[0].ingresos >= result[0].cantidad_servicio ? 1 : 0
            if(valida){
              await conn.query("UPDATE tbl2_guias_traslado_cab SET estado = 'FINALIZADO' WHERE idx = ?",[parseInt(cabecera.id_guia_origen)])
            }
          }

        } catch (err) {
          console.log("error en la consulta", err)
        }
      }

      ///////////////////////////////////////////
      ///// UPDATE MASTES DE PRODUCCION /////////
      if(cabecera.tipo == 'SERVICIOS'){
        console.log("Comenzando actulizacion master de produccion")
        // muestra info [{idcombo:22,xs:[0,3],s:[0,3],m:[0,3],l:[0,3],xl:[0,3],xxl:[0,3]},{},{},...]
        let param1 = data_backup.reduce((c,v)=>{
          let pp = v.fracciones.reduce((cc,vv)=>{
            cc = {...cc,[vv.talla]:[ parseInt(vv.despachos),parseInt(vv.caidos) ]}
            return cc
          },{idcombo:v.id_combo})
          c.push(pp)
          return c
        },[])
        console.log("El valor del primer dato es:",param1)
        console.log("La informacion de los articulo es :",articulos)
        let param2 = articulos.filter(item=>item.id_combo).reduce((c,v)=>{
          let pp = v.fracciones_despacho.reduce((cc,vv)=>{
            return {...cc,[vv.talla]:[vv.cantidad,vv.caidos]}
          },{idcombo:v.id_combo})
          c.push(pp)
          return c
        },[])
        console.log("El valor del segundo dato es:",param2)
  
        let respuesta = await this.UpdateMasterProduccion(param1,param2,info_orden[0].id_orden_CAB,conn,0) // tipo = 1 => RESTA, tipo = 0 => SUMA
        console.log("Imprimiendo respuestad del master:",respuesta)
        if(!respuesta.ok) throw respuesta.message
        // console.log("Resultado del update master :",resp_update)
      }

      ///////////////////////////////////////////
      ///////////////////////////////////////////

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Proceso ejecutado con éxito'}
    } catch (err) {
      console.log("asdlkfaslfjlaskdfjlf:",err)
      if (conn) conn.rollback()
      // return {ok:false,message:err.message}
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getInfoDespachoCab(id) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [results, fields] = await conn.query('SELECT *FROM tbl2_despachos_cab where idx = ?', [id]);
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
  static async getInfoDespachoDet(id, tipo = null) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let new_articulos = null
      if (tipo == 'PEDIDOS') {
        const [data] = await conn.query(`select tdd.idx,tgtd.id_pedido_CAB,tgtd.id_producto_CAB,tgtd.producto,tgtd.color,tgtd.rollos,tgtd.cantidad,tgtd.unidad,tgtd.anulado,IF(tdd.precio IS NULL,tgtd.precio,tdd.precio) as precio,tdd.despacho 
        FROM tbl2_pedidos_insumos_det tgtd 
        JOIN tbl2_despachos_det tdd on tdd.id_item = tgtd.idx 
        WHERE tdd.id_despacho_CAB = ?`, [id]);

        // const [data2] = await conn.query('SELECT tda.* FROM tbl2_despachos_adi tda WHERE tda.id_despacho_CAB = ?',[id]);

        new_articulos = data
      } else {
        console.log("El id del despacho es: ", id)
        const [results, fields] = await conn.query(`
          SELECT tdd.idx,tdd.id_item,tgtc.servicio,tgtc.modelo,tgtd.id_guia_CAB,tgtd.articulo,tgtd.cantidad,tgtd.isprototipo,
          tdd.despacho,tdd.caidos,tdd.id_combo,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',t1.talla,'cantidad',t1.despachos,'caidos',t1.caidos)) 
          from tbl2_despachos_det_fracciones t1 where t1.id_despacho_DET = tdd.idx ),JSON_ARRAY()) as fracciones_despacho
          FROM tbl2_guias_traslado_det tgtd 
          JOIN tbl2_despachos_det tdd on tdd.id_item = tgtd.idx 
          JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tgtd.id_guia_CAB
          WHERE tdd.id_despacho_CAB = ?
        `, [id]);
        console.log(results)
        const ids = results.map(row => row.id_item)

        const [results2] = await conn.query("select id_guia_DET,concat('({',GROUP_CONCAT(concat(talla,':',CAST(cantidad as unsigned))),'})') as fracciones from tbl2_guias_traslado_det_fracciones where id_guia_DET in (?) group by id_guia_DET", [ids])

        console.log(results2)
        new_articulos = results.map(row => {
          let add = eval(results2.filter(row2 => row2.id_guia_DET == row.id_item)[0].fracciones)
          return { ...row, ...add }
        })

      }
      console.log("detalle desoachoss:", new_articulos)

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
  static async getInfoDespachoAdi(id, tipo = null) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [data, fields] = await conn.query('SELECT tda.* FROM tbl2_despachos_adi tda WHERE tda.id_despacho_CAB = ?', [id]);
      // new_articulos = data

      await conn.end();
      return data
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async eliminarInfoDespachos(id) {
    let conn
    console.log("El id de eliminado es el siguiente:",id)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let [cabecera] = await conn.query('select *from tbl2_despachos_cab where idx = ?',[id])
      let [data_backup] = await conn.query(`select tdd.id_combo,COALESCE((select JSON_ARRAYAGG(JSON_OBJECT('talla',t1.talla,'despachos',t1.despachos,'caidos',t1.caidos)) from tbl2_despachos_det_fracciones t1 where t1.id_despacho_DET = tdd.idx),JSON_ARRAY()) as fracciones from tbl2_despachos_det tdd where tdd.id_despacho_CAB = ?`,[id])
      let [info_orden] = await conn.query('select *from tbl2_guias_traslado_cab where idx = ?',[parseInt(cabecera[0].id_guia_origen)])
      let param1 = data_backup.filter(row=>row.id_combo).reduce((c,v)=>{
        let pp = v.fracciones.reduce((cc,vv)=>{
          cc = {...cc,[vv.talla]:[ parseInt(vv.despachos),parseInt(vv.caidos) ]}
          return cc
        },{idcombo:v.id_combo})
        c.push(pp)
        return c
      },[])
      console.log("Info del parametro 1:",param1)

      await conn.query('DELETE FROM `tbl2_despachos_cab` WHERE `idx` = "' + id + '"');
      await conn.query('DELETE t1,t2 FROM tbl2_despachos_det t1 JOIN tbl2_despachos_det_fracciones t2 ON t1.idx = t2.id_despacho_DET WHERE t1.id_despacho_CAB = ' + parseInt(id));
      
      let resultado = await this.UpdateMasterProduccion(param1,[],info_orden[0].id_orden_CAB,conn,0)
      if(!resultado.ok) throw resultado.message
      // let [validacion] = await conn.query("select sum(produccion_total) from tbl2_fases_prod_hojacorte_combos_fracciones where id_combo_CAB in (970,971,989)")
      // console.log("La informacion de la validacion es :",validacion)

      // if (conn) await conn.rollback();
      if (conn) await conn.commit();
      return {ok:true,message:'Ingreso eliminado con éxtio!'}
    } catch (err) {
      if (conn) await conn.rollback();
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async getStatusGuia(id) {
    const conn = await mysql.createConnection(configs[1])
    await conn.connect();

    // const consulta = await conn.query("SELECT *from tbl2_iforme_guia where ruc = '20522094120' and nro_guia = ?",[id])
    // const consulta2 = await conn.query("SELECT *from tbl2_iforme_guia where ruc = '20522094120' and nro_guia = ?",[id])

    // consulta2.map(row=>{
    //   console.log("El valor de la columna es :",row.estado)
    // })

    return 0
  }
  static async getInfoInforme(params) {
    let conn
    try {
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let filtros = Object.keys(params).reduce((carry, valor) => {
        if (params[valor] !== '')
          switch (valor) {
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
      }, '')
      console.log(filtros)

      const [resultado] = await conn.query(`SELECT tgtc.idx as id_guia,tgtc.servicio,tgtc.orden_ref,tgtc.fec_emision,tgtc.fec_retorno,tgtc.id_proveedor_CAB,tgtc.proveedor,tpid.idx,tpid.articulo,tpid.cantidad,GROUP_CONCAT(dp.nro_guia) as guia,tgtc.costo,sum(dp.despacho) as total_despacho
        FROM tbl2_guias_traslado_det tpid 
        JOIN tbl2_guias_traslado_cab tgtc on tgtc.idx = tpid.id_guia_CAB 
        LEFT JOIN(
          SELECT tdc.nro_guia,tdc.id_guia_origen,tdc.idx,tdd.id_item,tdd.precio,tdd.despacho FROM tbl2_despachos_cab tdc 
          LEFT JOIN tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        ) AS dp on tpid.id_guia_CAB = dp.id_guia_origen and tpid.idx = dp.id_item
      WHERE tgtc.estado not in ('ANULADO','PENDIENTE') and COALESCE(tpid.isprototipo,0) = 0 `+ filtros + `
      GROUP BY tgtc.idx,tgtc.servicio,tgtc.orden_ref,tgtc.fec_emision,tgtc.fec_retorno,tgtc.id_proveedor_CAB,tgtc.proveedor,tpid.idx,tpid.articulo,tpid.cantidad,tgtc.costo`)

      await conn.end();
      return resultado;
    } catch (err) {

    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getInfoAbonos() {
    let conn
    try {
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [resultado] = await conn.query(`select ta.*,tc.id_servicio_CAB from tbl2_abonos ta join tbl2_conciliaciones tc on ta.idx = tc.id_abono_CAB where ta.ruc_ = '20522094120'`)
      await conn.end();
      return resultado;
    } catch (err) {
      return err
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async validaInventario() {
    // console.log(inventario)

    let conn
    try {
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [resultado] = await conn.query(`select tid.* From tbl2_inventario_cab tic 
      join tbl2_inventario_det tid on tic.idx = tid.id_inventario_CAB
      where tic.idx = 723`)

      let diferencias = inventario.filter(item => {
        return resultado.find(row => parseInt(row.idxsub) == parseInt(item.idxsub) && parseInt(row.cantidad) !== parseInt(item.cantidad))
      })
      console.log("Las diferencias: ", diferencias.map(row => row.producto + " - " + row.talla + " - " + row.color + " - " + row.cantidad))

      await conn.end();
      return ['hola'];
    } catch (err) {
      console.log(err)
      return err
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async validaSaldoGuia(idguia){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      console.log("Id guia a validar:",idguia)

      let [result,fields] = await conn.query(`
      SELECT idx,orden_ref,producto,responsable,modelo,marca,estado,tipo,servicio,id_proveedor_CAB,proveedor,fec_emision,DATE_FORMAT(fec_emision,'%d/%m/%Y') as fec_emision_guia,fec_retorno,DATE_FORMAT(fec_retorno,'%d/%m/%Y') as fec_retorno_guia,fec_recepcion,costo,COALESCE(DATEDIFF(fec_retorno,fec_emision),'') as tiempo_produccion,COALESCE(DATEDIFF(STR_TO_DATE(fec_retorno,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
      (
        select sum(cantidad) from tbl2_guias_traslado_det tgtd where tgtd.id_guia_CAB = tbl2_guias_traslado_cab.idx
      ) as cantidad_servicio,
      (
        select COALESCE(sum(COALESCE(tdd.despacho,0) + COALESCE(tdd.caidos,0)),0) as total from tbl2_despachos_cab tdc 
        join tbl2_despachos_det tdd on tdc.idx = tdd.id_despacho_CAB
        where tdc.id_guia_origen = tbl2_guias_traslado_cab.idx
      ) as ingresos
      FROM tbl2_guias_traslado_cab where idx = ?
      `,[idguia])

      console.log("COnsulta saldo guia:",result)

      return result[0].ingresos >= result[0].cantidad_servicio ? 1 : 0

    } catch (error) {
      if(conn){
        await conn.end()
      }
    } finally {
      if(conn){
        await conn.end()
      }
    }
  }
  static async getListaPenalidades() {
    let conn
    try {
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [resultado] = await conn.query(`SELECT *FROM tbl2_penalidades_servicios`)
      await conn.end();
      return resultado;
    } catch (err) {
      return err
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getListaReprogramacionGuias(idguia){
    console.log("Test2 desde otra galaxia")
    let conn
    try {
      let conn = await mysql.createConnection(configs[1])
      await conn.connect();
      const [resultado] = await conn.query(`SELECT id_guia_CAB as idguia,fecha_entrega,observacion FROM tbl2_guias_traslado_reprogramacion where id_guia_CAB = ?`,[idguia])
      await conn.end();
      return resultado;
    } catch (err) {
      return err
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
}
