import CobrosServices from "../Servicios/cobros.js"

export default class CobrosController{
  static async getLista(req,res){
    let search = req.params.search ?? ''
    let result = await CobrosServices.getLista(search)
    res.json(result)
  }
  static async getListaById(req,res){
    let id = req.params.id ?? ''
    let result = await CobrosServices.getListaById(id)
    res.json(result)
  }
  static async saveCobro(req, res) {
    const params = req.body
    const resp = await CobrosServices.saveCobro(params)
    res.json(resp)
  }
  static async deleteCobro(req, res) {
    const { idabono } = req.params
    const resp = await CobrosServices.deleteCobro(idabono)
    res.json(resp)
  }
  static async getAbonos(req,res){
    let search = req.params.search ?? ''
    let result = await CobrosServices.getAbonos(search)
    res.json(result)
  }
}