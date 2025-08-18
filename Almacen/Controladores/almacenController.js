import AlmacenModel from "../Servicios/almacenService.js"

export default class AlmacenController{
  static async getListaAlmacenes(req,reply){
    const data = await AlmacenModel.getListaAlmacenes()
    reply.send(data)
  }
  static async getMovimientosAlmacen(req,reply){
    const data = await AlmacenModel.getMovimientosAlmacen()
    reply.send(data)
  }
  static async saveGuia(req,reply){
    let info = JSON.parse(req.body.info)
    const data = await AlmacenModel.saveGuia(info)
    reply.send(data)
  }
}