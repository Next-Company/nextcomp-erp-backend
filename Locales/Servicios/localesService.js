import mysql2 from 'mysql2/promise'
import { configs } from '../../Main/utils.js'

export default class LocalesService{ 
  static async getTalleres(search =''){
    let conn = null
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      const EXTRA_TALLERES = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nombre_local,''),' ',COALESCE(direccion),' ',COALESCE(ruc_,'')))` : ''
      const EXTRA_TIENDAS = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nom,''),' ',COALESCE(dir)))` : ''

      const query_proveedor = `select LOWER(t1.nombre_local) as nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nombre_local,'direccion',t1.direccion,'latitud',t1.latitud,'longitud',t1.longitud)) as info from tbl2_proveedor_local t1 where 1=1 and t1.ruc_ = '20522094120' ${EXTRA_TALLERES} group by t1.nombre_local`
      console.log("EL query de bisqueda de proveedores es:",query_proveedor)
      let [base_proveedores] = await conn.query(query_proveedor)

      // let [base_tiendas] = await conn.query(`select nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.dir)) as info from tbl2_almacen t1 where 1=1 AND t1.ruc_ = '20522094120' ${EXTRA_TIENDAS} group by t1.nom`)

      // return base_proveedores.concat(base_tiendas)
      return base_proveedores
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getLocalDetail(search =''){
    let conn = null
    try {
      conn = await mysql2.createConnection(configs[1])
      await conn.connect()

      const EXTRA_TALLERES = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nombre_local,''),' ',COALESCE(direccion),' ',COALESCE(ruc_,'')))` : ''
      const EXTRA_TIENDAS = search !== '' ? `and LOCATE("${search}",CONCAT(COALESCE(nom,''),' ',COALESCE(dir)))` : ''

      const query_proveedor = `select LOWER(t1.nombre_local) as nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nombre_local,'direccion',t1.direccion,'latitud',t1.latitud,'longitud',t1.longitud)) as info from tbl2_proveedor_local t1 where 1=1 and t1.ruc_ = '20522094120' ${EXTRA_TALLERES} group by t1.nombre_local`
      console.log("EL query de bisqueda de proveedores es:",query_proveedor)
      let [base_proveedores] = await conn.query(query_proveedor)

      // let [base_tiendas] = await conn.query(`select nom,JSON_ARRAYAGG(JSON_OBJECT('nom',t1.nom,'direccion',t1.dir)) as info from tbl2_almacen t1 where 1=1 AND t1.ruc_ = '20522094120' ${EXTRA_TIENDAS} group by t1.nom`)

      // return base_proveedores.concat(base_tiendas)
      return base_proveedores
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
}