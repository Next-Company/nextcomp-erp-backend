import mysql from 'mysql2/promise';
import { configs } from '../../Main/utils.js';
import { ProductosService } from '../../Productos/Servicios/productosService.js';

export default class AlmacenModel{
  static async getListaAlmacenes(search){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(nom),''),' ',COALESCE(TRIM(dir),''))) > 0").join(" ") : ""
      const query = `
        SELECT *
        FROM tbl2_almacen
        WHERE ruc_ = '20522094120' AND tipo = 'C' ${extra}
        LIMIT 50
      `;
  
      const [result] = await conn.execute(query);
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  /**
   * [feat 2026-06-26] Lista COMPLETA de almacenes/tiendas de la empresa (todos los tipos).
   *
   * A diferencia de getListaAlmacenes() —que filtra tipo='C' y limita a 50 para alimentar
   * los selects de movimientos—, este método devuelve TODOS los registros de tbl2_almacen
   * del RUC de la empresa. Es la fuente de la pestaña "Almacenes" (lista paginada + filtros),
   * donde el filtrado y la paginación se resuelven en el cliente por ser pocas decenas de filas.
   *
   * Campos `tipo`: T=Tienda, A=Almacén, O=Local/Oficina, C=Almacén de proceso.
   * Operación de SOLO LECTURA.
   *
   * @returns {Promise<Array>} filas de tbl2_almacen (idx, tipo, serie, nom, dir, dis, tel, estado, ...)
   */
  static async getListaAlmacenesAll(){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      // Solo el RUC de la empresa (esquema multi-tenant; esta instancia es mono-empresa).
      const query = `
        SELECT idx, tipo, serie, nom, dir, urb, dis, pro, dep, tel, estado
        FROM tbl2_almacen
        WHERE ruc_ = '20522094120'
        ORDER BY tipo, nom
      `;

      const [result] = await conn.execute(query);
      return result
    } catch (error) {
      console.log(error)
      return []
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getMovimientosAlmacen(search){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(estado),''),' ',COALESCE(TRIM(Raz_social_DOC),''),' ',COALESCE(TRIM(Nro_Doc_Prov),''))) > 0").join(" ") : ""
  
      const query = `
        SELECT tkc.*, tp.idx as id_proveedor_CAB, tp.nom as proveedor, if(COALESCE(tkc.tipomov,0) = 0,'OTRO',if(COALESCE(tkc.tipomov,0) = 9,'INGR','RETR'))  as cod_comprobante,CASE WHEN Suc_Tienda = 509 THEN 'TELAS' ELSE 'AVIOS' END as almacen
        FROM tbl_kard_compras_CAB tkc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc and tp.ruc_ = '20522094120'
        WHERE Suc_Tienda in (509,508) ${extra}
        ORDER BY tkc.fecha_sys DESC
        LIMIT 50
      `;
      // console.log("La consulta generada es:",query)
  
      const [result] = await conn.execute(query);
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getMovimientosAlmacenById(id){
    // Suponiendo que tienes una conexión global o la recibes como parámetro
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      const [cabmov] = await conn.execute(`
        SELECT 
          tkc.*, 
          tp.idx as id_proveedor_CAB, 
          tp.nom as proveedor, 
          tmc.cod_comprobante, 
          tmc.anulado,
          COALESCE((select tbu.usu from tbl_user tbu where tbu.ruc = '20522094120' and tbu.idx = tkc.idx_usu),'') as usuario,
          COALESCE(tfpo.oc,'') as oc,
	        COALESCE(tfpo.modelos,'') as modelo,
	        COALESCE(tfpo.rubro,'') as articulo,
          DATE_FORMAT(tkc.fecha_sys,'%d/%m/%Y %h:%m:%s') as fecha_sistema,
          LPAD(CAST(tkc.id_CAB as SIGNED),8,'0') as id_despacho
        FROM tbl_kard_compras_CAB tkc 
        JOIN tbl2_almacen_mov_cab tmc ON tkc.id_CAB = tmc.idx_documento_asoc
        JOIN tbl2_proveedor tp ON tkc.Nro_Doc_Prov = tp.ruc
        LEFT JOIN tbl2_fases_prod_ordenes tfpo ON tfpo.idx = tkc.id_orden
        WHERE Suc_Tienda in (509,508) and tkc.id_CAB = ?
      `,[id]);

      const [inforeq] = await conn.execute(`
        SELECT tpic.orden_ref as nro_requerimiento,tpic.id_proveedor_CAB, tp.ruc as ruc, tp.nom as proveedor,
          -- [feat 2026-06-26] Campos del requerimiento (pedido) para la guía v2 doble de TELAS:
          --   fecha de pedido/entrega, producción, número de contacto y forma de pago.
          tpic.fec_emision, tpic.fec_retorno, tpic.produccion, tpic.nro_contacto, tpic.forma_pago
        FROM tbl2_pedidos_insumos_cab tpic
        JOIN tbl2_proveedor tp ON tpic.id_proveedor_CAB = tp.idx
        WHERE tpic.idx = ?
      `,[cabmov[0].id_requerimiento]);

      const [detmov] = await conn.execute(`
        select
          t1.*,
          ts.nom,
          COALESCE((select tp.codUnidadMedida from tbl2_productos tp where tp.idx = ts.idx_CAB_PROD),'') as unidad,
          COALESCE((select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR),'') as color,
          ts.talla,
          -- COALESCE((select COALESCE(tpoi.cantidad,0) from tbl2_fases_prod_ordenes_insumos tpoi where tpoi.id_orden_CAB = ? and tpoi.id_subprod_CAB = t1.id_subprod ),0) AS comprometido
          COALESCE((
            select sum(tboc.cantidad_combo) from tbl2_fases_prod_ordenes_combos tboc 
            where tboc.id_orden_CAB = ? and JSON_CONTAINS(tboc.insumos,CAST(ifnull(t1.id_subprod,-1) as CHAR))
          ),0)*tpoi.cantidad as comprometido
        from tbl_kard_compras_DET t1 
        join tbl2_subproductos ts on t1.id_subprod = ts.idx
        left join tbl2_fases_prod_ordenes_insumos tpoi on tpoi.id_orden_CAB = ? and tpoi.id_subprod_CAB = t1.id_subprod
        where t1.id_CAB_DET = ?
      `,[cabmov[0].id_orden,cabmov[0].id_orden,id])

      const [detbmov] = await conn.execute(`
        SELECT 
          tpid.*,
          (select COALESCE(tbkd.Cant_despacho_DET,0) from tbl_kard_compras_DET tbkd where tbkd.id_subprod = tpid.id_subprod_CAB and tbkd.id_CAB_DET = ?) as despacho
        from tbl2_pedidos_insumos_det tpid 
        where tpid.id_pedido_CAB = ?
        having despacho > 0
      `,[id,cabmov[0].id_requerimiento]);

      const [cuadre] = await conn.execute(`
        select 
          DATE_FORMAT(STR_TO_DATE(t1.fec_Emision_DOC,'%d/%m/%Y'),'%Y-%m-%d') as fec_emision,
          t1.Nro_Doc_Prov,
          t1.Raz_social_DOC,
          t1.tipomov,
          (select tfpo.modelos from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as modelos,
          (select tfpo.oc from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as oc,
          (select tbc.numero_corte from tbl2_fases_prod_hojacorte tbc where tbc.id_cab_orden = t1.id_modelo limit 1) as nro_corte,
          tpid.producto,
          tpid.color,
          tpid.rollos,
          tpid.cantidad,
          tpid.unidad,
          tpid.precio,
          tpic.orden_ref as nro_pedido_origen,
          t2.*
        FROM tbl_kard_compras_CAB t1
        join tbl2_pedidos_insumos_cab tpic on tpic.idx = t1.id_requerimiento
        join tbl_kard_compras_DET t2 on t1.id_CAB = t2.id_CAB_DET 
        join tbl2_pedidos_insumos_det tpid on tpid.id_pedido_CAB = tpic.idx and tpid.id_subprod_CAB = t2.id_subprod
        where t1.ruc = '20522094120' and t1.id_CAB = ? and t1.estado = 'EMITIDO'
      `,[id])
  
      console.log("El resultado de la consulta es:", cabmov, detbmov, cuadre)
      return [cabmov[0],inforeq[0], detmov, cuadre]
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getInventarioProductos(search){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let extra = (search && search.split(" ").length > 0) ? search.split(" ").map(word => "AND LOCATE('" + word + "',CONCAT(COALESCE(TRIM(producto),''),' ',COALESCE(TRIM(color),''),' ',COALESCE(TRIM(lote),''),' ',COALESCE(TRIM(tipo),''))) > 0").join(" ") : ""
  
      const query = `
        SELECT cc.*
        FROM
        (
          SELECT 
            t1.cantidad as stock,
            t2.codigo,
            t3.nom as color,
            t3.idx as idx_color,
            t2.idx_CAB_PROD as id_producto_CAB,
            t2.idx as id_subprod_CAB,
            t2.nom as producto,
            t1.lote,
            t2.idx_talla,
            (select tt.detalle from tbl2_tallas tt where tt.idx = t2.idx_talla) as talla,
            t2.estado,
            -- t1.tipo,
            (select tipo from tbl2_productos tp where tp.idx = t2.idx_CAB_PROD) as tipo,
            (select COALESCE(tp.codUnidadMedida,'') from tbl2_productos tp where tp.idx = t2.idx_CAB_PROD) as unidad
          FROM tbl2_almacen_det t1 
          join tbl2_subproductos t2 on t2.idx = t1.idx_subproducto
          join tbl2_colores t3 on t3.idx = t2.idx_CAB_COLOR 
          WHERE t1.id_CAB_DET in (509,508) 
        ) AS cc
        WHERE 1=1 ${extra}
        LIMIT 100
      `;
      console.log("El query de busque de producto es:",query)
  
      const [result] = await conn.execute(query);
      console.log("El resultado de la consulta es:", result)
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  /**
   * [feat 2026-07-02] Stock por variante desglosado por almacén (pestaña "Productos").
   *
   * Devuelve UNA fila por cada combinación (variante, almacén) con existencias, uniendo:
   *   tbl2_almacen_det (stock) → tbl2_subproductos (variante: producto+color+talla)
   *   → tbl2_colores (color) → tbl2_almacen (nombre/tipo del almacén).
   *
   * La "variante" (id_subprod_CAB) se repite tantas veces como almacenes tengan stock de
   * ella; el cliente agrupa por id_subprod_CAB para pintar la lista maestra y, al desplegar,
   * el desglose almacén→stock. El stock se agrega (SUM) sobre los lotes del mismo almacén.
   *
   * A diferencia de getInventarioProductos() —que fija id_CAB_DET IN (509,508)—, aquí se
   * incluyen TODOS los almacenes de la empresa (join a tbl2_almacen por RUC). Solo lectura.
   * El filtrado y la paginación se resuelven en el cliente (pocas decenas de miles de filas
   * como mucho), igual que en la pestaña "Almacenes".
   *
   * [fix 2026-07-03] La pestaña "Productos" es un listado de PRENDAS (productos terminados).
   *   Se intentó acotar a tprod.tipo='P' sobre tbl2_almacen_det (ver query v2 comentada abajo),
   *   pero se comprobó que EN PRODUCCIÓN tbl2_almacen_det solo contiene MATERIALES (insumos 'I'
   *   y avíos 'A'): las prendas NO están ahí, por lo que ese filtro devolvía []. "TELAS"(509)/
   *   "AVIOS"(508) son NOMBRES de almacén de proceso, no tipos de producto.
   *
   * [reenfoque 2026-07-03] FUENTE REAL del stock de prendas por almacén: los INVENTARIOS FÍSICOS
   *   de tienda (tbl2_inventario_cab.idx_alm + tbl2_inventario_det con tipo='P'), generados por
   *   otro sistema (aquí solo se LEEN). Regla de "stock actual" por almacén: la ÚLTIMA toma con
   *   modalidad='total' y estado='PROSC' (último recuento completo procesado; se ignoran
   *   borradores 'EMIT' y anuladas 'ANUL'). OJO: es stock "según último inventario", NO en tiempo
   *   real — cada tienda trae su propia `fecha_inventario` (algunas pueden ser antiguas), y las
   *   tiendas sin ninguna toma total+PROSC no aparecen. El cliente muestra la fecha para dar
   *   contexto. La cantidad física es `tid.cantidad`. Solo lectura.
   *
   * [feat 2026-07-03] Se agregan: `marca` y `precio` (venta = costo + utilidad1%) desde
   *   tbl2_productos, y `condicion` (primera/segunda) desde tbl2_inventario_det; el stock queda
   *   dividido por condición (una variante puede salir en 'primera' y en 'segunda').
   *
   * [feat 2026-07-06] Se agregan `fecha_ultimo_ingreso` y `cantidad_ultimo_ingreso`: la fecha y
   *   cantidad del ÚLTIMO ingreso de esa variante a ese almacén. "Ingreso" = movimiento de
   *   tbl2_almacen_mov_det que SUBE stock (saldo > stock), sin importar el comprobante: cubre
   *   INGR ("INGRESO DE PRODUCTOS") y la recepción de ENVI (mercadería enviada desde central, la
   *   vía principal de entrada a tienda) y TRNS; se descartan RETR (ventas) por ser saldo < stock.
   *   OJO: el stock viene del inventario físico (arriba) y esto de la bitácora de movimientos —son
   *   fuentes distintas—; por eso `fecha_ultimo_ingreso` suele ser ANTERIOR a `fecha_inventario`, y
   *   puede venir NULL si la variante no tiene ningún ingreso registrado en ese almacén. Solo lectura.
   *
   * @returns {Promise<Array>} filas { id_subprod_CAB, id_producto_CAB, producto, color, talla,
   *                                   tipo, unidad, marca, precio, condicion, id_almacen, almacen,
   *                                   almacen_tipo, stock, fecha_inventario, fecha_ultimo_ingreso,
   *                                   cantidad_ultimo_ingreso }
   */
  static async getStockPorAlmacen(){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      // [fix 2026-07-03] Query ORIGINAL (sin filtro de tipo — traía telas/avíos/insumos):
      // const query = `
      //   SELECT
      //     t2.idx            AS id_subprod_CAB,
      //     t2.idx_CAB_PROD   AS id_producto_CAB,
      //     t2.nom            AS producto,
      //     t3.nom            AS color,
      //     (SELECT tt.detalle FROM tbl2_tallas tt WHERE tt.idx = t2.idx_talla) AS talla,
      //     (SELECT tp.tipo FROM tbl2_productos tp WHERE tp.idx = t2.idx_CAB_PROD) AS tipo,
      //     (SELECT COALESCE(tp.codUnidadMedida,'') FROM tbl2_productos tp WHERE tp.idx = t2.idx_CAB_PROD) AS unidad,
      //     t1.id_CAB_DET     AS id_almacen,
      //     ta.nom            AS almacen,
      //     ta.tipo           AS almacen_tipo,
      //     SUM(t1.cantidad)  AS stock
      //   FROM tbl2_almacen_det t1
      //   JOIN tbl2_subproductos t2 ON t2.idx = t1.idx_subproducto
      //   JOIN tbl2_colores t3 ON t3.idx = t2.idx_CAB_COLOR
      //   JOIN tbl2_almacen ta ON ta.idx = t1.id_CAB_DET AND ta.ruc_ = '20522094120'
      //   WHERE t1.estado = 1
      //   GROUP BY t2.idx, t1.id_CAB_DET
      //   HAVING stock <> 0
      //   ORDER BY producto, color, talla, almacen
      // `;
      // [fix 2026-07-03] Query v2 (sobre tbl2_almacen_det acotada a prendas 'P') — DESCARTADA:
      //   devuelve [] en producción porque las prendas NO viven en tbl2_almacen_det (solo materiales).
      // const query = `
      //   SELECT
      //     t2.idx            AS id_subprod_CAB,
      //     t2.idx_CAB_PROD   AS id_producto_CAB,
      //     t2.nom            AS producto,
      //     t3.nom            AS color,
      //     (SELECT tt.detalle FROM tbl2_tallas tt WHERE tt.idx = t2.idx_talla) AS talla,
      //     tprod.tipo        AS tipo,
      //     COALESCE(tprod.codUnidadMedida,'') AS unidad,
      //     t1.id_CAB_DET     AS id_almacen,
      //     ta.nom            AS almacen,
      //     ta.tipo           AS almacen_tipo,
      //     SUM(t1.cantidad)  AS stock
      //   FROM tbl2_almacen_det t1
      //   JOIN tbl2_subproductos t2 ON t2.idx = t1.idx_subproducto
      //   JOIN tbl2_colores t3 ON t3.idx = t2.idx_CAB_COLOR
      //   JOIN tbl2_almacen ta ON ta.idx = t1.id_CAB_DET AND ta.ruc_ = '20522094120'
      //   JOIN tbl2_productos tprod ON tprod.idx = t2.idx_CAB_PROD AND tprod.tipo = 'P'
      //   WHERE t1.estado = 1
      //   GROUP BY t2.idx, t1.id_CAB_DET
      //   HAVING stock <> 0
      //   ORDER BY producto, color, talla, almacen
      // `;

      // [reenfoque 2026-07-03] Stock de prendas por almacén desde el INVENTARIO FÍSICO de tienda.
      //   Por cada almacén se toma su ÚLTIMO inventario modalidad='total' + estado='PROSC' y se
      //   agrega la cantidad física (tid.cantidad) por variante (idxsub). Devuelve fecha_inventario.
      //
      // [perf 2026-07-03] Versión PREVIA usaba un subquery correlacionado que elegía la última
      //   sesión POR CADA fila de detalle (lento sobre decenas de miles de filas). Ahora la última
      //   sesión total+PROSC de cada almacén se calcula UNA sola vez en la derivada `ult` (una fila
      //   por almacén) y se une; y `unidad` sale de un JOIN a tbl2_productos en vez de subquery.
      //   Versión previa (correlacionada), conservada por referencia:
      // const query = `
      //   SELECT * FROM (
      //     SELECT MAX(tid.id_producto_CAB) AS id_producto_CAB, tid.idxsub AS id_subprod_CAB,
      //            MAX(tid.producto) AS producto, MAX(tid.color) AS color, MAX(tid.talla) AS talla,
      //            'P' AS tipo,
      //            MAX((SELECT tp.codUnidadMedida FROM tbl2_productos tp WHERE tp.idx = tid.id_producto_CAB)) AS unidad,
      //            tic.idx_alm AS id_almacen, MAX(ta.nom) AS almacen, MAX(ta.tipo) AS almacen_tipo,
      //            SUM(tid.cantidad) AS stock, MAX(tic.created_at) AS fecha_inventario
      //     FROM tbl2_inventario_cab tic
      //     JOIN tbl2_inventario_det tid ON tid.id_inventario_CAB = tic.idx AND tid.tipo = 'P'
      //     LEFT JOIN tbl2_almacen ta ON ta.idx = tic.idx_alm
      //     WHERE tic.ruc_ = '20522094120' AND tic.modalidad = 'total' AND tic.estado = 'PROSC'
      //       AND tic.idx = (SELECT c2.idx FROM tbl2_inventario_cab c2
      //                      WHERE c2.idx_alm = tic.idx_alm AND c2.ruc_ = '20522094120'
      //                        AND c2.modalidad = 'total' AND c2.estado = 'PROSC'
      //                      ORDER BY c2.created_at DESC, c2.idx DESC LIMIT 1)
      //     GROUP BY tic.idx_alm, tid.idxsub HAVING stock <> 0
      //   ) x ORDER BY producto, color, talla, almacen`;
      const query = `
        SELECT * FROM (
          SELECT
            MAX(tid.id_producto_CAB) AS id_producto_CAB,
            tid.idxsub               AS id_subprod_CAB,
            MAX(tid.producto)        AS producto,
            MAX(tid.color)           AS color,
            MAX(tid.talla)           AS talla,
            'P'                      AS tipo,
            MAX(tp.codUnidadMedida)  AS unidad,
            -- [feat 2026-07-03] marca y precio de venta (= costo + utilidad1%) de tbl2_productos.
            MAX(tp.marca)            AS marca,
            MAX(ROUND(tp.costo + (tp.utilidad1 * tp.costo / 100), 1)) AS precio,
            -- [feat 2026-07-03] condición (primera/segunda) para dividir el stock.
            tid.condicion            AS condicion,
            tic.idx_alm              AS id_almacen,
            MAX(ta.nom)              AS almacen,
            MAX(ta.tipo)             AS almacen_tipo,
            SUM(tid.cantidad)        AS stock,
            MAX(tic.created_at)      AS fecha_inventario
          FROM (
            -- última sesión total+PROSC por almacén (una fila por idx_alm)
            SELECT c.idx_alm, MAX(c.idx) AS sesion
            FROM tbl2_inventario_cab c
            JOIN (
              SELECT idx_alm, MAX(created_at) AS mx
              FROM tbl2_inventario_cab
              WHERE ruc_ = '20522094120' AND modalidad = 'total' AND estado = 'PROSC'
              GROUP BY idx_alm
            ) m ON m.idx_alm = c.idx_alm AND m.mx = c.created_at
            WHERE c.ruc_ = '20522094120' AND c.modalidad = 'total' AND c.estado = 'PROSC'
            GROUP BY c.idx_alm
          ) ult
          JOIN tbl2_inventario_cab tic ON tic.idx = ult.sesion
          JOIN tbl2_inventario_det tid ON tid.id_inventario_CAB = tic.idx AND tid.tipo = 'P'
          LEFT JOIN tbl2_almacen   ta  ON ta.idx = tic.idx_alm
          LEFT JOIN tbl2_productos tp  ON tp.idx = tid.id_producto_CAB
          -- [feat 2026-07-03] +condicion en el GROUP BY: el stock queda dividido por (almacén,
          --   variante, condición); una misma variante puede aparecer en 'primera' y 'segunda'.
          GROUP BY tic.idx_alm, tid.idxsub, tid.condicion
          HAVING stock <> 0
        ) x
        ORDER BY producto, color, talla, almacen
      `;

      const [result] = await conn.execute(query);

      // [feat 2026-07-06] El enriquecimiento de "último ingreso" va en su PROPIO try/catch: es un
      //   dato secundario y su consulta es pesada (escanea el ledger). Si fallara o hiciera timeout,
      //   NO debe tumbar el listado de stock —que ya funciona—; en ese caso se devuelve el stock tal
      //   cual (sin los campos de ingreso) en vez de caer al catch general y retornar [].
      try {
      // [feat 2026-07-06] Último INGRESO de stock por (almacén, variante, condición).
      //   Se resuelve en una 2.ª consulta + merge en JS (NO como JOIN dentro de `query`) porque
      //   MySQL 5.7 (producción) no genera auto-key para el derived del mapa de ingresos: el join
      //   top-level caía en block-nested-loop (15k×84k filas) y hacía timeout. Así quedan dos
      //   SELECT simples e independientes (stock ~1.5s; ingresos ~5s de ejecución + transferir
      //   ~85k filas del ledger desde el servidor remoto ⇒ el segundo domina el tiempo de carga).
      //   Ningún filtro grueso (por almacén o por producto) acota esas 85k a las ~15k realmente
      //   usadas, así que se traen todas y se filtran en el merge. La fila del ÚLTIMO ingreso se identifica
      //   por MAX(idx) (autoincrement ≈ orden cronológico real) y el join a la PK recupera su
      //   `created_at` y `cantidad` (que coincide 100% con saldo-stock en los ingresos). Solo lectura.
      const [ingresos] = await conn.execute(`
        SELECT m.id_almacen_CAB, m.idxsub, m.condicion,
               m.created_at AS fecha_ultimo_ingreso,
               m.cantidad   AS cantidad_ultimo_ingreso
        FROM (
          SELECT id_almacen_CAB, idxsub, condicion, MAX(idx) AS idx_last
          FROM tbl2_almacen_mov_det
          WHERE saldo > stock AND idxsub IS NOT NULL AND idxsub <> ''
          GROUP BY id_almacen_CAB, idxsub, condicion
        ) last
        JOIN tbl2_almacen_mov_det m ON m.idx = last.idx_last
      `);

      // Índice en memoria por "almacén|variante|condición" para fusionar en O(n).
      //   [importante] `idxsub` (id de subproducto) se guarda con FORMATO DISTINTO en cada tabla:
      //   en tbl2_inventario_det viene sin relleno ("2159") y en tbl2_almacen_mov_det con ceros a la
      //   izquierda ("0000002159"). Por eso se normaliza a NÚMERO en ambos lados (Number()); comparar
      //   como texto sin normalizar cruzaba <5% de las filas. id de almacén también a número (zerofill)
      //   y condicion como texto. Variantes sin ingreso en ese almacén quedan con ambos campos null.
      const mapaIngresos = new Map(
        ingresos.map(r => [`${Number(r.id_almacen_CAB)}|${Number(r.idxsub)}|${r.condicion}`, r])
      );
      for (const row of result) {
        const ing = mapaIngresos.get(`${Number(row.id_almacen)}|${Number(row.id_subprod_CAB)}|${row.condicion}`);
        row.fecha_ultimo_ingreso    = ing ? ing.fecha_ultimo_ingreso    : null;
        row.cantidad_ultimo_ingreso = ing ? ing.cantidad_ultimo_ingreso : null;
      }
      } catch (errIngreso) {
        // El listado de stock se conserva; solo se pierden los campos de último ingreso.
        console.log('[stockporalmacen] enriquecimiento de último ingreso omitido:', errIngreso?.message ?? errIngreso)
      }

      return result
    } catch (error) {
      console.log(error)
      return []
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getGuia(idmov){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let [cabmov] = await conn.execute(`
        SELECT
          DATE_FORMAT(STR_TO_DATE(t1.fec_Emision_DOC,'%d/%m/%Y'),'%Y-%m-%d') as fec_emision,
          t1.Nro_Doc_Prov,
          t1.Raz_social_DOC,
          tpic.id_proveedor_CAB,
          tpic.proveedor,
          tpic.idx as id_pedido_origen,
          tpic.orden_ref as nro_requerimiento,
          t1.tipomov,
          t1.id_modelo,
          (select tfpo.modelos from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as modelos,
          (select tfpo.oc from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as oc,
          (select tbc.numero_corte from tbl2_fases_prod_hojacorte tbc where tbc.id_cab_orden = t1.id_modelo limit 1) as nro_corte,
          tpic.orden_ref as nro_pedido_origen
        FROM tbl_kard_compras_CAB t1 
        join tbl2_pedidos_insumos_cab tpic on tpic.idx = t1.id_requerimiento
        WHERE t1.ruc = '20522094120' and t1.id_CAB = ? and t1.estado = 'EMITIDO'
      `,[idmov])
      let [detmov] = await conn.execute(`
        -- select *from tbl_kard_compras_DET where id_CAB_DET = ?
        select 
          tpid.producto,
          tpid.color,
          tpid.rollos,
          tpid.cantidad,
          tpid.unidad,
          tpid.precio,
          tpic.orden_ref as nro_pedido_origen,
          t2.*
        FROM tbl_kard_compras_CAB t1
        join tbl2_pedidos_insumos_cab tpic on tpic.idx = t1.id_requerimiento
        join tbl_kard_compras_DET t2 on t1.id_CAB = t2.id_CAB_DET 
        join tbl2_pedidos_insumos_det tpid on tpid.id_pedido_CAB = tpic.idx and tpid.id_subprod_CAB = t2.id_subprod
        where t1.ruc = '20522094120' and t1.id_CAB = ? and t1.estado = 'EMITIDO'
      `,[idmov])

      console.log("La informacion consulta es: ",cabmov,detmov)

      return {ok:true,cab:cabmov[0],det:detmov}
    } catch (error) {
      console.log(error)
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getDespacho(idmov){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()

      let [cabmov] = await conn.execute(`
        SELECT
          DATE_FORMAT(STR_TO_DATE(t1.fec_Emision_DOC,'%d/%m/%Y'),'%Y-%m-%d') as fec_emision,
          t1.Suc_Tienda,
          t1.Nro_Doc_Prov,
          t1.Raz_social_DOC,
          tpic.id_proveedor_CAB,
          tpic.proveedor,
          tpic.idx as id_pedido_origen,
          tpic.orden_ref as nro_requerimiento,
          t1.tipomov,
          t1.motivo,
          t1.id_modelo,
          t1.producto,
          t1.id_orden,
          (select tfpo.modelos from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as modelos,
          (select tfpo.oc from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as oc,
          (select tbc.numero_corte from tbl2_fases_prod_hojacorte tbc where tbc.id_cab_orden = t1.id_modelo limit 1) as nro_corte,
          tpic.orden_ref as nro_pedido_origen,
          (select ta.nom from tbl2_almacen ta where ta.idx = t1.Suc_Tienda) as almacen
        FROM tbl_kard_compras_CAB t1 
        left join tbl2_pedidos_insumos_cab tpic on tpic.idx = t1.id_requerimiento
        WHERE t1.ruc = '20522094120' and t1.id_CAB = ? and t1.estado = 'EMITIDO'
      `,[idmov])

      let [detmov] = await conn.execute(`
        select 
          t1.*,
          (select tp.codUnidadMedida from tbl2_productos tp where tp.idx = ts.idx_CAB_PROD) as unidad,
          ts.nom as producto,
          ts.talla,
          (select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR ) as color
        from tbl_kard_compras_DET t1 
        left join tbl2_subproductos ts on t1.id_subprod = ts.idx
        where t1.id_CAB_DET = ?
      `,[idmov])

      return {ok:true,cab:cabmov[0],det:detmov}
    } catch (error) {
      console.log(error)
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveDespacho(data,session){
    console.log("Inicia el proceso save movimiento")
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      console.log("La info recibida es:",data)
      let cabecera = JSON.parse(data.info)
      let detalle = JSON.parse(data.detalle)
      console.log("La informacion de la cebecra es:",cabecera)
      console.log("La informacion del detalle es:",detalle)

      // Obtener cod_cuenta
      const cod_cnta = 20;
      const tip_prod_cdp = 2;
      const serie_prod = 0;

      // Insertar en tbl_kard_compras_CAB
      const data_guia = {
        ruc: '20522094120',
        tip_DOC: tip_prod_cdp,
        serie_DOC: serie_prod,
        num_doc_CDP: 0,
        id_proveedor_CAB: cabecera.id_proveedor_CAB,
        Nro_Doc_Prov: cabecera.ruc,
        Raz_social_DOC: cabecera.proveedor,
        Dir_DOC: '',
        Suc_Tienda: parseInt(cabecera.Suc_Tienda),
        observaciones: cabecera.observaciones,
        fec_Reg_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        fec_Emision_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        idx_usu: session.id,
        tipomov: cabecera.tipo_operacion,
        id_requerimiento: parseInt(cabecera.id_pedido_origen ?? 0),
        id_modelo: parseInt(cabecera.id_modelo ?? 0),
        motivo: cabecera.motivo,
        id_orden: cabecera.id_orden ?? 0,
        producto: cabecera.producto ?? ''
      };
      console.log("El detalle a insertar es:",data_guia)
      const [resultGuia] = await conn.execute(
        `INSERT INTO tbl_kard_compras_CAB (${Object.keys(data_guia).join(',')}) VALUES (${Object.keys(data_guia).map(() => '?').join(',')})`,
        Object.values(data_guia)
      );
      const id_guia = resultGuia.insertId;

      for(let element of detalle){
        const data_guia_det = {
          ruc: '20522094120',
          id_CAB_DET: id_guia,
          id_producto_DET: parseInt(element.id_producto_DET),
          Cant_producto_DET: 0,
          Cant_despacho_DET: parseFloat(element.Cant_despacho_DET),
          Suc_Tienda: parseInt(cabecera.Suc_Tienda),
          Precio_Unid_Det: 0,
          id_subprod: parseInt(element.id_subprod),
          metros:parseFloat(element.metros ?? 0),
          peso:parseFloat(element.peso ?? 0),
          rollos:parseFloat(element.rollos ?? 0),
          num_lote:parseInt(element.num_lote ?? 0),
          info_rollos:JSON.stringify(element.info_rollos ?? [])
        };
        const [resultGuiaDet] = await conn.execute(
          `INSERT INTO tbl_kard_compras_DET (${Object.keys(data_guia_det).join(',')}) VALUES (${Object.keys(data_guia_det).map(() => '?').join(',')})`,
          Object.values(data_guia_det)
        );
        // value.idx = value.idx;
        // detalle[key].idx = value.idx;
      }

      // Preparar data_comprobante
      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera.tipo_operacion)])

      let articulos = []
      for(let item of [...detalle]){
        if(item.idx_color == ''){
          console.log("Creando nuevo color")
          let [busqueda] = await conn.query("SELECT idx FROM tbl2_colores WHERE nom = ? AND ruc IN ('20522094120','20523875583') LIMIT 1",[item.color.trim()])
          if(busqueda.length > 0){
            console.log("Color hallado")
            item.idx_color = busqueda[0].idx
          }else{
            console.log("Creadndo cnuevo cokir")
            let resultcolor = await ProductosService.createNewColor({codigo:'',nom:item.color.trim(),ruc:'20522094120'},conn)
            if(!resultcolor.ok) throw new Error(resultcolor.message)
            console.log("Info de la creacion del color:",resultcolor)
            item.idx_color = resultcolor.idcolor
          }
        }
        if(item.id_subprod == ''){
          let [newprod] = await conn.query(`SELECT *FROM tbl2_productos WHERE ruc_ = '20522094120' AND idx = ?`,[item.id_producto_DET])
          console.log("La informacion del producto consultado es:",newprod)
          let resultsubprod = await ProductosService.createNewSubProduct({idx_CAB_PROD:item.id_producto_DET,codigo:newprod[0].codigo,isbn:newprod[0].isbn,nom:newprod[0].nom,idx_CAB_COLOR:item.idx_color,idx_talla:26,talla:'S/T',estado:'primera',nro_lote:item.num_lote},conn)
          if(!resultsubprod.ok) throw new Error(resultsubprod.message)
          console.log("Info de la creacion del subproducto:",resultsubprod)
          item.id_subprod = resultsubprod.resultid
        }
        // const [centro] = await conn.query("select valor from tbl2_produccion_config where ruc = ? and codigo = ?",['20522094120',(item.tipo == 'A' ? 'ALM_AVIOS' : 'ALM_TELAS')])

        articulos.push(
          {
            producto:item.producto,
            id_producto_CAB:item.id_producto_DET,
            // almacen_destino:parseInt(centro[0].valor),
            almacen_destino:parseInt(cabecera.Suc_Tienda),
            id_subprod_CAB:item.id_subprod,
            lote:item?.sinlote ? 0 : (item.num_lote || 0),
            tipo:item.tipo,
            despacho:parseFloat(item.Cant_despacho_DET)
          }
        )
      }
      console.log("La lista de articulos formateados es:",articulos)

      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: cabecera.observaciones,
        idx_documento_asoc: id_guia,
        lote: cabecera.id_pedido_origen ?? 0,
        origen: 'KARD',
        almacen_destino: parseInt(cabecera.Suc_Tienda),
        // articulos: JSON.stringify(detalle),
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Ingreso de despacho registrado con éxito.'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async updateDespacho(data,session,idguia){
    console.log("Inicia el proceso de actualizado de movimiento")
    let conn = undefined

    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      console.log("La info recibida es:",data)
      let cabecera = JSON.parse(data.info)
      let detalle = JSON.parse(data.detalle)
      console.log("La informacion de la cebecra es:",cabecera)
      console.log("La informacion del detalle es:",detalle)

      // const [backup] = await conn.query("SELECT t1.* FROM tbl_kard_compras_DET t1 join tbl2_subproductos ts WHERE id_CAB_DET = ?",[idguia])
      const [backup] = await conn.query(`SELECT
        t1.*,
        (select tp.codUnidadMedida from tbl2_productos tp where tp.idx = ts.idx_CAB_PROD) as unidad,
        ts.nom as producto,
        ts.talla,
        (SELECT tc.nom FROM tbl2_colores tc WHERE tc.idx = ts.idx_CAB_COLOR ) as color
      FROM tbl_kard_compras_DET t1 
      LEFT JOIN tbl2_subproductos ts on t1.id_subprod = ts.idx
      WHERE t1.id_CAB_DET = ?`,[parseInt(idguia)])
      console.log("La informacion del backup es:",backup)

      // Obtener cod_cuenta
      const cod_cnta = 20;
      const tip_prod_cdp = 2;
      const serie_prod = 0;

      // Actualizar tabla tbl_kard_compras_CAB
      const data_guia = {
        ruc: '20522094120',
        tip_DOC: tip_prod_cdp,
        serie_DOC: serie_prod,
        num_doc_CDP: 0,
        id_proveedor_CAB: cabecera.id_proveedor_CAB,
        Nro_Doc_Prov: cabecera.ruc,
        Raz_social_DOC: cabecera.proveedor,
        Dir_DOC: '',
        Suc_Tienda: parseInt(cabecera.Suc_Tienda),
        observaciones: cabecera.observaciones,
        fec_Reg_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        fec_Emision_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        idx_usu: session.id,
        tipomov: cabecera.tipo_operacion,
        id_requerimiento: parseInt(cabecera.id_pedido_origen ?? 0),
        id_modelo: parseInt(cabecera.id_modelo ?? 0)
      };
      console.log("La info cabecera a actualizar es la siguiente:",data_guia)
      const query = 'UPDATE tbl_kard_compras_CAB SET ' + Object.keys(data_guia).map(row => row + " = NULLIF(?,'')").toString() + ' WHERE id_CAB = ' + idguia
      const valores = Object.keys(data_guia).map(row => cabecera[row])
      console.log("Los parametros de la consulta son:",query,valores)
      // await conn.query(query,valores)

      conn.rollback()
      throw new Error("Error de prueba")

      await conn.execute("DELETE FROM tbl_kard_compras_DET WHERE ruc = '20522094120' and id_CAB_DET = ?",[idguia])
      for(let element of detalle){
        const data_guia_det = {
          ruc: '20522094120', 
          id_CAB_DET: idguia,
          id_producto_DET: parseInt(element.id_producto_DET),
          Cant_producto_DET: 0,
          Cant_despacho_DET: parseFloat(element.Cant_despacho_DET),
          Suc_Tienda: parseInt(cabecera.Suc_Tienda),
          Precio_Unid_Det: 0,
          id_subprod: parseInt(element.id_subprod),
          metros:parseFloat(element.metros ?? 0),
          rollos:parseFloat(element.rollos ?? 0),
          peso:parseFloat(element.peso ?? 0),
          num_lote:parseInt(element.num_lote ?? 0),
          info_rollos:JSON.stringify(element.info_rollos ?? [])
        };
        const [resultGuiaDet] = await conn.execute(
          `INSERT INTO tbl_kard_compras_DET (${Object.keys(data_guia_det).join(',')}) VALUES (${Object.keys(data_guia_det).map(() => '?').join(',')})`,
          Object.values(data_guia_det)
        );
      }

      const [validacion] = await conn.execute(`
        SELECT *FROM tbl_kard_compras_CAB t1
        JOIN tbl_kard_compras_DET t2 on t1.id_CAB = t2.id_CAB_DET
        where t1.id_CAB = ?
      `,[parseInt(idguia)])
      console.log("La informacion de la validacion es:",validacion)


      let res_mov = undefined ,articulos = [] ,data_comprobante = {}, busqueda = undefined;
      // 9	INGR	Ingreso de productos	10285		2023-06-01 09:29:16
      // 10	RETR	Retiro de productos	75303		2023-06-01 09:29:18

      // ////////////////////////////////////////

      [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera.tipo_operacion) == 9 ? 10 : 9]);
      articulos = []
      for(let item of [...backup]){
        articulos.push(
          {
            producto:item.producto,
            id_producto_CAB:item.id_producto_DET,
            // almacen_destino:parseInt(centro[0].valor),
            almacen_destino:parseInt(cabecera.Suc_Tienda),
            id_subprod_CAB:item.id_subprod,
            lote:item?.sinlote ? 0 : (item.num_lote || 0),
            tipo:item.tipo,
            despacho:parseFloat(item.Cant_despacho_DET)
          }
        )
      }
      console.log("La lista de articulos formateados es:",articulos)

      data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: cabecera.observaciones,
        idx_documento_asoc: idguia,
        lote: cabecera.id_pedido_origen ?? 0,
        origen: 'KARD',
        almacen_destino: parseInt(cabecera.Suc_Tienda),
        // articulos: JSON.stringify(detalle),
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message);

      console.log("CONTINUA TODO OKK =================>");

      // /////////////////////////////////////////////////////////

      [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera.tipo_operacion)]);
      articulos = [];
      for(let item of [...detalle]){
        if(item.idx_color == ''){
          console.log("Creando nuevo color")
          let [busqueda] = await conn.query("SELECT idx FROM tbl2_colores WHERE nom = ? AND ruc IN ('20522094120','20523875583') LIMIT 1",[item.color.trim()])
          if(busqueda.length > 0){
            console.log("Color hallado")
            item.idx_color = busqueda[0].idx
          }else{
            console.log("Creadndo cnuevo cokir")
            let resultcolor = await ProductosService.createNewColor({codigo:'',nom:item.color.trim(),ruc:'20522094120'},conn)
            if(!resultcolor.ok) throw new Error(resultcolor.message)
            console.log("Info de la creacion del color:",resultcolor)
            item.idx_color = resultcolor.idcolor
          }
        }
        if(item.id_subprod == ''){
          let [newprod] = await conn.query(`SELECT *FROM tbl2_productos WHERE ruc_ = '20522094120' AND idx = ?`,[item.id_producto_DET])
          console.log("La informacion del producto consultado es:",newprod)
          let resultsubprod = await ProductosService.createNewSubProduct({idx_CAB_PROD:item.id_producto_DET,codigo:newprod[0].codigo,isbn:newprod[0].isbn,nom:newprod[0].nom,idx_CAB_COLOR:item.idx_color,idx_talla:26,talla:'S/T',estado:'primera',nro_lote:item.num_lote},conn)
          if(!resultsubprod.ok) throw new Error(resultsubprod.message)
          console.log("Info de la creacion del subproducto:",resultsubprod)
          item.id_subprod = resultsubprod.resultid
        }

        articulos.push(
          {
            producto:item.producto,
            id_producto_CAB:item.id_producto_DET,
            // almacen_destino:parseInt(centro[0].valor),
            almacen_destino:parseInt(cabecera.Suc_Tienda),
            id_subprod_CAB:item.id_subprod,
            lote:item?.sinlote ? 0 : (item.num_lote || 0),
            tipo:item.tipo,
            despacho:parseFloat(item.Cant_despacho_DET)
          }
        )
      }
      console.log("La lista de articulos formateados es:",articulos)

      data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: cabecera.observaciones,
        idx_documento_asoc: idguia,
        lote: cabecera.id_pedido_origen ?? 0,
        origen: 'KARD',
        almacen_destino: parseInt(cabecera.Suc_Tienda),
        // articulos: JSON.stringify(detalle),
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)


      // const [verifica] = await conn.execute('select *from tbl2_almacen_det where idx_subproducto = 14590 and lote = 287')
      // console.log("EL stock actual es:",verifica)

      if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveGuia(data){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      console.log("La info recibida es:",data)
      let cabecera = JSON.parse(data.info)
      let detalle = JSON.parse(data.detalle)
      console.log("La informacion de la cebecra es:",cabecera)
      console.log("La informacion del detalle es:",detalle)

      // Obtener cod_cuenta
      const cod_cnta = 20;
      const tip_prod_cdp = 2;
      const serie_prod = 0;

      // Insertar en tbl_kard_compras_CAB
      const data_guia = {
        ruc: '20522094120',
        tip_DOC: tip_prod_cdp,
        serie_DOC: serie_prod,
        num_doc_CDP: 0,
        Nro_Doc_Prov: cabecera.ruc,
        Raz_social_DOC: cabecera.proveedor,
        Dir_DOC: '',
        Suc_Tienda: 509,
        observaciones: cabecera.observaciones,
        fec_Reg_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        fec_Emision_DOC: cabecera.fec_emision.split('-').reverse().join('/'),
        idx_usu: 0,
        tipomov: cabecera.tipo_operacion,
        id_requerimiento: parseInt(cabecera.id_pedido_origen ?? 0),
        id_modelo: parseInt(cabecera.id_modelo ?? 0)
      };
      console.log("El detalle a insertar es:",data_guia)
      const [resultGuia] = await conn.execute(
        `INSERT INTO tbl_kard_compras_CAB (${Object.keys(data_guia).join(',')}) VALUES (${Object.keys(data_guia).map(() => '?').join(',')})`,
        Object.values(data_guia)
      );
      const id_guia = resultGuia.insertId;

      for(let element of detalle){
        const data_guia_det = {
          ruc: '20522094120',
          id_CAB_DET: id_guia,
          id_producto_DET: parseInt(element.id_producto_CAB),
          Cod_producto_DET: '',
          Cant_producto_DET: 0,
          Cant_despacho_DET: parseFloat(element.despacho),
          Suc_Tienda: 509,
          Precio_Unid_Det: 0,
          id_subprod: parseInt(element.id_subprod_CAB)
        };
        const [resultGuiaDet] = await conn.execute(
          `INSERT INTO tbl_kard_compras_DET (${Object.keys(data_guia_det).join(',')}) VALUES (${Object.keys(data_guia_det).map(() => '?').join(',')})`,
          Object.values(data_guia_det)
        );
        // value.idx = value.idx;
        // detalle[key].idx = value.idx;
      }

      // Preparar data_comprobantE
      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera.tipo_operacion)])

      const articulos = detalle.map(item=>({
        producto:item.producto,
        id_producto_CAB:item.id_producto_CAB,
        almacen_destino:'',
        id_subprod_CAB:'',
        lote:0,
        tipo:''
      }))

      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: cabecera.observaciones,
        idx_documento_asoc: id_guia,
        lote: cabecera.id_pedido_origen ?? 0,
        origen: 'KARD',
        almacen_destino: 509,
        articulos: JSON.stringify(detalle),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      // let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      // if(!res_mov.ok) throw new Error(res_mov.message)

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteGuia(id){
    console.log("Dentro del proceso de eliminacion de guia:",id)
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      let [cabecera] = await conn.execute("SELECT *FROM tbl_kard_compras_CAB WHERE id_CAB = ? and ruc = ?",[id,'20522094120'])
      let [detalle] = await conn.execute("SELECT t1.*,COALESCE((select tp.nom from tbl2_productos tp where tp.idx = t1.id_producto_DET),'') as producto FROM tbl_kard_compras_DET t1 WHERE t1.id_CAB_DET = ?",[id])

      // let [detguia] = await conn.execute("SELECT t1.*,ts.nom as producto FROM tbl_kard_compras_DET t1 join tbl2_subproductos ts on t1.id_subprod = ts.idx WHERE id_CAB_DET = ?",[id])
      // let [infomov] = await conn.execute("SELECT *FROM tbl2_almacen_mov_cab WHERE idx_documento_asoc = ?",[id])

      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera[0].tipomov) == 10 ? 9 : 10])

      let articulos = detalle.map(row=>(
        {
          id_producto_CAB:row.id_producto_DET,
          producto:row.producto,
          id_subprod_CAB:row.id_subprod,
          almacen_destino:509,
          lote:cabecera[0].id_requerimiento,
          tipo:'I',
          despacho:row.Cant_despacho_DET
        }
      ))
      console.log("El listado de articulo es:",articulos)
      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: 'ANULACION DE GUIA DE TRASLADO',
        idx_documento_asoc: id,
        // lote: cabecera.id_pedido_origen,
        origen: 'KARD',
        almacen_destino: 509,
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)

      await conn.execute("UPDATE tbl_kard_compras_CAB SET estado = 'ANULADO' WHERE ruc = ? and id_CAB = ?",['20522094120',id])

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async deleteDespacho(id){
    console.log("Dentro del proceso de eliminacion de despacho almacen:",id)
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()

      let [cabecera] = await conn.execute("SELECT *FROM tbl_kard_compras_CAB WHERE id_CAB = ? and ruc = ?",[id,'20522094120'])
      let [detalle] = await conn.execute("SELECT t1.*,COALESCE((select tp.nom from tbl2_productos tp where tp.idx = t1.id_producto_DET),'') as producto FROM tbl_kard_compras_DET t1 WHERE t1.id_CAB_DET = ?",[id])
      console.log("Impriminedo informacion de la cabecera del despacho registrado:",cabecera)
      console.log("Imprimiendo informacion del detalle del despacho de almacen:",detalle)
      // let [detguia] = await conn.execute("SELECT t1.*,ts.nom as producto FROM tbl_kard_compras_DET t1 join tbl2_subproductos ts on t1.id_subprod = ts.idx WHERE id_CAB_DET = ?",[id])
      // let [infomov] = await conn.execute("SELECT *FROM tbl2_almacen_mov_cab WHERE idx_documento_asoc = ?",[id])

      let [busqueda] = await conn.execute("SELECT *FROM tbl2_cptes_ordenes_tipo WHERE idx = ?",[parseInt(cabecera[0].tipomov) == 10 ? 9 : 10])

      let articulos = detalle.map(row=>(
        {
          producto:row.producto,
          id_producto_CAB:row.id_producto_DET,
          almacen_destino:row.Suc_Tienda,
          id_subprod_CAB:row.id_subprod,
          lote:(row.num_lote || 0),
          tipo:'',
          despacho:parseFloat(row.Cant_despacho_DET)
        }
      ))
      console.log("El listado de articulos es el siguiente:",articulos)
      const data_comprobante = {
        id_comprobante_CAB: busqueda[0].idx,
        cod_comprobante: busqueda[0].codigo,
        num_comprobante: parseInt(busqueda[0].correlativo) + 1,
        observaciones: 'ANULACION DE GUIA DE TRASLADO',
        idx_documento_asoc: id,
        origen: 'KARD',
        almacen_destino: parseInt(cabecera[0].Suc_Tienda),
        articulos: JSON.stringify(articulos),
      };
      console.log("El detalle a insertar es el siguiente:",data_comprobante)
      let res_mov = await AlmacenModel.saveMovimiento(data_comprobante,conn)
      if(!res_mov.ok) throw new Error(res_mov.message)

      await conn.execute("UPDATE tbl_kard_compras_CAB SET estado = 'ANULADO' WHERE ruc = ? and id_CAB = ?",['20522094120',id])

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    } finally {
      if(conn) await conn.end()
    }
  }
  static async saveMovimiento(data, conn){
    console.log("Dentro de saveMovimiento:",data)
    try {

      let articulos = [];
      if (data.articulos) {
        articulos = typeof data.articulos === 'string' ? JSON.parse(data.articulos) : data.articulos;
      }
      delete data.filters;
      delete data.articulos;

      console.log("El listado de articulo es:",articulos)

      if (articulos.length > 0) {
        console.log("Inicia el proceso de movimiento de almacen!!!",articulos)

        let id;
        // Insertar cabecera de movimiento
        const data_comprobante = {
          id_comprobante_CAB: data.id_comprobante_CAB,
          cod_comprobante: data.cod_comprobante,
          num_comprobante: data.num_comprobante,
          idx_solicitud_asoc: data.idx_solicitud_asoc ?? null,
          idx_documento_asoc: data.idx_documento_asoc ?? null,
          origen: data.origen ?? null,
          observaciones: data.observaciones
        };
        const [resultCab] = await conn.execute(
          `INSERT INTO tbl2_almacen_mov_cab (${Object.keys(data_comprobante).join(',')}) VALUES (${Object.keys(data_comprobante).map(() => '?').join(',')})`,
          Object.values(data_comprobante)
        );
        id = resultCab.insertId;

        console.log("El id de la cabecera es:",id)

        switch (data.cod_comprobante) {
          case 'INGR':
            for (const value of articulos) {
              console.log("El articulo a ingresar es:",value)
              let stock = 0;
              let num_rows = 0;
              let almacen_destino = value.almacen_destino ?? data.almacen_destino;

              console.log("El dato a insertar es:", value)
              // Consultar stock actual en almacen
              const [consulta_deposito] = await conn.execute(
                `SELECT SUM(IF(tad.cantidad IS NULL,0,tad.cantidad)) AS cantidad
                FROM tbl2_almacen_det tad
                WHERE tad.id_cabprod = ? AND tad.id_CAB_DET = ? AND tad.idx_subproducto = ? AND lote = ? AND tad.estado = 1`,
                [value.id_producto_CAB, almacen_destino, value.id_subprod_CAB, parseInt(value.lote)]
              );
              if (consulta_deposito.length == 0 || consulta_deposito[0].cantidad == null) {
                num_rows = 0;
              } else {
                num_rows = 1;
                stock = parseFloat(consulta_deposito[0].cantidad);
              }

              const cantidad = parseFloat(value.despacho);

              // Insertar detalle de movimiento
              const mov_detalle = {
                id_comprobante_CAB: id,
                cod_producto: '',
                id_producto_CAB: value.id_producto_CAB,
                producto: value.producto,
                idxsub: value.id_subprod_CAB,
                id_almacen_CAB: almacen_destino,
                cantidad: cantidad,
                stock: stock,
                saldo: stock + cantidad,
                tipo: 'I',
              };
              await conn.execute(
                `INSERT INTO tbl2_almacen_mov_det (${Object.keys(mov_detalle).join(',')}) VALUES (${Object.keys(mov_detalle).map(() => '?').join(',')})`,
                Object.values(mov_detalle)
              );
              console.log("Termina proceso de insertado")

              // Actualizar o insertar stock en almacen_det
              if (num_rows > 0) {
                console.log("Se actualiza el stock existente")
                let [afectados] = await conn.execute(
                  `UPDATE tbl2_almacen_det SET cantidad = ? WHERE id_cabprod = ? AND idx_subproducto = ? AND id_CAB_DET = ? AND lote = ?`,
                  [cantidad + stock, value.id_producto_CAB, value.id_subprod_CAB, almacen_destino, value.lote]
                );
                console.log("Registros afectados:",afectados.affectedRows)
              } else {
                console.log("Se inserta un nuevo registro de almacen_det")
                const data_almacen_det = {
                  id_CAB_DET: almacen_destino,
                  id_cabprod: value.id_producto_CAB,
                  idx_subproducto: value.id_subprod_CAB,
                  id_kardcomp: id,
                  codigo_cabprod: '',
                  estado: 1,
                  tipo: 'I',
                  lote: value.lote,
                  cantidad: cantidad
                };
                let query = `INSERT INTO tbl2_almacen_det (${Object.keys(data_almacen_det).join(',')}) VALUES (${Object.keys(data_almacen_det).map(() => '?').join(',')})`
                console.log("COmponentes de la consulta mysql:",query,Object.values(data_almacen_det))
                await conn.execute(query,Object.values(data_almacen_det));
              }

            }
            // Actualizar correlativo
            await conn.execute(
              `UPDATE tbl2_cptes_ordenes_tipo SET correlativo = ? WHERE codigo = ?`,
              [parseInt(data.num_comprobante), data.cod_comprobante]
            );
            
            break
          case 'RETR':

            for (const value of articulos) {
              console.log("El articulo a retirar es:",value)
              let almacen_destino = value.almacen_destino ?? data.almacen_destino;

              // Consultar stock actual en almaceN
              const [consulta_deposito] = await conn.execute(
                `SELECT SUM(IF(tad.cantidad IS NULL,0,tad.cantidad)) AS cantidad
                FROM tbl2_almacen_det tad
                WHERE tad.id_cabprod = ? AND tad.id_CAB_DET = ? AND tad.idx_subproducto = ? AND lote = ? AND tad.estado = 1`,
                [value.id_producto_CAB, almacen_destino, value.id_subprod_CAB, parseInt(value.lote)]
              );
              console.log("El resultado de la consulta es:",consulta_deposito)
              const stockActual = parseFloat(consulta_deposito[0]?.cantidad ?? 0);

              if (parseFloat(stockActual.toFixed(2)) < parseFloat(parseFloat(value.despacho).toFixed(2))) {
                throw new Error("Stock insuficiente, por favor verifique.")
              }

              // Actualizar stock en almacen_det
              console.log("Se actualiza el stock existente")
              await conn.execute(
                `UPDATE tbl2_almacen_det SET cantidad = ? WHERE id_cabprod = ? AND idx_subproducto = ? AND id_CAB_DET = ? AND lote = ?`,
                [stockActual.toFixed(2) - parseFloat(value.despacho).toFixed(2), value.id_producto_CAB, value.id_subprod_CAB, almacen_destino, parseInt(value.lote)]
              );

              // Insertar detalle de movimiento
              console.log("Se inserta un nuevo registro de movimiento")
              const mov_detalle = {
                id_comprobante_CAB: id,
                cod_producto: '',
                id_producto_CAB: value.id_producto_CAB,
                producto: value.producto,
                id_almacen_CAB: almacen_destino,
                cantidad: parseFloat(value.despacho),
                stock: stockActual,
                saldo: stockActual.toFixed(2) - parseFloat(value.despacho).toFixed(2),
                tipo: 'I',
                idxsub: value.id_subprod_CAB
              };
              console.log("El detalle a insertar es:",mov_detalle)
              await conn.execute(
                `INSERT INTO tbl2_almacen_mov_det (${Object.keys(mov_detalle).join(',')}) VALUES (${Object.keys(mov_detalle).map(() => '?').join(',')})`,
                Object.values(mov_detalle)
              );

            }
            // Actualizar correlativo
            await conn.execute(
              `UPDATE tbl2_cptes_ordenes_tipo SET correlativo = ? WHERE codigo = ?`,
              [parseInt(data.num_comprobante), data.cod_comprobante]
            );

            break
          default :
            break
        }
        // if (!data.idx || data.idx === '') {
        // }
      } else {
        // ok = false;
        // message = "Se detecto un problema con la información relacionada al detalle del comprobante. Vuelva a intentarlo nuevamente.";
      }

      // Si hubo error, hacer rollback
      // if (!ok) {
      //   if (conn) await conn.rollback();
      //   throw new Error(message);
      // } else {
      //   if (conn) await conn.commit();
      // }

      // if(conn) conn.rollback()
      // if(conn) conn.commit()
      return {ok:true,message:'Guardado exitoso'}
    } catch (error) {
      console.log(error)
      // if(conn) conn.rollback()
      return {ok:false,message:error.message ?? error}
    }
  }
  static async getDisponibilidadRequerimiento(idreq){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [cabreq] = await conn.query(`SELECT DATE_FORMAT(tpic.fec_emision,"%d/%m/%Y") as fec_emision_cuadre,DATE_FORMAT(tpic.fec_retorno,"%d/%m/%Y") as fec_retorno_cuadre,DATEDIFF(STR_TO_DATE(tpic.fec_retorno,"%Y-%m-%d"), STR_TO_DATE(tpic.fec_emision,"%Y-%m-%d")) as duracion,tp.ruc as ruc,
      COALESCE((select GROUP_CONCAT(oc,'-') from tbl2_fases_prod_ordenes tpo where tpo.id_pedido_origen = tpic.idx),'-') as oc,
      COALESCE((
        select GROUP_CONCAT(t1.numero_corte,'-') from tbl2_fases_prod_hojacorte t1 
        join tbl2_fases_prod_ordenes t2 on t1.id_cab_orden = t2.idx
        where t2.id_pedido_origen  = tpic.idx
      ),'-') as nro_corte,tpic.* 
      FROM tbl2_pedidos_insumos_cab tpic join tbl2_proveedor tp on tpic.id_proveedor_CAB = tp.idx where tpic.idx = ?`, [idreq]);

      const [detreq] = await conn.query(`
        SELECT 
          t1.*,
          COALESCE((
            select sum(tbdd.despacho) from tbl2_despachos_cab tbdc
            join tbl2_despachos_det tbdd on tbdc.idx = tbdd.id_despacho_CAB
            where tbdc.id_pedido_origen = t1.id_pedido_CAB and tbdd.id_item = t1.idx
          ),0) as ingresos,
          COALESCE((select sum(COALESCE(cantidad,0)) 
          from tbl2_almacen_det tbad
          where tbad.idx_subproducto = t1.id_subprod_CAB and tbad.lote = t1.id_pedido_CAB)
          ,0) as stock
        FROM tbl2_pedidos_insumos_det t1 
        WHERE t1.id_pedido_CAB = ?
      `, [idreq]);

      return {ok:true,info:[cabreq[0], detreq]};
    } catch (err) {
      console.log(err)
      return {ok: false, message: err.message ?? err};
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getDisponibilidadModelo(idorden){
    //busqueda disponibilidad de modelos
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect();

      const [cabreq] = await conn.query(`
        SELECT
        tfd.idx as idorden,
        tfd.id_pedido_origen,
        tfd.modelos,
        DATE_FORMAT(tpic.fec_emision,"%d/%m/%Y") as fec_emision_cuadre,
        DATE_FORMAT(tpic.fec_retorno,"%d/%m/%Y") as fec_retorno_cuadre,
        DATEDIFF(STR_TO_DATE(tpic.fec_retorno,"%Y-%m-%d"), 
        STR_TO_DATE(tpic.fec_emision,"%Y-%m-%d")) as duracion,
        tp.ruc as ruc,
        COALESCE((select GROUP_CONCAT(oc,'-') from tbl2_fases_prod_ordenes tpo where tpo.id_pedido_origen = tpic.idx),'-') as oc,
        COALESCE((
          select GROUP_CONCAT(t1.numero_corte,'-') from tbl2_fases_prod_hojacorte t1 
            join tbl2_fases_prod_ordenes t2 on t1.id_cab_orden = t2.idx
            where t2.id_pedido_origen  = tpic.idx
        ),'-') as nro_corte,tpic.* 
        FROM tbl2_pedidos_insumos_cab tpic 
        join tbl2_proveedor tp on tpic.id_proveedor_CAB = tp.idx 
        join tbl2_fases_prod_ordenes tfd on tfd.id_pedido_origen = tpic.idx
        where tfd.idx = ?
      `, [idorden]);

      console.log("La info de la cabecera es::",cabreq)

      const [detreq] = await conn.query(`
        SELECT 
          t1.*,
          COALESCE((
            select sum(tbdd.despacho) from tbl2_despachos_cab tbdc
            join tbl2_despachos_det tbdd on tbdc.idx = tbdd.id_despacho_CAB
            where tbdc.id_pedido_origen = t1.id_pedido_CAB and tbdd.id_item = t1.idx
          ),0) as ingresos,
          COALESCE((select sum(COALESCE(cantidad,0)) 
          from tbl2_almacen_det tbad
          where tbad.idx_subproducto = t1.id_subprod_CAB and tbad.lote = t1.id_pedido_CAB)
          ,0) as stock
        FROM tbl2_pedidos_insumos_det t1 
        WHERE t1.id_pedido_CAB = ?
      `, [cabreq[0].id_pedido_origen]);

      return {ok:true,info:[cabreq[0], detreq]};
    } catch (err) {
      console.log(err)
      return {ok: false, message: err.message ?? err};
    } finally {
      if (conn) await conn.end()
    }
  }
  static async getInfoCuadreTelas(idmov){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      const query = `
        select 
          DATE_FORMAT(STR_TO_DATE(t1.fec_Emision_DOC,'%d/%m/%Y'),'%Y-%m-%d') as fec_emision,
          t1.Nro_Doc_Prov,
          t1.Raz_social_DOC,
          t1.tipomov,
          (select tfpo.modelos from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as modelos,
          (select tfpo.oc from tbl2_fases_prod_ordenes tfpo where tfpo.idx = t1.id_modelo) as oc,
          (select tbc.numero_corte from tbl2_fases_prod_hojacorte tbc where tbc.id_cab_orden = t1.id_modelo limit 1) as nro_corte,
          tpid.producto,
          tpid.color,
          tpid.rollos,
          tpid.cantidad,
          tpid.unidad,
          tpid.precio,
          tpic.orden_ref as nro_pedido_origen,
          t2.*
        FROM tbl_kard_compras_CAB t1
        join tbl2_pedidos_insumos_cab tpic on tpic.idx = t1.id_requerimiento
        join tbl_kard_compras_DET t2 on t1.id_CAB = t2.id_CAB_DET 
        join tbl2_pedidos_insumos_det tpid on tpid.id_pedido_CAB = tpic.idx and tpid.id_subprod_CAB = t2.id_subprod
        where t1.ruc = '20522094120' and t1.id_CAB = ? and t1.estado = 'EMITIDO'
      `
      const [result] = await conn.execute(query,[idmov]);
      return result
    } catch (error) {
      console.log(error)
    } finally {
      if(conn) await conn.end()
    }
  }
  static async updateInfoCuadreTelas(info,id){
    // MOSTRADNO DADOTSA DEL LA FINALIZ
    let conn = undefined
    let cab = info.info
    let det = JSON.parse(info.detalle)
    console.log("La informacin recibida es:",cab,det)
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      conn.beginTransaction()
      
      for(let fila of [...det]){
        let [result] = await conn.execute("UPDATE tbl_kard_compras_DET tb1 SET tb1.tizado = COALESCE(?,0), tb1.peso = COALESCE(?,0), tb1.panios = COALESCE(?,0), tb1.liquidacion = COALESCE(?,0), tb1.merma = COALESCE(?,0) WHERE tb1.id_CAB_DET = ? AND tb1.id_subprod = ?",[fila.tizado,fila.peso,fila.panios,fila.liquidacion,fila.merma,id,fila.id_subprod])
        console.log("Las filas modificadas fueron:",result.affectedRows)
      }

      // if(conn) conn.rollback()
      if(conn) conn.commit()
      return { ok:true, message:'El cuadre de telas fue ejecutado con éxito.' }
    } catch (error) {
      if(conn) conn.rollback()
      return { ok:false, message:error.message ?? error }
    } finally {
      if(conn) await conn.end()
    }
  }
  static async getInfoEtiqueta(idprod){
    let conn = undefined
    try {
      conn = await mysql.createConnection(configs[1])
      await conn.connect()
      
      let [result] = await conn.execute(`select 
        '0000000' as oc,
        tp.idx as idprod,
        tp.nom as producto,
        (select tr.nom from tbl2_rubros tr where tr.idx = tp.RUBROS) as articulo,
	      COALESCE(tp.modelo,'--') as modelo,
        COALESCE(tp.estilo,'--') as estilo,
        COALESCE(tp.base,'--') as base,
        COALESCE(tp.presentacion,'--') as tela,
        ROUND(tp.costo*(1+tp.utilidad1/100),2) as precio_oferta,
        ROUND(tp.costo*(1+tp.utilidad2/100),2) as precio_original,
        ts.idx as id,ts.idx_talla,ts.talla,ts.idx_CAB_COLOR as idcolor,
        COALESCE((select tc.nom from tbl2_colores tc where tc.idx = ts.idx_CAB_COLOR),'') as color 
        from tbl2_productos tp
        left join tbl2_subproductos ts on tp.idx = ts.idx_CAB_PROD
        where tp.idx = ?`
      ,[idprod])

      return result
    } catch (error) {
      return { ok:false, message:error.message ?? error }
    } finally {
      if(conn) await conn.end()
    }
  }
}