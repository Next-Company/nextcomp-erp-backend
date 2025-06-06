import CobrosServices from "../Servicios/cobros.js"

export default class CobrosController{
  static async getLista(req,res){
    let search = req.params.search ?? ''
    let result = await CobrosServices.getLista(search)
    res.json(result)
  }
}