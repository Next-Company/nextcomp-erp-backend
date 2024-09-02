import { connection } from "../../Main/utils.js";
export class SoporteModel {
  static async getAll(user_data) {
    console.log(user_data)
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'SELECT * FROM `tbl2_soportes_cab` ' + `${user_data.niv !== 1 ? 'WHERE usuario = ?' : 'WHERE usuario = ? or usuario <> ?'}` + ' order by created_at desc',[user_data.id,user_data.id]
      );
      // console.log(results);
      // console.log(fields);
      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async pushItems(info,user_data) {
    try {
      console.log(info)
      if (info.idx == '') {
        const [results, fields] = await connection.query(
          'INSERT INTO `tbl2_soportes_cab`(`usuario`,`asunto`,`descripcion`,`fec_programado`,`prioridad`) VALUES(?,?,?,?,?)', [user_data.id, info.asunto, info.descripcion, '2024-06-07', info.prioridad]
        );
      } else {
        const [results, fields] = await connection.query(
          'UPDATE `tbl2_soportes_cab` SET `asunto` = ?, `descripcion` = ?,`prioridad` = ?,`estado` = ?  WHERE idx = ?', [info.asunto, info.descripcion, info.prioridad, info.estado, info.idx]
        );
      }

      return [{ ok: true, mensaje: 'Guardado con exito' }]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
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
  static async deleteItems(id) {
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'DELETE FROM `tbl2_soportes_cab` WHERE `idx` = "' + id + '"'
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