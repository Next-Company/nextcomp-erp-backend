import AlmacenModel from "../Servicios/almacenService.js"

export default class AlmacenController{
  static async getListaAlmacenes(req,reply){
    const data = await AlmacenModel.getListaAlmacenes()
    reply.send(data)
  }
}