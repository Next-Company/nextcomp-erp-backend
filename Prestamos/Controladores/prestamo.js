import PrestamoService from '../Servicios/prestamo.js'

export default class PrestamoController{
  static async getListaPrestamos(req,res){
    let datos = req.params
    let info = await PrestamoService.getListaPrestamos()
    res.json([info])
  }
  static async getInfoPrestamoById(req,res){
    let datos = req.params
    let info = await PrestamoService.getInfoPrestamoById()
    res.json([info])
  }
  static async updatePrestamo(req,res){
    let datos = req.body
    let info = await PrestamoService.updatePrestamo(datos)
    res.json([info])
  }
  static async deletePrestamoById(req,res){
    let datos = req.params
    let info = await PrestamoService.deletePrestamoById()
    res.json([info])
  }
}