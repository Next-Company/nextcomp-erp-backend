import CajaServices from "../Servicios/caja.js"

export default class CajaController{
  static async getResumenCaja(req,resp){
    let fecha = req.params.fecha
    let pp = await CajaServices.getResumenCaja(fecha)
    resp.json(pp)
  }
}