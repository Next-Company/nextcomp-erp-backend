export default class AlmacenModel{
  static async getListaAlmacenes(){
    return [{info:1}]
  }
  static async generarGuiaDespachoAlmacen(info,tipo){
    // GENEREA EL DOCUMENTO DE SALIDA/INGRESO DE MERCADERIA CON FECHA HORA Y DOCUMENTO VINCULADO
    return [{info:1}]
  }
  static async InOutStore(info,tipo){
    return [{info:1}]
  }
  static async saveMovimientoInOut(info,tipo){
    // ACTUALIZA EL STOCK DE ALMACEN Y REGISTRA MVIMIENTO DE KARDEX
    return [{info:1}]
  }
}