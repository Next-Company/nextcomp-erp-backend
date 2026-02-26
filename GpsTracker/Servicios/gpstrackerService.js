import mysql2 from 'mysql2/promise'
import { configs } from "../../Main/utils.js";

export default class GpsTrackerService{
  static async getInfo(search = ''){
    console.log("Dentro de la funcoin de busqueda!")
    let conn = null
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      const EXTRA_PROVEEDORES = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nom,''),' ',COALESCE(direccion),' ',COALESCE(ruc,'')))` : ''
      const EXTRA_TIENDAS = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nom,''),' ',COALESCE(dir)))` : ''

      const query_proveedor = `select LOWER(t1.nom) as nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.direccion)) as info from tbl2_proveedor t1 where 1=1 and t1.ruc_ = '20522094120' ${EXTRA_PROVEEDORES} group by t1.nom`
      console.log("EL query de bisqueda de proveedores es:",query_proveedor)
      let [base_proveedores] = await conn.query(query_proveedor)

      let [base_tiendas] = await conn.query(`select nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.dir)) as info from tbl2_almacen t1 where 1=1 AND t1.ruc_ = '20522094120' ${EXTRA_TIENDAS} group by t1.nom`)

      // let [base] = await conn.query(`
      //   select t1.nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.direccion)) as info from tbl2_proveedor t1 where 1=1 and t1.ruc_ = '20522094120' ${EXTRA_PROVEEDORES} group by t1.nom
      //   join
      //   select nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.dir)) as info from tbl2_almacen t1 where 1=1 AND t1.ruc_ = '20522094120' ${EXTRA_TIENDAS} group by t1.nom
      // `)

      // console.log("El resultado de la busqueda es:",base_proveedores,base_tiendas)
      // console.log("La union de resultado es:",base_proveedores.join(base_tiendas))

      return base_proveedores.concat(base_tiendas)

    } catch (error) {
      console.log("Error",error)
    } finally {
      if(conn) await conn.end()
    }

  }
}