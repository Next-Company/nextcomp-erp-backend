import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
export default class ProveedorService{
  static async getListaProveedores(search = ''){
    console.log("Dentro de la consulta lista de proveeores")
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
      return result;
    } catch(e) {
      console.log(e);
    } finally {
      await conn.end();
    }
  }
  static async saveInfoProveedor(data) {
    console.log("Dentro de guardado de proveedores")
    let conn
    console.log("Info del formulario:", data)
    // const cabecera = JSON.parse(data.info)
    // console.log('Detalle multiple:', cabecera)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      const [validacion,fields] = await conn.query("select *from tbl2_proveedor where ruc_ = ? and (ruc = ? or nom = ?)",['20522094120',data.ruc.trim(),data.nom.trim()])
      if(validacion.length > 0) throw new Error('Proveedor duplicado. Por favor verifique los datos ingresados.')

      const campos = Object.keys(datos).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(datos[current])
        return carry
      }, [])
      const newinfo = campos.map(row => data[row])

      // data = Object.keys(data).reduce((c,v)=>{
      //   if(fields.)
      //   return c
      // },[])

      const [result] = await conn.execute('INSERT INTO tbl2_proveedor(' + campos.toString() + ') VALUES (' + campos.map(row => "NULLIF(?, '')").toString() + ')', newinfo)

      // await conn.query('INSERT INTO tbl2_proveedor(ruc_,ruc,nom,direccion,telefono,correo,web,giro,det,cat) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))', ['20522094120',data.ruc,data.nom,data.direccion,data.telefono,data.correo,data.web,data.giro,data.det,data.cat])

      if (conn) conn.rollback()
      // if (conn) conn.commit()
      return {ok:true,message:'Los datos ingresados fueron registrados con éxito!!'}
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err.message ?? err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async updateInfoProveedor(id,data) {
    console.log("Dentro de actualizado de proveedores")
    let conn
    console.log("Info del formulario:", data)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      const [result] = await conn.query('UPDATE tbl2_proveedor SET ruc=NULLIF(?, ""),nom=NULLIF(?, ""),direccion=NULLIF(?, ""),telefono=NULLIF(?, ""),correo=NULLIF(?, ""),web=NULLIF(?, ""),giro=NULLIF(?, ""),det=NULLIF(?, ""),cat=NULLIF(?, "") WHERE ruc_ = ? and idx = ?', [data.ruc,data.nom,data.direccion,data.telefono,data.correo,data.web,data.giro,data.det,data.cat,'20522094120',parseInt(id)])
      console.log("Los registro alterados fueron:",result.affectedRows)

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Los registros fueron actualizados con éxito.'}
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async deleteInfoProveedor(id) {
    console.log("Dentro de eliminado de proveedores")
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();
      conn.beginTransaction()

      // await conn.execute('DELETE FROM tbl2_proveedor WHERE ruc_ = ? AND idx = ?', ['20522094120',id])

      if (conn) conn.rollback()
      // if (conn) conn.commit()
      return {ok:true,message:'Registro completo'}
    } catch (err) {
      console.log(err)
      if (conn) conn.rollback()
      return {ok:false,message:err}
    } finally {
      if (conn) await conn.end();
    }
  }
}