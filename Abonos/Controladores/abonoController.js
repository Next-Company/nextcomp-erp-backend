import AbonoServicio from "../Servicios/abonoServicio.js"

export default class AbonoController {
  static async getAbonosList(req, res) {
    const { limit } = req.params
    // const abonos = await req.container.resolve('AbonoRepository').getAbonosList(limit)
    const abonos = await AbonoServicio.getAbonosList(limit)
    res.json(abonos)
  }
  static async getServiciosStatus(req, res) {
    const search = req.params.search ?? ""
    const servicios = await AbonoServicio.getServiciosStatus(search)
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
  static async getProveedorServiciosStatusDetalle(req, res) {
    const { idproveedor } = req.params
    const servicios = await AbonoServicio.getProveedorServiciosStatusDetalle(idproveedor)
    res.json(servicios)
  }
  static async getLetrasStatusDetalle(req, res) {
    const { idletra } = req.params
    const servicios = await AbonoServicio.getLetrasStatusDetalle(idletra)
    res.json(servicios)
  }
  static async getPrestamoStatusDetalle(req, res) {
    const { idprestamo } = req.params
    const prestamos = await AbonoServicio.getPrestamoStatusDetalle(idprestamo)
    res.json(prestamos)
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
  static async saveAbonoPrestamo(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveAbonoPrestamo(params)
    res.json(resp)
  }
  static async deleteAbonoServicio(req, res) {
    const { idabono } = req.params
    const resp = await AbonoServicio.deleteAbonoServicio(idabono)
    res.json(resp)
  }
  static async deleteAbonoLetra(req, res) {
    const { idabono } = req.params
    const resp = await AbonoServicio.deleteAbonoLetra(idabono)
    res.json(resp)
  }
  static async deleteAbonoPrestamo(req, res) {
    const { idabono } = req.params
    const resp = await AbonoServicio.deleteAbonoPrestamo(idabono)
    res.json(resp)
  }
  static async getCuentasList(req, res) {
    const search = req.params.search ?? ""
    const abonos = await AbonoServicio.getCuentasList(search)
    res.json(abonos)
  }
  static async saveMovimientoCaja(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveMovimientoCaja(params)
    res.json(resp)
  }
  static async updateMovimientoCaja(req, res) {
    const params = req.body
    const resp = await AbonoServicio.saveMovimientoCaja(params)
    res.json(resp)
  }
  static async deleteMovimientoCaja(req, res) {
    const params = req.body
    const resp = await AbonoServicio.deleteMovimientoCaja(params)
    res.json(resp)
  }
  static async getPenalidadBygGuia(req, res) {
    const idguia = req.params.idguia ?? ""
    const servicios = await AbonoServicio.getPenalidadBygGuia(idguia)
    res.json(servicios)
  }
  static async getPenalidadesList(req, res) {
    const penalidades = await AbonoServicio.getPenalidadesList()
    res.json(penalidades)
  }
}