import { ProductosService } from "../Servicios/productosService.js"
export class ProductosController{
  static async getProductosList(req,res){
    console.log("Buscando producos")
    const info = await ProductosService.getProductosList();
    // res.send({data:info});
    res.send(info);
  }
  static async searchProducto(req,res){
    let busqueda = req.params.info
    console.log("Buscando productos, filtro busqueda:",busqueda)
    const info = await ProductosService.searchProducto(busqueda);
    console.log("Mostrando el resultado de busqueda de producdto:",busqueda)
    // res.send({data:info});
    res.send(info);
    // res.send({data:0,cantidad:22})
  }
  static async searchProductoById(req,res){
    console.log("Buscando productos")
    const info = await ProductosService.searchProductoById();
    // res.send({data:info});
    res.send(info);
  }
  static async createNewProduct(req,res){
    let data = []
    const info = await ProductosService.createNewProduct(data);
    // res.send({data:info});
    res.send(info);
  }
  static async createNewColor(req,res){
    let data = []
    const info = await ProductosService.createNewColor(data);
    // res.send({data:info});
    res.send(info);
  }
}