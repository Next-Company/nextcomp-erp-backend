import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
import fs from "node:fs/promises"
import path from 'node:path';
import { Client } from "basic-ftp"

export class ProductosService{
  static async getProductosList(search){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      const [rows,fields] = await conn.execute(`
        select *
        from
        (
          select
              tp.idx AS id_producto_CAB,
              tp.codigo AS cod_producto,
              tp.tipo AS tipo,
              tp.det AS det,
              tp.nom AS producto,
              tr.nom AS rubro,
              tp.temporada AS temporada,
              tp.estilo AS estilo,
              round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
              tp.presentacion AS presentacion,
              tp.marca AS marca,
              tp.modelo AS modelo,
              tc.idx AS idx_color,
              upper(tc.nom) AS color,
              tt.idx AS idx_talla,
              upper(tt.detalle) AS talla,
              tcn.condicion AS condicion,
              ts.idx AS idxsub,
              ts.sku AS sku2,
              COALESCE((select SUM(COALESCE(tad.cantidad,0)) from tbl2_almacen_det tad where tad.id_cabprod = tp.idx and tad.idx_subproducto = ts.idx),0) as stock
          from
              (((((BD_FACTURADOR.tbl2_productos tp
          left join BD_FACTURADOR.tbl2_subproductos ts on
              ((tp.idx = ts.idx_CAB_PROD)))
          join BD_FACTURADOR.tbl2_colores tc on
              ((tc.idx = ts.idx_CAB_COLOR)))
          join BD_FACTURADOR.tbl2_rubros tr on
              ((tp.RUBROS = tr.idx)))
          join BD_FACTURADOR.tbl2_tallas tt on
              ((tt.idx = ts.idx_talla)))
          join BD_FACTURADOR.tbl2_condicion tcn on
              ((tcn.condicion = ts.estado)))
          where
              (tp.ruc_ = '20522094120') -- and tp.tipo in ('I','A')
        ) as cc
        where 1=1 ${extra} 
        limit 100
      `);
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
    // return info;
  }
  static async getRecetasList(busqueda){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {

      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(COALESCE(nom,'')),' ',TRIM(COALESCE(tipo,'')),' ',TRIM(COALESCE(estilo,'')),' ',TRIM(COALESCE(temporada,'')),' ',TRIM(COALESCE(presentacion,'')),' ',TRIM(COALESCE(marca,'')),' ',TRIM(COALESCE(modelo,'')))) > 0").join(" ") : ""

