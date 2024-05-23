import { SoporteModel } from "../Servicios/soporte.js";

export class SoporteController{
  static async getAll(req,resp){
    const data = await SoporteModel.getAll()
    // console.log(resp)
    resp.json(data)
  }
  // static getAll = async (req,resp)=>{
  //   const data = await SoporteModel.getAll()
  //   resp.json(data)
  // }
}