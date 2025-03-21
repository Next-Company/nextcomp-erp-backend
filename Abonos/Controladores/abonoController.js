import AbonoServicio from "../Servicios/abonoServicio.js"

export default class AbonoController {
  static async getAbonosList(req, res) {
    const { limit } = req.params
    // const abonos = await req.container.resolve('AbonoRepository').getAbonosList(limit)
    const abonos = await AbonoServicio.getAbonosList(limit)
    res.json(abonos)
  }
  static async getAbonoById(req, res) {
    console.log("Llegando a getAbonoById")
    const { idabono } = req.params
    // const abonos = await req.container.resolve('AbonoRepository').getAbonosList(limit)
    const abono = await AbonoServicio.getAbono(idabono)
    res.json(abono)
  }
  static async getSaldosServicio(req, res) {
    const { idproveedor } = req.params
    const saldos = await AbonoServicio.getSaldosServicios(idproveedor)
    res.json(saldos)
  }
  static async saveAbono(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveAbono(params)
    res.json(resp)
  }
  static async deleteAbono(req, res) {
    const { idabono } = req.params
    const resp = await AbonoServicio.deleteAbono(idabono)
    res.json(resp)
  }
}