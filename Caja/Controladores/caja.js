import CajaServices from "../Servicios/caja.js"

export default class CajaController{
  static async getResumenCaja(req,resp){
    let fecha = req.params.fecha
    let idcaja = req.params.idcaja
    let pp = await CajaServices.getResumenCaja(fecha,idcaja)
    resp.json(pp)
  }
}