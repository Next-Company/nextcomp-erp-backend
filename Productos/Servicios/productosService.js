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
  static async createNewProduct(info){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1]);
      await conn.connect();
      conn.beginTransaction()

      const [validacion,fields] = await conn.execute("select *from tbl2_productos where ruc_ = '20522094120' and lower(nom) like '%?%'",[info.producto.toLowerCase()])

      if(validacion.length > 0){
        throw 'Se ha detectado un producto existente con el mismo nombre'
      }

      const [correlativo] = await conn.execute("select codigo_num from tbl2_rubro_correlativo where ruc_ = ?",['20522094120']);
      let indice_prod = correlativo[0].codigo_num + 1;
      let sucursal = 509;
      let insert = {}

      insert['codigo'] = '09000' + indice_prod + '0';
      insert['isbn'] = '09000' + indice_prod + '0';
      insert['nom'] = info.producto;
      insert['ruc_']= '20522094120';
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
      let [result] = await conn.execute("insert into tbl2_productos values ?",values)

      // $adicionales = json_decode($_POST['adicionales'],true);
      // foreach ($adicionales as $key => $adi) {
      //     $add = [
      //         'idx_CAB_PROD' => intval($res['idx_CAB_PROD']),
      //         'codigo' => $new_value['codigo'],
      //         'isbn' => $new_value['isbn'],
      //         'nom' => $new_value['nom'],
      //         'idx_CAB_COLOR' => $adi['idx_CAB_COLOR'],
      //         'idx_talla'=> $adi['idx_talla'],
      //         'talla' => $adi['talla'],
      //         'estado' => $adi['estado']
      //     ];
      //     $this->db->insert('tbl2_subproductos', $add);
      // }
      let respcolor = await this.createNewColor({codigo:'',nom:info.color,ruc:'20522094120'})
      await conn.execute("insert into tbl2_subproductos(idx_CAB_PROD,codigo,isbn,nom,idx_CAB_COLOR,idx_talla,talla,estado) values ?",[result.insertId,insert.codigo,insert.isbn,insert.nom,respcolor.idx,26,'S/T','primera'])
      
      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return rows;
    }
    catch(error){
      if(conn) conn.rollback()
      return {ok:false,message:error}
    }
    finally{
      await conn.end();
    }
  }
  static async createNewColor(info){
    let conn = undefined
    let idcolor = null
    try {
      conn = await mysql.createConnection(configs[1]);
      await conn.connect();
      conn.beginTransaction()

      if(info.idx){

      }else{
        let [busqueda] = await query("select *from tbl2_colores where nom like '%?%' and ruc = ?",[info.nom,info.ruc])
        if(busqueda.length > 0){
          idcolor = busqueda[0].idx
        }else{
          let [newcolor] = await conn.query("INSERT INTO tbl2_colores(codigo,nom,ruc) VALUES(?,?,?)",[info.codigo,info.nom,info.ruc])
          idcolor = newcolor.insertId
        }
      }
      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'La creacion del color se ejecutó con éxito.',idx:idcolor};
    }
    catch(error){
      if(conn) conn.rollback()
      return {ok:false,message:error,idx:idcolor}
    }
    finally{
      await conn.end();
    }
  }
}