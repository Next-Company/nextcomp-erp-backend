import LocalesService from "../Servicios/localesService.js";

export default class LocalesController{
  static async getTalleres(req,res){
    const search = req.params.search ?? ''
    const result = await LocalesService.getTalleres(search)
    res.status(200).json(result)
  }
  static async getLocalDetail(req,res){
    const search = req.params.search ?? ''
    const result = await LocalesService.getLocalDetail(search)
    res.status(200).json(result)
  }
}