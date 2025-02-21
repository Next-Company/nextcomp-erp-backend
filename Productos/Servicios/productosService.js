import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
export class ProductosService{
  static async getProductosList(){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      const [rows,fields] = await conn.execute("SELECT * FROM tbl2_productos where ruc_ = '20522094120' and tipo = 'I' LIMIT 50");
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