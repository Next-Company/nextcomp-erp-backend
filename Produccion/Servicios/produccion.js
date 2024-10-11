import { connection } from "../../Main/utils.js";
export class ProduccionModel {
  static async getOrdenes(user_data) {
    try {
      console.log("esta es otra consulta")
      const sql = "SELECT idx, oc, cliente, fec_emitida, if(isnull(fec_entrega),'',fec_entrega) as fec_entrega, marca, producto, base, precio, modelos, combo1_orden, combo2_orden, combo3_orden, combo4_orden, combo5_orden, combo6_orden, combo7_orden, combo8_orden, combo9_orden, combo10_orden, combo11_orden, combo12_orden, combo13_orden, combo14_orden, orden_pedido, fec_pedido, proveedor, tela, articulo, guia_ingreso, estado_telas, responsable, molde, muestra, lavado, cliente_corte, tizado, estado_molde, numero_corte, combo1_corte, combo2_corte, combo3_corte, combo4_corte, combo5_corte, combo6_corte, combo7_corte, combo8_corte, combo9_corte, combo10_corte, combo11_corte, combo12_corte, combo13_corte, combo14_corte, estado_corte, responsable_confeccion, precio_confeccion, fec_salida_confeccion,guia_salida_confeccion, cantidad_salida_confeccion, fec_ingreso_confeccion, guia_ingreso_confeccion, cantidad_ingreso_confeccion, fec_termino_confeccion, fallas_confeccion, fallas_tela_confeccion, piezas_incomp_confeccion, auditoria_confeccion, estado_confeccion, responsable_hojalboton, precio_hojalboton, fec_salida_hojalboton, guia_salida_hojalboton, cantidad_salida_hojalboton, fec_ingreso_hojalboton, guia_ingreso_hojalboton, cantidad_ingreso_hojalboton, fec_termino_hojalboton, fallas_hojalboton, fallas_tela_hojalboton, piezas_incomp_hojalboton, auditoria_hojalboton, estado_hojalboton, responsable_estampado, precio_estampado, fec_salida_estampado, guia_salida_estampado, cantidad_salida_estampado, fec_ingreso_estampado, guia_ingreso_estampado, cantidad_ingreso_estampado, fec_termino_estampado, fallas_estampado, fallas_tela_estampado, piezas_incomp_estampado, auditoria_estampado, estado_estampado, responsable_lavanderia, precio_lavanderia, fec_salida_lavanderia, guia_salida_lavanderia, cantidad_salida_lavanderia, fec_ingreso_lavanderia, guia_ingreso_lavanderia,cantidad_ingreso_lavanderia, fec_termino_lavanderia, fallas_lavanderia, fallas_tela_lavanderia, piezas_incomp_lavanderia, auditoria_lavanderia, estado_lavanderia, responsable_bordado, precio_bordado, fec_salida_bordado, guia_salida_bordado, cantidad_salida_bordado, fec_ingreso_bordado, guia_ingreso_bordado, cantidad_ingreso_bordado, fec_termino_bordado, fallas_bordado, fallas_tela_bordado, piezas_incomp_bordado, auditoria_bordado, estado_bordado, responsable_acabados, precio_acabados, fec_salida_acabados, guia_salida_acabados, cantidad_salida_acabados, fec_ingreso_acabados, guia_ingreso_acabados, cantidad_ingreso_acabados, fec_termino_acabados, fallas_acabados, fallas_tela_acabados, piezas_incomp_acabados, auditoria_acabados, estado_acabados FROM `view_ProduccionOrdenes` order by idx desc";
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