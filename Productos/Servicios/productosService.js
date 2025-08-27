import mysql from "mysql2/promise";
import { configs } from "../../Main/utils.js";
import { isErrorLike } from "puppeteer-core";
export class ProductosService{
  static async getProductosList(){
    const conn = await mysql.createConnection(configs[1]);
    await conn.connect();
    try {
      // const [rows,fields] = await conn.execute("SELECT * FROM tbl2_prod_color_talla_det where tipo in ('I','A') LIMIT 50");
      const [rows,fields] = await conn.execute(`
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
            '' AS sku2
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
            ts.sku AS sku2
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
            (tp.ruc_ = '20522094120') and tp.tipo in ('I','A')
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
            '' AS sku2
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
            ts.sku AS sku2
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
  static async createNewProduct(info,conn){
    try {
      const [validacion,fields] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120' and lower(nom) = ?",[info.producto.toLowerCase()])

      if(validacion.length > 0){
        throw new Error('Se ha detectado un producto existente con el mismo nombre')
      }

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
      insert['serie'] = 'N';
      insert['isc'] = 0;
      insert['vencimiento'] = 'N';
      insert['cant_inicial'] = 100;
      insert['sucursal_tienda'] = sucursal;

      let campos = Object.keys(insert).reduce((carry, current) => {
        fields.filter(row => row.name !== 'idx').map(row => row.name).includes(current) && carry.push(current)
        return carry
      }, [])
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
      let [validation,fields] = await conn.query("SELECT *FROM tbl2_subproductos WHERE idx_CAB_PROD = ? AND idx_CAB_COLOR = ?",[info.idx_CAB_PROD,info.idx_CAB_COLOR])
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
}