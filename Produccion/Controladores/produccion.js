import { ProduccionModel } from "../Servicios/produccion.js";

export class ProduccionController {
  static async getOrdenes(req, reply) {
    const user_data = req.session
    const data = await ProduccionModel.getOrdenes(user_data)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async getOrdenesById(req, reply) {
    const info = req.params
    const data = await ProduccionModel.getOrdenesById(info)
    // console.log(data)
    reply.json(data)
    // reply.send(JSON.stringify({"nombre":'juan'}))
  }
  static async pushItems(req, resp) {
    const info = req.body
    const user_data = req.session
    // console.log(info.asunto)
    console.log("Por aqui vamos!")
    const data = await ProduccionModel.pushItems(info, user_data)
    // console.log(resp)

    // resp.json({resppp:info})
    resp.json(data)
  }
  static async testMultiSelect(req, resp) {
    const info = req.body
    const data = await ProduccionModel.testMultiSelect(info)
    resp.json(data)
  }
  static async traerMultiSelect(req, resp) {
    const data = await ProduccionModel.traerMultiSelect()
    resp.json(data)
  }
  static async getAll(req, resp) {
    const user_data = req.session
    const data = await ProduccionModel.getAll(user_data)
    // console.log(data)
    // console.log(resp)
    resp.json(data)
  }
  static async updateItems(req, resp) {
    // const data = await ProduccionModel.updateItems()
    // resp.json(data)
    // console.log(resp)
  }
  static async deleteOrden(req, resp) {
    let id = req.params.id
    const data = await ProduccionModel.deleteOrden(id)
    resp.json(data)
    // console.log(req)
    // resp.json([{resp:id}])
  }
}