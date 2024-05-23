import mysql from "mysql2/promise";

// Create the connection to database
const connection = await mysql.createConnection({
  host: '172.29.160.1',
  port: '3306',
  user: 'ubuntu',
  password: '',
  database: 'bd_facturador',
});

export class SoporteModel{
  static async getAll(){
    try {
      const [results, fields] = await connection.query(
        // 'SELECT * FROM `tbl2_almacen` WHERE `name` = "Page" AND `age` > 45'
        'SELECT * FROM `tbl2_almacen`'
      );
      console.log(results); // results contains rows returned by server
      console.log(fields); // fields contains extra meta data about results, if available
      return results
    } catch (err) {
      console.log(err);
    }
  }
}