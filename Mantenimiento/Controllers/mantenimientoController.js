import MantenimientoService from "../Services/mantenimientoService.js";

export default class MantenimientoController {
  static async getListaColores(req,res) {
    let search = req.params.search || ''
    let respuesta = await MantenimientoService.getListaColores(search)
    res.send(respuesta)
  }
}