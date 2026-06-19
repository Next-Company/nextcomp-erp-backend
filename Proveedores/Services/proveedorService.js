import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
export default class ProveedorService{
  static async getListaProveedores(search = ''){
    //console.log("Dentro de la consulta lista de proveeores")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
  
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(nom),''),' ',COALESCE(TRIM(ruc),''),' ',COALESCE(TRIM(direccion),''),' ',COALESCE(TRIM(telefono),''),' ',COALESCE(TRIM(correo),''))) > 0").join(" ") : ""
  
      const [proveedores] = await conn.query(`SELECT * FROM tbl2_proveedor WHERE ruc_ = ? ${extra} LIMIT 80`,['20522094120']);

      return {ok:true,result:proveedores};      
    } catch (error) {
      return {ok:false,message:error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getProveedorById(id){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      const [result] = await conn.execute(`
        SELECT *
        FROM tbl2_proveedor
        WHERE ruc_ = '20522094120' AND idx = ?
      `,[id])

      const [locales] = await conn.query(`
        SELECT *FROM tbl2_proveedor t1
        JOIN tbl2_proveedor_local t2 ON t1.idx = t2.id_proveedor_CAB
        WHERE t1.ruc_ = '20522094120' AND t1.idx = ?
      `,[id])

      return {ok:true,result,locales}
    } catch(e) {
      //console.log(e);
    } finally {
      await conn.end();
    }
  }
  static async saveInfoProveedor(data) {
    //console.log("Dentro de guardado de proveedores")
    let conn
    //console.log("Info del formulario:", data)
    // const cabecera = JSON.parse(data.info)
    // //console.log('Detalle multiple:', cabecera)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.beginTransaction()

      const [validacion,fields] = await conn.query("select *from tbl2_proveedor where ruc_ = ? and (ruc = ? or nom = ?)",['20522094120',data.ruc.trim(),data.nom.trim()])
      if(validacion.length > 0) throw new Error('Proveedor duplicado. Por favor verifique los datos ingresados.')

      //console.log("La columnas de tabla son:",fields.map(row=>row.name))

      data['ruc_'] = '20522094120'
      const campos = Object.keys(data).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
        return carry
      }, [])
      const newinfo = campos.map(row => data[row])

      //console.log("La info formateada es:",campos,newinfo)
      await conn.execute('INSERT INTO tbl2_proveedor(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', newinfo)

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Los datos ingresados fueron registrados con éxito!!'}
    } catch (err) {
      //console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err.message ?? err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async updateInfoProveedor(id,data) {
    //console.log("Dentro de actualizado de proveedores")
    let conn
    //console.log("Info del formulario:", data)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.beginTransaction()

      const locales = data.locales ? JSON.parse(data.locales) : []
      const [valor,fields] = await conn.query("select *from tbl2_proveedor limit 1")
      const [baselocales,fieldslocales] = await conn.query("select *from tbl2_proveedor_local where id_proveedor_CAB = ?",[id])
      
      data['ruc_'] = '20522094120'
      const campos = Object.keys(data).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
        return carry
      }, [])
      const newinfo = campos.map(row => data[row])
      newinfo.push('20522094120')
      newinfo.push(parseInt(id))

      const query = `UPDATE tbl2_proveedor SET ${campos.map(row => row + "=NULLIF(?, '')").toString()} WHERE ruc_ = ? and idx = ?`
      const [result] = await conn.query(query,newinfo)

      //console.log("Los registro alterados fueron:",result.affectedRows)
      //console.log("Comenzamos con la actualización de locales")

      const addlocales = locales.filter(row => !baselocales.some(row2 => row2.idx == row.idx))
      const updatelocales = locales.filter(row => baselocales.some(row2 => row2.idx == row.idx))
      const dellocales = baselocales.filter(row => !locales.some(row2 => row2.idx == row.idx))

      for(const loc of addlocales) {
        const [resultadd] =await conn.execute('INSERT INTO tbl2_proveedor_local(ruc_, id_proveedor_CAB,  nombre_local, tipo_local, direccion, referencia, latitud, longitud) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [data.ruc_, id, loc.nombre_local, loc.tipo_local, loc.direccion, loc.referencia, loc.latitud, loc.longitud])
        //console.log("Resultado de inserción de local:",resultadd.affectedRows)
      }
      for(const loc of updatelocales) {
        const [resultupdate] = await conn.execute('UPDATE tbl2_proveedor_local SET nombre_local = ?, tipo_local = ?, direccion = ?, referencia = ?, latitud = ?, longitud = ? WHERE idx = ? AND id_proveedor_CAB = ?', [loc.nombre_local, loc.tipo_local, loc.direccion, loc.referencia, loc.latitud, loc.longitud, loc.idx, id])
        //console.log("Resultado de actualización de local:",resultupdate.affectedRows)
      }
      for(const loc of dellocales) {
        const [resultdelete] = await conn.execute('DELETE FROM tbl2_proveedor_local WHERE idx = ? AND id_proveedor_CAB = ?', [loc.idx, id])
        //console.log("Resultado de eliminación de local:",resultdelete.affectedRows)
      }

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Los registros fueron actualizados con éxito.'}
    } catch (err) {
      //console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async deleteInfoProveedor(id) {
    //console.log("Dentro de eliminado de proveedores")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      await conn.beginTransaction()

      // await conn.execute('DELETE FROM tbl2_proveedor WHERE ruc_ = ? AND idx = ?', ['20522094120',id])

      if (conn) conn.rollback()
      // if (conn) conn.commit()
      return {ok:true,message:'Registro completo'}
    } catch (err) {
      //console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
}