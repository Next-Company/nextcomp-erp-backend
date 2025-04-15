import AbonoServicio from "../Servicios/abonoServicio.js"

export default class AbonoController {
  static async getAbonosList(req, res) {
    const { limit } = req.params
    // const abonos = await req.container.resolve('AbonoRepository').getAbonosList(limit)
    const abonos = await AbonoServicio.getAbonosList(limit)
    res.json(abonos)
  }
  static async getServiciosStatus(req, res) {
    const { limit } = req.params
    const servicios = await AbonoServicio.getServiciosStatus(limit)
    res.json(servicios)
  }
  static async getLetrasStatus(req, res) {
    // const { limit } = req.params
    const servicios = await AbonoServicio.getLetrasStatus()
    res.json(servicios)
  }
  static async getServiciosStatusDetalle(req, res) {
    const { idguia } = req.params
    const servicios = await AbonoServicio.getServiciosStatusDetalle(idguia)
    res.json(servicios)
  }
  static async getAbonoById(req, res) {
    const { idabono } = req.params
    // const abonos = await req.container.resolve('AbonoRepository').getAbonosList(limit)
    const abono = await AbonoServicio.getAbono(idabono)
    res.json(abono)
  }
  static async getAbonoByServicio(req, res) {
    console.log("Dentro de abonos por servicio")
    const { idservicio } = req.params
    const abonos = await AbonoServicio.getAbonoByServicio(idservicio)
    res.json(abonos)
  }
  static async getSaldosServicio(req, res) {
    const { idproveedor } = req.params
    const saldos = await AbonoServicio.getSaldosServicios(idproveedor)
    res.json(saldos)
  }
  static async saveAbonoServicio(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveAbonoServicio(params)
    res.json(resp)
  }
  static async saveAbonoLetra(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveAbonoLetra(params)
    res.json(resp)
  }
  static async deleteAbono(req, res) {
    const { idabono } = req.params
    const resp = await AbonoServicio.deleteAbono(idabono)
    res.json(resp)
  }
  static async getCuentasList(req, res) {
    const search = req.params.search ?? ""
    const abonos = await AbonoServicio.getCuentasList(search)
    res.json(abonos)
  }
}