      const [rows,fields] = await conn.execute(`
        select
            tp.idx AS id_producto_CAB,
            tp.codigo AS cod_producto,
            tp.tipo,
            tp.det,
            tp.nom AS producto,
            (select tr.nom from tbl2_rubros tr where tr.idx = tp.RUBROS  ) AS rubro,
            tp.temporada,
            tp.estilo,
            tp.base,
            round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
            tp.presentacion,
            tp.marca,
            tp.modelo,
            tp.tipoFabricacion,
            tp.tipoProduccion
        from tbl2_productos tp
        where 1=1 ${extra} and tp.ruc_ = '20522094120'
        limit 150
      `);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
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
      // const [rows,fields] = await conn.execute(`SELECT * FROM  tbl2_prod_color_talla_det where tipo in ('I','A') ${extra} LIMIT 50`);
      const [rows,fields] = await conn.execute(`
        select
          cc.*
        from
        (
        select
            tp.idx AS id_producto_CAB,
            tp.codigo AS cod_producto,
            tp.tipo AS tipo,
            tp.det AS det,
            tp.nom AS producto,
            tr.nom AS rubro,
            tp.temporada AS temporada,
            tp.estilo AS estilo,
            round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
            tp.presentacion AS presentacion,
            tp.marca AS marca,
            tp.modelo AS modelo,
            '' AS idx_color,
            '' AS color,
            '' AS idx_talla,
            '' AS talla,
            '' AS condicion,
            '' AS idxsub,
            '' AS sku2,
            COALESCE((select SUM(COALESCE(tad.cantidad,0)) from tbl2_almacen_det tad where tad.id_cabprod = tp.idx and tad.idx_subproducto = ts.idx),0) as stock
        from tbl2_productos tp
        join tbl2_rubros tr on tr.idx = tp.rubros
        left join tbl2_subproductos ts on tp.idx = ts.idx_CAB_PROD 
        where tp.ruc_ = '20522094120' and tp.tipo = 'I' and ts.idx is null

        union all

        select
            tp.idx AS id_producto_CAB,
            tp.codigo AS cod_producto,
            tp.tipo AS tipo,
            tp.det AS det,
            tp.nom AS producto,
            tr.nom AS rubro,
            tp.temporada AS temporada,
            tp.estilo AS estilo,
            round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
            tp.presentacion AS presentacion,
            tp.marca AS marca,
            tp.modelo AS modelo,
            tc.idx AS idx_color,
            upper(tc.nom) AS color,
            tt.idx AS idx_talla,
            upper(tt.detalle) AS talla,
            tcn.condicion AS condicion,
            ts.idx AS idxsub,
            ts.sku AS sku2,
            COALESCE((select SUM(COALESCE(tad.cantidad,0)) from tbl2_almacen_det tad where tad.id_cabprod = tp.idx and tad.idx_subproducto = ts.idx),0) as stock
        from
            (((((BD_FACTURADOR.tbl2_productos tp
        join BD_FACTURADOR.tbl2_subproductos ts on
            ((tp.idx = ts.idx_CAB_PROD)))
        join BD_FACTURADOR.tbl2_colores tc on
            ((tc.idx = ts.idx_CAB_COLOR)))
        join BD_FACTURADOR.tbl2_rubros tr on
            ((tp.RUBROS = tr.idx)))
        join BD_FACTURADOR.tbl2_tallas tt on
            ((tt.idx = ts.idx_talla)))
        join BD_FACTURADOR.tbl2_condicion tcn on
            ((tcn.condicion = ts.estado)))
        where
            tp.ruc_ = '20522094120' and tp.tipo in ('I','A')
        ) as cc
        where 1=1 ${extra}
      `);
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
  static async searchProductoById(id){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      // const [rows,fields] = await conn.execute("SELECT * FROM tbl2_prod_color_talla_det where tipo in ('I','A') LIMIT 50");
      const [result] = await conn.execute(`
        SELECT 
          tp.*,
          (select tr.nom from tbl2_rubros tr where tr.idx = tp.RUBROS) as rubro,
          (select tpv.nom from tbl2_proveedor tpv where tpv.idx = tp.PROVEEDORES) as proveedor
        FROM tbl2_productos tp
        WHERE tp.ruc_ = '20522094120' AND tp.idx = ?
      `,[id])

      const [combos] = await conn.execute(`select  
        idx_CAB_COLOR as idcolor,
        (select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR) as color,
        JSON_ARRAYAGG(talla) as tallas
      from tbl2_subproductos ts where ts.idx_CAB_PROD = ?
      group by ts.idx_CAB_COLOR`,[id])
      result[1] = combos

      return result;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  }
  static async generateProducto(info,imagenes){
    console.log("Dentro de la generacion de avios e insumoss")
    let conn = undefined
    let imageslist = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()
      let result = []

      console.log("Aqui empieza la generacion de productos",info)

      const [validacion,fields] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120' and lower(nom) = ?",[info.nom.toLowerCase()])
      if(validacion.length > 0){
        throw new Error('Se ha detectado un producto existente con el mismo nombre, por favor verifique.')
      }

      let newinfo = Object.keys(info).reduce((c,v)=>{
        if (fields.map(row=>row.name).includes(v) && v !== 'idx') c[v] = info[v]
        return c
      },{})                                                                                                                                                                      
      result = await ProductosService.createNewProduct(newinfo,conn)
      if(!result.ok) throw new Error(result.message)
      let [info_prod] = await conn.execute("select *from tbl2_productos where ruc_ = ? and idx = ?",['20522094120',result.info])

      if(info.combos){
        console.log("La informacion del combo es:",JSON.parse(info.combos))
        for(let combo of [...JSON.parse(info.combos)]){
          for(let talla of [...JSON.parse(combo.talla)]){    
            let [info_talla] = await conn.execute("select *from tbl2_tallas where detalle = ?",[talla])
            let result = await ProductosService.createNewSubProduct(
              {
                idx_CAB_PROD: info_prod[0].idx,
                codigo: info_prod[0].codigo,
                isbn: info_prod[0].isbn,
                nom: info_prod[0].nom,
                idx_CAB_COLOR: combo.idcolor,
                idx_talla: info_talla[0].idx,
                talla: info_talla[0].detalle,
                estado: 'primera',
                nro_lote: 0
              },
              conn
            )
            if(!result.ok) throw new Error(result.message)
          }
        }
      }
      // CARGANDO IMAGENES
      if (imagenes.length > 0){
        const resultado = await ProductosService.uploadImagesProduct(imagenes,info.imageslist ? JSON.parse(info.imageslist) : [],result.info)
        if(!resultado.ok) throw new Error("Error subiendo las imagenes")
        imageslist = JSON.stringify(resultado.newimageslist)
      } else {
        imageslist = info.imageslist ?? null
      }
      imageslist && await conn.execute("UPDATE tbl2_productos SET imageslist = ? WHERE idx = ? and ruc_ = ?",[imageslist,info.idx,'20522094120'])

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'',info:''}
    } catch(error){
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async updateProducto(info,imagenes){
    console.log("Dentro de la actualizacion de productos",info)
    let conn = undefined
    let imageslist = null
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()


      const [validacion,fields] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120' and idx = ?",[info.idx])
      let newinfo = Object.keys(info).reduce((c,v)=>{
        if (fields.map(row=>row.name).includes(v) && v !== 'idx') c[v] = info[v]
        return c
      },{})
      Reflect.deleteProperty(newinfo,'imageslist')
      console.log("La nueva info esS:",newinfo)

      let cake = Object.keys(newinfo).map(field=>`${field}='${newinfo[field]}'`)
      console.log("El query resultado es:",cake,`UPDATE tbl2_productos SET ${cake.toString(',')} WHERE idx = ?`)

      let [result] = await conn.execute(`UPDATE tbl2_productos SET ${cake.toString(',')} WHERE ruc_ = '20522094120' and idx = ?`,[info.idx])
      console.log("Row Afectada:",result.affectedRows)

      let [valida] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120' and idx = ?",[info.idx])
      console.log("La validacion despues de update es:",valida)

      let c_delete = [], c_add = []
      let [backcombos] = await conn.query("select *from tbl2_subproductos where idx_CAB_PROD = ?",[info.idx])
      c_delete = JSON.parse(JSON.stringify(backcombos))

      console.log("El arrau delete es :",c_delete)
      if(info.combos){
        for(let combo of [...JSON.parse(info.combos)]){
          for(let talla of [...JSON.parse(combo.talla)]){
            const busqueda = c_delete.filter(row=>row.idx_CAB_COLOR == parseInt(combo.idcolor) && row.talla == talla)
            console.log("El resultado de la busqueda es:",busqueda)
            if(busqueda.length > 0){
              c_delete = c_delete.filter(row=>row.idx !== busqueda[0].idx)
              console.log("Tomate:",c_delete)
            }else{
              c_add.push({idcolor:combo.idcolor,talla:talla})
              console.log("Mango:",c_add)
            }
          }
        }
        console.log("Los arrays son",c_delete,c_add)
        for(let c of [...c_add]){
          const [info_talla] = await conn.execute("select *from tbl2_tallas where detalle = ?",[c.talla])
          let result = await ProductosService.createNewSubProduct(
            {
              idx_CAB_PROD: info.idx,
              codigo: validacion[0].codigo,
              isbn: validacion[0].isbn,
              nom: info.nom,
              idx_CAB_COLOR: c.idcolor,
              idx_talla: info_talla[0].idx,
              talla: info_talla[0].detalle,
              estado: 'primera',
              nro_lote: 0
            },
            conn
          )
          if(!result.ok) throw new Error(result.message)
        }
        for(let c of [...c_delete]){
          await conn.execute("delete from tbl2_subproductos where idx_CAB_PROD = ? and idx = ?",[c.idx_CAB_PROD,c.idx])
        }
      }

      // CARGANDO IMAGENES
      if (imagenes.length > 0){
        const resultado = await ProductosService.uploadImagesProduct(imagenes,info.imageslist ? JSON.parse(info.imageslist) : [],result.info)
        if(!resultado.ok) throw new Error("Error subiendo las imagenes")
        imageslist = JSON.stringify(resultado.newimageslist)
      } else {
        imageslist = info.imageslist ?? null
      }
      imageslist && await conn.execute("UPDATE tbl2_productos SET imageslist = ? WHERE idx = ? and ruc_ = ?",[imageslist,info.idx,'20522094120'])

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'',info:''}
    } catch(error){
      console.log("Error detectado:",error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async uploadImagesProduct(images,imageslist,idx){
    const client = new Client()
    client.ftp.verbose = false
    try {
      await client.access({
        host: "jsjfact.com",
        user: "ftpnuevo",
        password: "JSJPeru2024++",
      })
      for(let image of [...images]){
        let newname = null
        newname = `20522094120_${idx}_${Date.now()}.jpg`
        const oldPath = image.path;
        const newPath = path.join('public/images', newname);
        await fs.rename(oldPath, newPath)
        await client.uploadFrom(newPath, "/facturador/imagenez/" + newname)
        await fs.unlink(newPath)
        imageslist.push(newname)
      }
      return {ok:true,newimageslist:imageslist} 
    } catch (error) {
      return {ok:false,message:error}
    } finally {
      client.close()
    }
  }
  static async createNewProduct(info,conn){
    try {
      const [correlativo] = await conn.execute("select codigo_num from tbl2_rubro_correlativo where ruc_ = ?",['20522094120']);
      let indice_prod = correlativo[0].codigo_num + 1;
      let sucursal = 509;
      let insert = {}

      insert['codigo'] = '09000' + indice_prod + '0';
      insert['isbn'] = '09000' + indice_prod + '0';
      insert['nom'] = info.producto;
      insert['ruc_']= '20522094120';
      insert['costo']= 0;
      insert['utilidad1']= 0;
      insert['moneda']= '';
      insert['codUnidadMedida']= 'NIU';
      insert['tipAfeIGV']= '10';
      insert['igv']= 18;
      insert['serie'] = 'N';
      insert['isc'] = 0;
      insert['vencimiento'] = 'N';
      insert['cant_inicial'] = 100;
      insert['sucursal_tienda'] = sucursal;

      insert = {...insert,...info}

      let campos = Object.keys(insert)
      // let campos = Object.keys(insert).reduce((carry, current) => {
      //   fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
      //   return carry
      // }, [])
      let values = campos.map(row => insert[row])
      console.log("Los valores a insertar son los siguientes:",values)
      let [result] = await conn.execute("insert into tbl2_productos(" + campos.join(',') + ") values("+ campos.map(row=>'?').join(',') +")",values)

      return {ok:true,message:'',info:result.insertId}
    }
    catch(error){
      return {ok:false,message:error.message ?? error}
    }
  }
  static async createNewSubProduct(info,conn){
    console.log("La informacion recibida para crear un subproducto es la siguiente:",info)
    let resultid = null
    try {
      let [validation,fields] = await conn.query("SELECT *FROM tbl2_subproductos WHERE idx_CAB_PROD = ? AND idx_CAB_COLOR = ? AND talla = ?",[info.idx_CAB_PROD,info.idx_CAB_COLOR,info.talla])
      if(validation.length > 0) throw new Error('Se ha detectado un producto existente con el mismo nombre')
      if (info.idx) {
        
      } else {
        let campos = Object.keys(info).reduce((carry, current) => {
          fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
          return carry
        }, [])
        let values = campos.map(row => info[row])
        let [result2] = await conn.execute("INSERT INTO tbl2_subproductos(" + campos.join(',') + ") values("+ campos.map(row=>'?').join(',') +")",values)
        resultid = result2.insertId
      }
      return {ok:true,message:'El subproducto fue creado con éxito.',resultid}
    } catch(error) {
      return {ok:false,message:error.message ?? error}
    }
  }
  static async createNewColor(info,conn){
    let idcolor = null
    try {
      if(info.idx){

      }else{
        let [busqueda] = await conn.query("SELECT *FROM tbl2_colores WHERE nom = ? AND ruc IN ('20522094120','20523875583') LIMIT 1",[info.nom])
        if(busqueda.length > 0){
          throw new Error('Esta intentando crear un color que ya exite')
        }
        let [newcolor] = await conn.query("INSERT INTO tbl2_colores(codigo,nom,ruc) VALUES(?,?,?)",[info.codigo,info.nom,info.ruc])
        idcolor = newcolor.insertId
      }
      return {ok:true,message:'La creacion del color se ejecutó con éxito.',idcolor};
    }
    catch(error){
      return {ok:false,message:error.message ?? error}
    }
  }
  static async getRubrosList(limit){
    console.log("Dentro del servicio de rubros con limite")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1]);
      await conn.connect();
      const [rows] = await conn.execute(`SELECT *FROM tbl2_rubros WHERE ruc_ = '20522094120' and origen = 'PROD' LIMIT ?`,[limit]);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      if(conn) await conn.end();
    }
  }
  static async searchRubro(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(COALESCE(nom,'')),' ',TRIM(COALESCE(det,'')))) > 0").join(" ") : ""

      const [results, fields] = await conn.query(`select *from tbl2_rubros where 1=1 ${extra} and ruc_ = '20522094120' and origen = 'PROD'`);
      // const [results, fields] = await conn.query('SELECT *FROM tbl2_rubros WHERE ruc_ = "20522094120" ' + (search !== '_' ? extra : '') + ' limit 50');
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getUnidadesList(limit){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1]);
      await conn.connect();
      const [rows] = await conn.execute(`SELECT *FROM tbl2_unidades LIMIT ?`,[limit]);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      if(conn) await conn.end();
    }
  }
  static async searchUnidad(search) {
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      let extra = search.split(" ").length > 0 ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(TRIM(codigo),' ',TRIM(descripcion))) > 0").join(" ") : ""
      
      const [results, fields] = await conn.query(`select *from tbl2_unidades where 1=1 ${extra}`);
      // const [results, fields] = await conn.query('SELECT *FROM tbl2_proveedor where ruc_ = "20522094120" ' + (search !== '_' ? extra : '') + ' limit 50');
      await conn.end();
      return results
    } catch (err) {
      console.log(err)
      return [err]
    } finally {
      if (conn) {
        await conn.end();
      }
    }
  }
  static async getProductosConStock_back(search){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      const [rows,fields] = await conn.execute(`
        select *
        from
        (
          select
              tp.idx AS id_producto_CAB,
              tp.codigo AS cod_producto,
              tp.tipo AS tipo,
              tp.det AS det,
              tp.nom AS producto,
              tr.nom AS rubro,
              tp.temporada AS temporada,
              tp.estilo AS estilo,
              round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
              tp.presentacion AS presentacion,
              tp.marca AS marca,
              tp.modelo AS modelo,
              tc.idx AS idx_color,
              upper(tc.nom) AS color,
              tt.idx AS idx_talla,
              upper(tt.detalle) AS talla,
              tcn.condicion AS condicion,
              ts.idx AS idxsub,
              ts.sku AS sku2
          from
              (((((BD_FACTURADOR.tbl2_productos tp
          left join BD_FACTURADOR.tbl2_subproductos ts on
              ((tp.idx = ts.idx_CAB_PROD)))
          join BD_FACTURADOR.tbl2_colores tc on
              ((tc.idx = ts.idx_CAB_COLOR)))
          join BD_FACTURADOR.tbl2_rubros tr on
              ((tp.RUBROS = tr.idx)))
          join BD_FACTURADOR.tbl2_tallas tt on
              ((tt.idx = ts.idx_talla)))
          join BD_FACTURADOR.tbl2_condicion tcn on
              ((tcn.condicion = ts.estado)))
          where
              (tp.ruc_ = '20522094120') -- and tp.tipo in ('I','A')
        ) as cc
        where 1=1 ${extra} 
        limit 100
      `);
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  }

  // INGRESO Y SALIDA DE MERCADERIA
  // ingreso/salida de productos nuevos sin lote ni stock
  // ingreso/salida de productos en almacen con lote con/sin stock
  // ------------------------------
  // NUEVO REQUERIMIENTO DE MERCADERIA
  // pedido de productos nuevos(s/n talla, s/c color, etc)
  // pedido de productos antiguos(talla,color,lote,stock)
  // ------------------------------
  // RETIRO DE MATERIALES POR ORDEN DE PRODUCCION
  // carga manual de productos por lote talla y color

  static async getProductosDetalle(){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()
      
      let [lista] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120'")
      let [consulta,fields1] = await conn.execute("select *from tbl2_productos where nom like '%?%' and marca  like '%?%'",[PRODUCT,'ELENEX'])

      consulta.reduce((c,v)=>{
        lista.nom == v.nom ? c.push({ok:false,nom:v.nom}) : c.push({ok:true,nom:v.nom})
        return c
      },[])

      const [rows,fields2] = await conn.execute(`
        select *
        from
        (
          select
              tp.idx AS id_producto_CAB,
              tp.codigo AS cod_producto,
              tp.tipo AS tipo,
              tp.det AS det,
              tp.nom AS producto,
              tr.nom AS rubro,
              tp.temporada AS temporada,
              tp.estilo AS estilo,
              round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
              tp.presentacion AS presentacion,
              tp.marca AS marca,
              tp.modelo AS modelo,
              tc.idx AS idx_color,
              upper(tc.nom) AS color,
              tt.idx AS idx_talla,
              upper(tt.detalle) AS talla,
              tcn.condicion AS condicion,
              ts.idx AS idxsub,
              ts.sku AS sku2
          from
              BD_FACTURADOR.tbl2_productos tp
          left join BD_FACTURADOR.tbl2_subproductos ts on
              tp.idx = ts.idx_CAB_PROD
          
          join BD_FACTURADOR.tbl2_colores tc on
              tc.idx = ts.idx_CAB_COLOR
          join BD_FACTURADOR.tbl2_rubros tr on
              tp.RUBROS = tr.idx
          join BD_FACTURADOR.tbl2_tallas tt on
              tt.idx = ts.idx_talla
          join BD_FACTURADOR.tbl2_condicion tcn on
              tcn.condicion = ts.estado
          where
              (tp.ruc_ = '20522094120') -- and tp.tipo in ('I','A')
        ) as cc
        where 1=1 ${extra} 
        limit 100
      `);


      conn.commit()
    } catch (error) {
      conn.rollback()
    }    
  }
  static async getProductosConStock(){

  }
  static async getProductosFull(){

  }

  static async getProductosConStock(search,filters = {}){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let newfilters = Object.keys(filters).length > 0 ? Object.keys(filters).map(key=>` and ${key}=${filters[key]}`) : ''
      console.log("Los filtro de busqueda son :",filters,newfilters)
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(modelo),''),' ',COALESCE(TRIM(marca),''),' ',COALESCE(TRIM(presentacion),''))) > 0").join(" ") : ""

      // tp.idx AS id_producto_CAB,
      // tp.codigo AS cod_producto,
      // tp.tipo AS tipo,
      // tp.det AS det,
      // tp.nom AS producto,
      // tr.nom AS rubro,
      // tp.temporada AS temporada,
      // tp.estilo AS estilo,
      // round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
      // tp.presentacion AS presentacion,
      // tp.marca AS marca,
      // tp.modelo AS modelo,
      // tc.idx AS idx_color,
      // upper(tc.nom) AS color,
      // tt.idx AS idx_talla,
      // upper(tt.detalle) AS talla,
      // tcn.condicion AS condicion,
      // ts.idx AS idxsub,
      // ts.sku AS sku2

      const [rows] = await conn.execute(`
        SELECT *
        FROM
        (
          SELECT
              tad.id_CAB_DET,
              tp.idx as idx_prod,
              ts.idx as idx_subprod,
              tp.codigo,
              tp.tipo,
              tp.codUnidadMedida as unidad,
              tp.nom as producto,
              ts.idx_CAB_COLOR,
              (select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR) as color,
              ts.idx_talla,
              (select tt.detalle from tbl2_tallas tt where tt.idx = ts.idx_talla) as talla,
              tad.lote,
              tad.cantidad as stock
            FROM tbl2_productos tp
            LEFT join tbl2_subproductos ts on tp.idx = ts.idx_CAB_PROD
            LEFT join tbl2_almacen_det tad on tad.idx_subproducto = ts.idx and tad.id_cabprod = ts.idx_CAB_PROD ${newfilters}
            WHERE tp.ruc_ = '20522094120' and tp.tipo in ('I','A') and ts.idx_CAB_COLOR is not null 
        ) AS cc
        WHERE 1=1 ${extra}
        LIMIT 100
      `);
      console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  }
  static async getProductosTotal(busqueda,filters){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {

      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(nom),' ',TRIM(COALESCE(tipo,'')),' ',TRIM(COALESCE(estilo,'')),' ',TRIM(COALESCE(temporada,'')),' ',TRIM(COALESCE(presentacion,'')),' ',TRIM(COALESCE(marca,'')),' ',TRIM(COALESCE(modelo,'')))) > 0").join(" ") : ""

      const filters_query = Object.keys(filters).length > 0 ? Object.keys(filters).map(f=>{
        if(Array.isArray(filters[f]) && filters[f].length > 0){
          return `AND ${f} IN (${filters[f].map(v=>`'${v}'`).join(',')})`
        } else if(typeof filters[f] === 'string' && filters[f].trim().length > 0){
          return `AND ${f} = '${filters[f]}'`
        } else {
          return ''
        }
      }).join(' ') : ''

      extra += ' ' + filters_query
      const query = `
        SELECT
            tp.idx AS id_producto_CAB,
            tp.codigo AS cod_producto,
            tp.costo,
            tp.codUnidadMedida,
            tp.tipo,
            tp.det,
            tp.nom AS producto,
            (select tr.nom from tbl2_rubros tr where tr.idx = tp.RUBROS  ) AS rubro,
            tp.temporada,
            tp.estilo,
            round((tp.costo + ((tp.utilidad1 * tp.costo) / 100)), 1) AS precio,
            tp.presentacion,
            tp.marca,
            tp.modelo,
            tp.tipoProduccion,
            tp.tipoFabricacion,
            tp.genero,
            tp.tipoPlan
        FROM tbl2_productos tp
        WHERE 1=1 ${extra} and tp.ruc_ = '20522094120' and tp.activo = 1
        LIMIT 150
      `
      console.log("La consulta de producto es la siguiente:",query)
      const [rows] = await conn.execute(query);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  } 
  static async getProductosEstilo(busqueda){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(t1.nom),' ',TRIM(t2.id_articulo_CAB))) > 0").join(" ") : ""

      console.log("Extra consulta estilo:",extra)
      const [rows,fields] = await conn.execute(`
        SELECT t1.*
        FROM tbl2_estilo t1
        join tbl2_articulo_estilo t2 on t1.idx = t2.id_estilo_CAB 
        WHERE 1=1 ${extra} and t1.ruc_ = '20522094120'
        group by t1.idx,t1.nom
        LIMIT 150
      `);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  } 
  static async getProductosBase(busqueda){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(t1.nom),' ',TRIM(t2.id_articulo_CAB))) > 0").join(" ") : ""

      console.log("Extra consulta base:",extra)
      const [rows,fields] = await conn.execute(`
        SELECT t1.idx,t1.nom
        FROM tbl2_base t1
        JOIN tbl2_articulo_base t2 on t1.idx = t2.id_base_CAB 
        WHERE 1=1 ${extra} and t1.ruc_ = '20522094120'
        GROUP BY t1.idx,t1.nom
        LIMIT 150
      `);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  } 
  static async getProductosMarca(busqueda){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(nom))) > 0").join(" ") : ""

      const [rows,fields] = await conn.execute(`
        SELECT t1.*
        FROM tbl2_marca t1
        WHERE 1=1 ${extra} and t1.ruc_ = '20522094120'
        LIMIT 150
      `);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  } 
  static async getProductosPresentacion(busqueda){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      let extra = busqueda.split(" ").length > 0 ? busqueda.split(" ").map(word=>"AND LOCATE('"+word+"',CONCAT(TRIM(nom))) > 0").join(" ") : ""

      const [rows,fields] = await conn.execute(`
        SELECT t1.*
        FROM tbl2_presentacion t1
        WHERE 1=1 ${extra} and t1.ruc_ = '20522094120'
        LIMIT 150
      `);
      // console.log(rows);
      return rows;
    }
    catch(e){
      console.log(e);
    }
    finally{
      await conn.end();
    }
  } 

}