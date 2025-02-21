import { ProductosService } from "../Servicios/productosService.js"
export class ProductosController{
  static async getProductosList(req,res){
    console.log("Buscando producos")
    const info = await ProductosService.getProductosList();
    // res.send({data:info});
    res.send(info);
  }

}