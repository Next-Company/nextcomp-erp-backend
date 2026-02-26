import LocalesService from "../Servicios/localesService.js";

export default class LocalesController{
  static async getLocalesSeguimiento(req,res){
    const search = req.params.search ?? ''
    const result = await LocalesService.getLocalesSeguimiento(search)
    res.status(200).json(result)
  }
  static async getProcesosEnCurso(req,res){
    const idlocal = req.params.idlocal ?? ''
    const result = await LocalesService.getProcesosEnCurso(idlocal)
    res.status(200).json(result)
  }
}