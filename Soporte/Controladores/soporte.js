import { SoporteModel } from "../Servicios/soporte.js";

export class SoporteController{
  static async getAll(req,resp){
    const data = await SoporteModel.getAll()
    // console.log(resp)
    resp.json(data)
  }
  static async pushItems(req,resp){
    const info = req.body
    // console.log(info.asunto)
    const data = await SoporteModel.pushItems(info)
    // console.log(resp)
    // resp.json({resppp:info})
    resp.json(data)
  }
  static async updateItems(req,resp){
    // const data = await SoporteModel.updateItems()
    // resp.json(data)
    // console.log(resp)
  }
  static async deleteItems(req,resp){
    let id = req.params.id
    const data = await SoporteModel.deleteItems(id)
    resp.json(data)
    // console.log(req)
    // resp.json([{resp:id}])
  }
}