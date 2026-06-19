import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
import { connectBidiOverCdp } from 'puppeteer-core/internal/bidi/BidiOverCdp.js'
export default class ServiciosServiceModel{
  static async getServicios(search = ""){
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      const extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tipo),''),' ',COALESCE(TRIM(orden_ref),''),' ',COALESCE(TRIM(proveedor),''),' ',COALESCE(TRIM(responsable),''),' ',COALESCE(TRIM(estado),''))) > 0").join(" ") : ""

      const query = `SELECT *,DATEDIFF(fec_retorno,fec_emision) as tiempo_produccion, DATEDIFF(fec_retorno,NOW()) as dias_pendientes FROM tbl2_ordenes_servicio_cab WHERE 1=1 ${extra} AND ruc_ = '20522094120' LIMIT 100`
      //console.log("La consulta de busqueda es la siguiente:",query)
      const [busqueda] = await conn.execute(query)

      return busqueda
    } catch (error) {
      //console.log(error)
      throw new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getServicioById(id = ""){
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      const query = `SELECT *FROM tbl2_ordenes_servicio_cab WHERE ruc_ = '20522094120' and idx = ?`
      const [busqueda] = await conn.execute(query,[id])

      const [adicionales] = await conn.execute('select *from tbl2_ordenes_servicio_costosextra where id_ordenservicio_CAB = ?',[id])

      return [busqueda[0],[],adicionales]
    } catch (error) {
      //console.log(error)
      throw new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveServicio(data){
    //console.log("Dentro del proceso de guardado de la orden del servicio")
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()

      //console.log("Info del formulario:", data)
      const results = { ok: true, message: 'test' }
      const cabecera = JSON.parse(data.info)
      const insumos = JSON.parse(data.insumos)
      const adicionales = JSON.parse(data.adicionales)

      //console.log("Info del fronted:",cabecera,adicionales)

      const [d1,fields1] = await conn.query('SELECT *FROM tbl2_ordenes_servicio_cab LIMIT 1')

      //console.log("Columnad de la table es:",fields1,fields1.map(row=>row.name))

      const info_sanitized1 = Object.keys(cabecera).reduce((c,v)=>{
        fields1.map(row=>row.name).includes(v) && (c[v] = cabecera[v])
        return c
      },{})
      info_sanitized1['ruc_'] = '20522094120'

      //console.log("La info a insertar es .",info_sanitized1)
      const [res] = await conn.query(`INSERT INTO tbl2_ordenes_servicio_cab(${Object.keys(info_sanitized1).join(',')}) VALUES(${Object.keys(info_sanitized1).map(row=>'NULLIF(?,"")').join(',')})`, Object.values(info_sanitized1))

      const [d2,fields2] = await conn.query('SELECT *FROM tbl2_ordenes_servicio_costosextra LIMIT 1')
      for(let adicional of [...adicionales]){
        adicional = Object.keys(adicional).reduce((c,v)=>{
          fields2.map(row=>row.name).includes(v) && (c[v] = adicional[v])
          return c
        },{})
        adicional['id_ordenservicio_CAB'] = res.insertId
        const [res2] = await conn.query(`INSERT INTO tbl2_ordenes_servicio_costosextra(${Object.keys(adicional).join(',')}) VALUES(${Object.keys(adicional).map(row=>'NULLIF(?,"")').join(',')})`, Object.values(adicional))
      }

      if(conn) conn.commit()
      // if(conn) conn.rollback()
      return results
    } catch (error) {
      if(conn) conn.rollback()
      //console.log("Mostrando error:",error)
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async updateServicio(id,data){
    //console.log("Dentro del proceso de actualizado")
    let conn = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      await conn.beginTransaction()

      const results = { ok: true, message: 'test' }
      let cabecera = JSON.parse(data.info)
      let insumos = JSON.parse(data.insumos)
      let adicionales = JSON.parse(data.adicionales)

      //console.log("Info del frontend:",cabecera,adicionales)

      const [d,fields] = await conn.execute("select *from tbl2_ordenes_servicio_cab limit 1")

      cabecera = Object.keys(cabecera).reduce((c,v)=>{
        fields.map(row=>row.name).includes(v) && (c[v] = cabecera[v])
        return c
      },{})
      //console.log("New cabecera:",cabecera)
      Reflect.deleteProperty(cabecera,'idx')
      await conn.execute(`UPDATE tbl2_ordenes_servicio_cab SET ${Object.keys(cabecera).map(valor=>valor+'=NULLIF(?,"")').join(',')} WHERE idx = ${id}`,Object.values(cabecera))

      const [res, fields2] = await conn.query("SELECT *FROM tbl2_ordenes_servicio_costosextra WHERE id_ordenservicio_CAB = ?",[id])
      const ids_delete = res.filter(row => !adicionales.map(fila => parseInt(fila.idx)).includes(parseInt(row.idx)))

      for(let fila of [...adicionales]){
        const id_ = fila.idx ?? null
        fila = Object.keys(fila).reduce((c,v)=>{
          fields2.map(row=>row.name).includes(v) && (c[v] = fila[v])
          return c
        },{})
        Reflect.deleteProperty(fila,'idx')
        Reflect.deleteProperty(fila,'created_at')
        Reflect.deleteProperty(fila,'updated_at')
        if (id_) {
          await conn.query(`UPDATE tbl2_ordenes_servicio_costosextra SET ${Object.keys(fila).map(valor=>valor+'=NULLIF(?,"")').join(',')}  WHERE idx = ${id_} and id_ordenservicio_CAB = ${id}`, Object.values(fila));
        } else {
          //console.log("Dentro de 2 insertado")
          fila['id_ordenservicio_CAB'] = id
          await conn.query(`INSERT INTO tbl2_ordenes_servicio_costosextra(${Object.keys(fila)}) VALUES(${Object.keys(fila).map(row=>'NULLIF(?,"")').join(',')})`, Object.values(fila));
        }
      }
      for(let fila of [...ids_delete]){
        await conn.query('DELETE FROM tbl2_ordenes_servicio_costosextra WHERE idx = ? and id_ordenservicio_CAB = ?', [parseInt(data.id_), parseInt(id)])
      }

      if(conn) conn.commit()
      // if(conn) conn.rollback()
      return results
    } catch (error) {
      //console.log(error)
      if(conn) conn.rollback()
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteServicio(id){
    let conn = null
    try {
      conn = await mysql.createConection(configs[1])
      await conn.connect()
      const extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      const [busqueda] = await conn.execute(`SELECT *FROM tbl2_ordenes_servicio_cab WHERE 1=1 ${extra} AND ruc_ = '20522094120' LIMIT 100`)

      return busqueda
    } catch (error) {
      return new Error(error)
    } finally {
      if(conn) await conn.end()
    }
  }
}