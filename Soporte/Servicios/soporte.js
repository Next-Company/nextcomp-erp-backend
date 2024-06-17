import { connection } from "../../Main/utils.js";
export class SoporteModel{
  static async getAll(){
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'SELECT * FROM `tbl2_soportes_cab` order by created_at desc'
      );
      // console.log(results);
      // console.log(fields);
      return results
    } catch (err) {
      console.log(err);
    }
  }
  static async pushItems(info){
    try {
      const [results, fields] = await connection.query(
        'INSERT INTO `tbl2_soportes_cab`(`usuario`,`asunto`,`descripcion`,`fec_programado`,`prioridad`) VALUES(?,?,?,?,?)',['Juan',info.asunto,info.descripcion,'2024-06-07',info.prioridad]
      );
      return [{ok:true,mensaje:'Guardado con exito'}]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    }
  }
  static async updateItems(){
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
      return [{ok:true,mensaje:'Guardado con exito'}]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    }
  }
  static async deleteItems(id){
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'DELETE FROM `tbl2_soportes_cab` WHERE `idx` = "'+id+'"'
      );
      // console.log(results);
      // console.log(fields);
      // const [{ok:true,mensaje:'Guardado con exito'}]
      return [{ok:true,mensaje:'Registro Eliminado con exito'}]
    } catch (err) {
      // return [{ok:false,mensaje:'Guardado con exito'}]
      return [err]
    }
  }
}