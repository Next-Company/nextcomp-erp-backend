import mysql from 'mysql2/promise'
import { configs } from '../../Main/utils.js'
import { resolve } from 'node:path'
export default class CobrosServices{
  static async getLista(search){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      // let [result] = await conn.query(`
      //   select 
      //   tcc.DOCUMENTO,
      //   (select tc.nom from tbl2_cliente tc where tc.idx = tcc.CLIENTES ) as cliente,
      //   tcc.NUMERO,tcc.fec_ope ,tcc.tip_mon,tcc2.* from tbl2_CDP_cab tcc 
      //   join tbl2_CDP_ADI tca on tcc.idx = tca.idx_
      //   join tbl2_CDP_CREDITOS tcc2 on tcc2.CDP = tcc.idx 
      //   where tcc.ruc_ = '20522094120' and tcc.anexo = 390 and tca.condicion_pago = 'pe' and tcc.DOCUMENTO = 'FA'
      //   order by tcc.idx desc
      // `)

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tc.nro),''),' ',COALESCE(TRIM(tc.nom),''),' ',COALESCE(TRIM(tcc.numero),''))) > 0").join(" ") : ""

      console.log("F8iltro de busuda",extra,search)

      let [result] = await conn.query(`
        SELECT 
        tcc.idx,
        tcc.DOCUMENTO,
        tc.nom as cliente,
        tc.nro,
        tcc.NUMERO,DATE_FORMAT(tcc.fec_ope,'%d/%m/%Y') as fec_ope,tcc.tip_mon,tcc.vta_gra,tcc.sum_igv,tcc.tot_vta,
        (
          SELECT COALESCE(sum(t2.importe),0) FROM tbl2_conciliaciones t1
          JOIN tbl2_abonos t2 ON t1.id_abono_CAB = t2.idx
          WHERE t1.id_cuenta_CAB = tcc.idx
        ) as cancelado
        FROM tbl2_CDP_cab tcc 
        JOIN tbl2_CDP_ADI tca on tcc.idx = tca.idx_
        JOIN tbl2_cliente tc on tc.idx = tcc.CLIENTES and tc.ruc_ = tcc.ruc_
        WHERE tcc.ruc_ = '20522094120' and tcc.anexo = 390 and tca.condicion_pago = 'pe' and tcc.DOCUMENTO = 'FA' ${extra}
        ORDER BY tcc.idx DESC LIMIT 100
      `)

      return result
    } catch (error) {
      return error
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getListaById(id){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let [result] = await conn.query(`
        select 
        tcc.idx,
        tcc.DOCUMENTO,
        tc.nom as cliente,
        tc.nro,
        tcc.NUMERO,DATE_FORMAT(tcc.fec_ope,'%d/%m/%Y') as fec_ope,tcc.tip_mon,tcc.vta_gra,tcc.sum_igv,tcc.tot_vta
        from tbl2_CDP_cab tcc 
        join tbl2_CDP_ADI tca on tcc.idx = tca.idx_
        join tbl2_cliente tc on tc.idx = tcc.CLIENTES and tc.ruc_ = tcc.ruc_
        where tcc.ruc_ = '20522094120' and tcc.anexo = 390 and tca.condicion_pago = 'pe' and tcc.DOCUMENTO = 'FA' and tcc.idx = ?
        order by tcc.idx desc limit 100
      `,[id])
      return result
    } catch (error) {
      return error
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveCobro(data){
    let conn
    const results = {ok:true,message:'test'}
    const cabecera = JSON.parse(data.info)
    const articulos = JSON.parse(data.detalle)

    console.log("Informacion cabecera:",cabecera)
    console.log("Informacion detalle:",articulos)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()
      if(data.id){
        console.log("Actualizando cabecera")
        await conn.query('UPDATE tbl2_abonos SET entidad_bancaria=NULLIF(?, ""),id_cuenta_CAB=NULLIF(?, ""),cuenta_corriente=NULLIF(?, ""),id_proveedor=NULLIF(?, ""),num_operacion=NULLIF(?, ""),moneda=NULLIF(?, ""),fec_pago=NULLIF(?, ""),importe=NULLIF(?, ""),tipo_operacion=NULLIF(?, "") WHERE idx = ?',[cabecera.entidad_bancaria,cabecera.id_cuenta_CAB,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo_operacion,parseInt(data.id)])

      }else{     
        console.log("Insertando cabecera")   
        try{
          const [res,fields] = await conn.query('INSERT INTO tbl2_abonos(ruc_,entidad_bancaria,id_cuenta_CAB,cuenta_corriente,id_proveedor,num_operacion,moneda,fec_pago,importe,tipo_operacion) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',cabecera.entidad_bancaria,cabecera.id_cuenta_CAB,cabecera.cuenta_corriente,cabecera.id_proveedor_CAB,cabecera.num_operacion,cabecera.moneda,cabecera.fec_pago,cabecera.importe,cabecera.tipo_operacion])

          const [results] = await conn.query('INSERT INTO tbl2_conciliaciones(ruc_,id_cuenta_CAB,id_abono_CAB) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))',['20522094120',articulos[0].idx,res.insertId]);

          ///////////////////////////////////////////////
          //// GENERANDO MOVIMIENTOS DE CAJA POR EGRESO
          //////////////////////////////////////////////
          console.log("Generando movimiento de caja :",cabecera.id_cuenta_CAB,cabecera.fec_pago)
          let [infocaja] = await conn.query(`SELECT *FROM tbl2_caja tc JOIN tbl2_caja_movimientos_cab tcmc ON tc.idx = tcmc.id_caja_CAB WHERE tc.id_cuenta_corriente = ? AND tc.ruc_ = ? and tcmc.fec_operacion = ?`,[cabecera.id_cuenta_CAB,'20522094120',cabecera.fec_pago])
          if(infocaja.length > 0){

            let data_mov_caja = {
              id_cuenta_CAB:cabecera.id_cuenta_CAB,
              fec_pago:cabecera.fec_pago,
              usuario:18,
              sucursal:390,
              detalle_mov:'COBRO DE FACTURA PROVEEDOR',
              doc_cliente:'0000000000',
              nom_cliente:cabecera.entidad_bancaria,
              tipdoc_ref:'CP',
              serie:'000',
              numero:'00000',
              documento_ref:cabecera.num_operacion,
              vta_no_gra:cabecera.importe,
              vta_gra:'0',
              tot_igv:'0',
              no_gravado:'0',
              pago:cabecera.importe,
              idabono:res.insertId
            }
            console.log("Ejecutando registro de movimiento de caja")
            let result_mov_caja = await this.saveMovimientoCaja('INGR', data_mov_caja)
          }else{
            // throw Error("No se dectecto un movimiento de caja para la fecha seleccionada")
            throw 'No se dectecto un movimiento de caja para la fecha seleccionada'
          }
          //////////////////////////////////////////////
          //////////////////////////////////////////////

        }catch(err){
          console.log("error en la consulta",err)
        }
        
      }
      console.log("Terminando consultas")
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) conn.rollback()
      return {ok:false,message:err.message}
    } finally {
      if (conn) await conn.end();
    }
  }
  static async deleteCobro(idabono){
    let conn
    let resp
    try {
      console.log("Comienza la eliminacion del cobro")
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      await conn.query('DELETE FROM tbl2_abonos WHERE idx = ?',[idabono])
      await conn.query(`DELETE FROM tbl2_conciliaciones WHERE ruc_ = ? and id_abono_CAB = ?`,['20522094120',idabono])
      await this.deleteMovimientoCaja(idabono)

      if(conn) conn.commit()
      // if(conn) conn.rollback()
      return {ok:true,message:'Se ha eliminado el registro'}
    } catch (error) {
      resp = error
      if(conn) conn.rollback()
      return {ok:false,message:'Error en el eliminado del movimiento de caja'}
    } finally {
      if(conn) conn.end()
    }
  }
  static async saveMovimientoCaja(tipo,data){
    let conn
    console.log("Informacion movimiento de caja:",data)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()

      try {
        /////////////////////////////////////////////////////////////////////////////
        // Verificamos el estap de ultima caja anterior a la fechad preoceso
        // en caso de que este abierta se proede con su cirrere y la obtencion del saldo final
        ///////////////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion A del registro de movimiento de caja")

        let monto = 0;
        let movcaja_anterior = await conn.query(`SELECT *from tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja tc on tc.idx = tcmc.id_caja_CAB WHERE tc.ruc_ = '20522094120' AND tcmc.fec_operacion < ? AND tc.id_cuenta_corriente = ? ORDER BY tcmc.idx DESC LIMIT 1`,[data.fec_pago,parseInt(data.id_cuenta_CAB)])

        if (movcaja_anterior.length > 0) monto = parseFloat(movcaja_anterior[0].saldo_final);


        ///////////////////////////////////////////////////////////////////////////////
        // Verificamos si existe la caja para la fecha de ejecucion actual del abono
        // en caso de que no existiea se precede con su creacion
        ////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion B del registro de movimiento de caja")

        let idcajamov_cab = null
        let [info_caja] = await conn.query("SELECT *FROM tbl2_caja WHERE id_cuenta_corriente = ? LIMIT 1",[parseInt(data.id_cuenta_CAB)])
        let [busqueda_movcaja] = await conn.query(`SELECT tcmc.* FROM tbl2_caja_movimientos_cab tcmc JOIN tbl2_caja tc on tc.idx = tcmc.id_caja_CAB WHERE tc.ruc_ = '20522094120' AND tcmc.fec_operacion = ? AND tc.id_cuenta_corriente = ?`,[data.fec_pago,parseInt(data.id_cuenta_CAB)])

        console.log("El resultado de la busqueda de la caja es:",info_caja, busqueda_movcaja)
        
        if(!(busqueda_movcaja.length > 0)){
          console.log("Dentro de generacon caja movimiento cabecera 1")
          let [insertcaja] = await conn.query(`INSERT INTO tbl2_caja_movimientos_cab(id_caja_CAB,ruc_,fec_operacion,saldo_inicial,ingresos,egresos,saldo_final,referencia,usuario,sucursal) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))`,[info_caja[0].idx,'20522094120',data.fec_pago,monto,0,0,0,'MOV CAJA AL' + data.fec_pago,'NEXT',390])
          idcajamov_cab = insertcaja.insertId
        } else{
          console.log("Dentro de generacion caja movimiento cabecera 2",busqueda_movcaja[0])
          idcajamov_cab = busqueda_movcaja[0].idx
        }

        ////////////////////////////////////////////////////////////////
        // Se precede con el registro del movimietno de caja en realcion
        // al abono realizado
        ////////////////////////////////////////////////////////////////
        console.log("Empieza la seccion C del registro de movimiento de caja")

        let [info_detalle] = await conn.query("SELECT *FROM tbl2_caja_movimientos_det WHERE id_cajamov_CAB = " + idcajamov_cab)

        let ingresos = 0;
        let egresos = 0;
        let saldo_final = 0;
        info_detalle.forEach(row=>{
          if(row.monto > 0){
            ingresos += parseFloat(row.monto)
          }else{
            egresos += parseFloat(row.monto)
          }
        })
        if(tipo == 'EGRE'){
          egresos += parseFloat(data.pago)*-1
        } else{
          ingresos += parseFloat(data.pago)
        }
        saldo_final = ( busqueda_movcaja.length > 0 ? parseFloat(busqueda_movcaja[0].saldo_inicial) : 0 ) + ingresos + egresos

        await conn.query(`INSERT INTO tbl2_caja_movimientos_det(ruc_,id_cajamov_CAB,fec_operacion,monto,usuario,sucursal,detalle_mov,doc_cliente,nom_cliente,tipdoc_ref,serie,numero,documento_ref,vta_no_gra,vta_gra,tot_igv,no_gravado,id_abono_ref) VALUES(NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""),NULLIF(?, ""))`,['20522094120',idcajamov_cab,data.fec_pago,parseFloat(data.pago),data.usuario,data.sucursal,data.detalle_mov,data.doc_cliente,data.nom_cliente,data.tipdoc_ref,data.serie,data.numero,data.documento_ref,data.vta_no_gra,data.vta_gra,data.tot_igv,data.no_gravado,data.idabono])  

        console.log("El valor del saldo inicial es:",busqueda_movcaja[0].saldo_inicial)
        console.log("El valor de los ingresos es:",ingresos)
        console.log("El valor de los egresos es:",egresos)
        console.log("El valor del saldo final es:",saldo_final)
        console.log("Id del movimiento de caja:",idcajamov_cab)

        // await conn.query("UPDATE tbl2_caja_movimientos_cab SET ingresos = ?, egresos = ? WHERE ruc_ = ? and idx = ?",[ingresos,egresos,'20522094120',idcajamov_cab])
        await conn.query("UPDATE tbl2_caja_movimientos_cab SET ingresos = ?, egresos = ?, saldo_final = ? WHERE ruc_ = ? and idx = ?",[ingresos, egresos, saldo_final, '20522094120', idcajamov_cab])

      } catch (error) {
        console.log("Se produjo un error durane el registro del movimiento de caja",error)
      }

      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) conn.rollback()
      return {ok:false,message:'Se produjo el siguiente error :' + err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async deleteMovimientoCaja(idabono){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect(); 
      conn.beginTransaction()

      try{
        console.log("Iiniciando eliminacion mov de caja - cobro: ",idabono)
        let ingresos = 0, egresos = 0, saldo_inicial = 0
        let [info_movimiento] = await conn.query(`SELECT *FROM tbl2_caja_movimientos_det WHERE id_abono_ref = ?`,[idabono])

        await conn.query(`DELETE FROM tbl2_caja_movimientos_det WHERE id_abono_ref = ${idabono} and ruc_ = '20522094120'`)

        let [info_detalle] = await conn.query(`SELECT *FROM tbl2_caja_movimientos_det WHERE id_cajamov_CAB = ${info_movimiento[0].id_cajamov_CAB}`)
        let [info_cabecera] = await conn.query(`SELECT *FROM tbl2_caja_movimientos_cab WHERE idx = ${info_movimiento[0].id_cajamov_CAB}`)

        console.log("INfo consulta datos:",info_detalle, info_cabecera)

        saldo_inicial = parseFloat(info_cabecera[0].saldo_inicial)
        info_detalle.forEach(element => {
          if(element.monto > 0){
            ingresos += parseFloat(element.monto)
          }else{
            egresos += parseFloat(element.monto)
          }
        });
        console.log("Info daa asdfa:",saldo_inicial,ingresos,egresos)

        await conn.query("UPDATE tbl2_caja_movimientos_cab SET ingresos = ?, egresos = ?, saldo_final = ? WHERE ruc_ = ? and idx = ?",[ingresos,egresos,saldo_inicial + ingresos + egresos, '20522094120',info_movimiento[0].id_cajamov_CAB])

        // let [info_movimiento] = await conn.query(`SELECT *FROM tbl2_caja_movimientos_det WHERE id_abono_ref = ?`,[idabono])
        // await conn.query(`DELETE FROM tbl2_caja_movimientos_det WHERE id_abono_ref = ${idabono} and ruc_ = '20522094120'`)
        // await conn.query("UPDATE tbl2_caja_movimientos_cab SET egresos = egresos - ? WHERE ruc_ = ? and idx = ?",[info_movimiento[0].monto,'20522094120',info_movimiento[0].id_cajamov_CAB])
        // console.log("Infomacion del movuimiento de caja :",info_movimiento)

      }catch(err){
        console.log("error en la consulta",err)
      }
  
      // if (conn) conn.rollback()
      if (conn) conn.commit()
      return {ok:true,message:'Se ha guardado el registros'}
    } catch (err) {
      console.log("Error en la transaccion",err)
      if (conn) conn.rollback()
      return {ok:false,message:'Se produjo el siguiente error :' + err}
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getAbonos(search){
    let conn
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(tc.nro),''),' ',COALESCE(TRIM(tc.nom),''),' ',COALESCE(TRIM(tcc.numero),''))) > 0").join(" ") : ""

      const [result] = await conn.execute(`
        SELECT 
        ta.idx,
        (
          select sum(tb1.tot_vta) from tbl2_CDP_cab tb1 
          join tbl2_almacen ta on ta.idx = tb1.ANEXO
          where tc.id_cuenta_CAB = tb1.idx
        ) as facturas_importe,
        (
          select GROUP_CONCAT(tb1.DOCUMENTO,ta.serie,'-',tb1.NUMERO) from tbl2_CDP_cab tb1 
          join tbl2_almacen ta on ta.idx = tb1.ANEXO
          where tc.id_cuenta_CAB = tb1.idx
        ) as facturas,
        ta.entidad_bancaria,
        ta.tipo,
        ta.tipo_operacion,
        ta.num_operacion,
        ta.moneda,
        ta.importe,
        ta.fec_pago
        FROM tbl2_abonos ta 
        JOIN tbl2_conciliaciones tc on ta.idx = tc.id_abono_CAB 
        WHERE ta.tipo = 'OBLI' and ta.ruc_ = '20522094120' ${extra}
        LIMIT 100
      `)

      return result
    } catch (error) {
      return error
    } finally {
      if(conn) await conn.end()
    }
  }
}