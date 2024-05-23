import { SoporteModel } from "../Servicios/soporte.js";
export class SoporteController{
  static async getAll(req,resp){
    const data = await SoporteModel.getAll()
    console.log(data)
    resp.json(data)
  }
}