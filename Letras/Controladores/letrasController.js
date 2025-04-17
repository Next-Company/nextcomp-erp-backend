import { LetrasService } from "../Servicios/letrasServicio.js"

export class LetrasController{
  static async getLetrasLista(req,resp){
    const search = req.params.search ?? ''
    const busqueda = await LetrasService.getLetrasLista(search)
    console.log(busqueda)
    resp.json(busqueda)
  }
  static async getFacturasByProveedor(req,resp){
    const idproveedor = req.params.idproveedor ?? ''
    const busqueda = await LetrasService.getFacturasByProveedor(idproveedor)
    console.log(busqueda)
    resp.json(busqueda)
  }
  static async getFacturasByPedido(req,resp){
    const idpedido = req.params.idpedido ?? ''
    const busqueda = await LetrasService.getFacturasByPedido(idpedido)
    console.log(busqueda)
    resp.json(busqueda)
  }
  static async getPedidosByProveedor(req,resp){
    const idproveedor = req.params.idproveedor ?? ''
    const busqueda = await LetrasService.getPedidosByProveedor(idproveedor)
    console.log(busqueda)
    resp.json(busqueda)
  }
  static async getLetraById(req,resp){
    const id = req.params.id ?? ''
    const busqueda = await LetrasService.getLetraById(id)
    resp.json(busqueda)
  }
  static async deleteLetraById(req,resp){
    const id = req.params.id ?? ''
    const result = await LetrasService.deleteLetraById(id)
    resp.json(result)
  }
  static async saveInfoLetra(req,resp){
    const info = req.body
    console.log("Info letra:",info)
    const busqueda = await LetrasService.saveInfoLetra(info)
    resp.json(busqueda)
  }
}