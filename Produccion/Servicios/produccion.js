import { connection } from "../../Main/utils.js";
export class ProduccionModel {
  static async getOrdenes(user_data) {
    try {
      // console.log("esta es otra consulta")
      // 
      const sql = "select * from view_ProduccionOrdenes"
      const [results, fields] = await connection.query(sql);

      // , fec_ingreso_acabados, guia_ingreso_acabados, cantidad_ingreso_acabados, fec_termino_acabados, fallas_acabados, fallas_tela_acabados, piezas_incomp_acabados, auditoria_acabados, estado_acabados
      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async getOrdenesById(info) {
    try {
      console.log("Estamos en consulta de ordenes by id")
      // const [results, fields] = await connection.query(
      //   'SELECT * FROM `tbl2_fases_prod_ordenes` where idx = '+ info.id +' order by idx desc'
      // );
      const [results, fields] = await connection.query(
        'SELECT * FROM `view_ProduccionOrdenes` where idx = '+ info.id +' order by idx desc'
      );
      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async testMultiSelect(info) {
    try {
      const results = [{ ok: true, mensaje: 'Guardado con exito' }]
      const otro = "'["+info.frutas.map(ele=>'"'+ele+'"')+"]'"
      console.log("Volviendo en texto :" + otro)
      console.log("Informacion enviadad del fronted :",info.frutas,info.frutas.toString())
      // const otro = "["+info.frutas+"]"
      // const valor = "" info.frutas.toString()
      const sql = "INSERT INTO `tbl2_testmulti`(ruta_proceso) VALUES ("+ otro +")"
      console.log("Mi consulta : ",sql)
      const [result] = await connection.query("INSERT INTO `tbl2_testmulti`(ruta_proceso) VALUES ("+ otro +")")

      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async traerMultiSelect() {
    try {
      const [result] = await connection.query("select *from tbl2_testmulti")
      console.log(result)
      return result
    } catch (err) {
      console.log(err);
    }
  }

  static async pushItems(info,user_data) {
    try {
      let sql = ''
      const table = info.table
      const id = info.idx
      console.log("Empezando push item")

      if(id == ''){
        sql = 'SELECT *FROM `'+ table +'` LIMIT 1';  
      }else{
        sql = 'SELECT *FROM `'+ table +'` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id +' LIMIT 1';
      }
      const [consulta, fields] = await connection.execute(sql)
      
      // const [consulta, fields] = await connection.query('SELECT *FROM `'+ table +'` WHERE ' + (table !== 'tbl2_fases_prod_ordenes' ? 'id_cab_orden' : 'idx') + ' = ' + id +' LIMIT 1');
      // const [consulta, fields] = await connection.query('SELECT *FROM `'+ table +'` LIMIT 1');
      console.log("La primera busqueda es: ",consulta, fields)
      if (id == '') {
        const campos = Object.keys(info).reduce((carry,current)=>{
          fields.map(row=>row.name).includes(current) && carry.push(current)
          return carry
        },[])
        const values = campos.map(row=>info[row])
        sql = 'INSERT INTO `' + table +'`('+ campos.toString() +') VALUES ('+ campos.map(row=>"NULLIF(?, '')").toString() +')';
        const [result] = await connection.execute(sql,values)

      } else {

        const campos = Object.keys(info).reduce((carry,current)=>{
          fields.filter(row=>row.name !== 'idx').map(row=>row.name).includes(current) && carry.push(current)
          return carry
        },[])
        const values = campos.map(row=>info[row])

        if(consulta.length > 0){
          sql = 'UPDATE `' + table +'` SET ' + campos.map(row=>row+" = NULLIF(?,'')").toString() +' WHERE `' + (table == 'tbl2_fases_prod_ordenes' ? 'idx' : 'id_cab_orden') + '` = ' + id;
        }else{
          sql = 'INSERT INTO `' + table +'`(id_cab_orden,'+ campos.toString() +') VALUES ('+ id + ',' + campos.map(row=>"NULLIF(?, '')").toString() +')';
        }
        const [result] = await connection.execute(sql,values)
        // console.log(sql)
      }
      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con xito'}]
      return [err]
    }
  }
  static async getAll(user_data) {
    console.log(user_data)
    try {
      const [results, fields] = await connection.query(
        'SELECT tb1.*,CASE WHEN tb1.categoria = "IMPL" THEN "Implementaciones" WHEN tb1.categoria = "SOPT" THEN "Soportes" ELSE "Proyectos" END categoria_nom,tb2.nom FROM `tbl2_soportes_cab` tb1 INNER JOIN `tbl_user` tb2 ON tb1.usuario = tb2.idx ' + `${user_data.niv !== 1 ? 'WHERE tb1.usuario = ?' : 'WHERE tb1.usuario = ? or tb1.usuario <> ?'}` + ' ORDER BY tb1.created_at DESC',[user_data.id,user_data.id]
      );
      // console.log(results);
      // console.log(fields);
      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async updateItems() {
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'INSERT INTO `tbl2_soportes_cab`(`usuario`,`descripcion`,`fec_programado`,`prioridad`) VALUES("Juan","Avanzar con campo vendedor en modulo de ventas","2024-06-15","ALTA")'
      );

      // const sql = 'INSERT INTO `users`(`name`, `age`) VALUES (?, ?), (?,?)';
      // const values = ['Josh', 19, 'Page', 45];
      // const [result, fields] = await connection.execute(sql, values);


      // console.log(results);
      // console.log(fields);
      // const [{ok:true,mensaje:'Guardado con exito'}]
      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    }
  }
  static async deleteOrden(id) {
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'DELETE FROM `tbl2_fases_prod_ordenes` WHERE `idx` = "' + id + '"'
      );
      // console.log(results);
      // console.log(fields);
      // const [{ok:true,mensaje:'Guardado con exito'}]
      return [{ ok: true, mensaje: 'Registro Eliminado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    }
  }
}