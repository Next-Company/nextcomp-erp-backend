import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
export class ProductosService{
  static async getProductosList(){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      const [rows,fields] = await conn.execute("SELECT * FROM tbl2_prod_color_talla_det where tipo in ('I','A') LIMIT 50");
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
    return info;
  }
  static async searchProducto(busqueda = ""){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      // SELECT *
      // FROM mi_tabla
      // WHERE LOCATE('pedro', CONCAT(TRIM(nombre_campo), ' ', TRIM(color_campo))) > 0
      //   AND LOCATE('rojo', CONCAT(TRIM(nombre_campo), ' ', TRIM(color_campo))) > 0;

      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(producto),' ',TRIM(color),' ',TRIM(talla))) > 0").join(" ") : ""

      console.log("Extra consultas :",extra)

      // const [rows,fields] = await conn.execute(`SELECT * FROM  tbl2_prod_color_talla_det where producto like '%${busqueda}%' and tipo in ('I','A') LIMIT 50`);
      const [rows,fields] = await conn.execute(`SELECT * FROM  tbl2_prod_color_talla_det where tipo in ('I','A') ${extra} LIMIT 50`);
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
    return info;
  }
  static async searchProductoById(){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      const [rows,fields] = await conn.execute("SELECT * FROM tbl2_prod_color_talla_det where tipo in ('I','A') LIMIT 50");
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
    return info;
  }
}