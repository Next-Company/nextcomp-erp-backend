import { raceWith } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { configs } from "../../Main/utils.js";
import mysql from "mysql2/promise";
// import { inventario } from "../../Main/config.js";
export class OrdenesModel {
  static async getOrdenes(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(oc),''),' ',COALESCE(TRIM(cliente),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(modelos),''),' ',COALESCE(TRIM(estado_orden),''))) > 0").join(" ") : ""

      let [results] = await conn.query(`
        SELECT *,
        (COALESCE(combo1_orden,0) + COALESCE(combo2_orden,0) + COALESCE(combo3_orden,0) + COALESCE(combo4_orden,0) + COALESCE(combo5_orden,0) + COALESCE(combo6_orden,0) + COALESCE(combo7_orden,0) + COALESCE(combo8_orden,0) + COALESCE(combo9_orden,0)) as total_orden,
        (COALESCE(combo1_corte,0) + COALESCE(combo2_corte,0) + COALESCE(combo3_corte,0) + COALESCE(combo4_corte,0) + COALESCE(combo5_corte,0) + COALESCE(combo6_corte,0) + COALESCE(combo7_corte,0) + COALESCE(combo8_corte,0) + COALESCE(combo9_corte,0)) as total_corte,
        DATE_FORMAT(fec_emitida,'%d/%m/%Y') as fec_emitida_orden,
        DATE_FORMAT(fec_entrega,'%d/%m/%Y') as fec_entrega_orden,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),STR_TO_DATE(fec_emitida,'%Y-%m-%d') ),0) as dias_produccion,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes
        FROM viewProduccionOrdenes 
        WHERE 1=1 ${extra} ORDER BY idx desc
      `);
      await conn.end();

      // console.log("Info ruta proceso",results[0].ruta_proceso,eval(results[0].ruta_proceso),JSON.parse(results[0].ruta_proceso))

      results = results.reduce((carry,value)=>{

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
          let lista_pre = value.status == 'CORTE' ? ['MOLDE','CORTE'] : ( value.status == 'MOLDE' ? ['MOLDE'] : [] )
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
  static async saveFaseOrden(info, user_data) {
    let conn
    let nameimg = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let sql = ''
      const id = info.idx
      const combos = JSON.parse(info.combos)
      console.log("Empezando guardado de orodenses",info,user_data)

      const [consulta,fields] = await conn.execute("SELECT *FROM tbl2_fases_prod_ordenes WHERE idx = ?",[id])
      if (id == '') {
        // let busqueda = `select *from tbl2_fases_prod_ordenes tfpo where tfpo.oc = ${info.oc}`
        // console.log("La busqueda de duplicados :",busqueda)
        let [validacion] = await conn.query(`SELECT *FROM tbl2_fases_prod_ordenes tfpo WHERE tfpo.oc = ?`,[info.oc])
        if(validacion.length > 0) throw new Error("La oc ingresada ya se encuentra registrada. Por favor verifique.")

        try {
          console.log("Dentro de nueva orden de produccion")
          const campos = Object.keys(info).reduce((carry, current) => {
            fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
            return carry
          }, [])
          const values = campos.map(row => info[row])
          const [result] = await conn.execute('INSERT INTO tbl2_fases_prod_ordenes(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', values)
          const idinsert = result.insertId

          let combos_formateado = combos.map(row=>{
            return [idinsert,row.color_combo,row.cantidad_combo]
          })
          await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ?",[combos_formateado])

          // nameimg = `op_${idinsert}.jpg`
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
        await conn.query('UPDATE tbl2_fases_prod_ordenes SET ' + campos.map(row => row + " = NULLIF(?,'')").toString() + ' WHERE idx = ' + id,values)

        let combos_formateo = combos.map(row=>{
          return [id,row.color_combo,row.cantidad_combo]
        })
        await conn.query("DELETE FROM tbl2_fases_prod_ordenes_combos WHERE id_orden_CAB = ?",[id])
        await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ?",[combos_formateo])

        // nameimg = `op_${id}.jpg`
        // console.log(sql)
      }
      if (conn) conn.rollback()
      // if (conn) conn.commit()
      return { ok: true, mensaje: 'Guardado con exito' }
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return { ok: false, mensaje: err.message }
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

          // nameimg = `op_${idinsert}.jpg`
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

        // nameimg = `op_${id}.jpg`
        // console.log(sql)
      }
      if (conn) conn.rollback()
      // if (conn) conn.commit()
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

      
      const [ordenes] = await conn.query(`
        SELECT tfpo.*,
        ( COALESCE(tfpo.combo1_orden,0) + COALESCE(tfpo.combo2_orden,0) + COALESCE(tfpo.combo3_orden,0) + COALESCE(tfpo.combo4_orden,0) + COALESCE(tfpo.combo5_orden,0) + COALESCE(tfpo.combo6_orden,0) + COALESCE(tfpo.combo7_orden,0) + COALESCE(tfpo.combo8_orden,0) + COALESCE(tfpo.combo9_orden,0) ) as total_orden,
        (COALESCE(tfph.combo1_corte,0) + COALESCE(tfph.combo2_corte,0) + COALESCE(tfph.combo3_corte,0) + COALESCE(tfph.combo4_corte,0) + COALESCE(tfph.combo5_corte,0) + COALESCE(tfph.combo6_corte,0) + COALESCE(tfph.combo7_corte,0) + COALESCE(tfph.combo8_corte,0) + COALESCE(tfph.combo9_corte,0) ) as total_corte,
        COALESCE(DATEDIFF(STR_TO_DATE(fec_entrega,'%Y-%m-%d'),date(now())),0) as dias_pendientes,
        tfph.numero_corte,tfph.ruta_proceso
        FROM tbl2_fases_prod_ordenes tfpo 
        LEFT JOIN tbl2_fases_prod_hojacorte tfph on tfpo.idx = tfph.id_cab_orden 
        where tfpo.idx = ?
      `, [id]);

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


      return [ordenes,infoguias]
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) await conn.end();
    }
  }
  static async ActualizaCombos(){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      let [info] = await conn.query("SELECT *FROM tbl2_fases_prod_ordenes tb1 WHERE estado_orden <> 'OTRO' AND idx NOT IN (SELECT DISTINCT id_orden_CAB FROM tbl2_fases_prod_ordenes_combos)")
      let contador = 1

      let grupo_combos = [1,2,3,4,5,6,7,8,9,10,11,12,13,14]

      // console.log("Info de ordenes :",info)
      let pp = info.reduce((carry,value)=>{
        // console.log("Info de orden: ",value)
        let array_combos = grupo_combos.reduce((c,v)=>{
          value[`combo${v}_orden`] && c.push([value.idx,'NEGRO',value[`combo${v}_orden`]])
          return c
        },carry)
        // console.log("Array de combos:",array_combos)
        // carry.push({idx:value.idx,array_combos})
        return carry
      },[])

      await conn.query("INSERT INTO tbl2_fases_prod_ordenes_combos(id_orden_CAB,color_combo,cantidad_combo) VALUES ? ",[pp])

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
}