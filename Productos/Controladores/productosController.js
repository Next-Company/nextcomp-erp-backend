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
  static async generateProducto(req,res){
    let data = req.body
    const info = await ProductosService.generateProducto(data);
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
  static async getRubrosList(req,res){
    const limit = req.params.limit
    const info = await ProductosService.getRubrosList(limit);
    res.send(info);
  }
  static async searchRubro(req,res){
    let search = req.params.search ?? ''
    const info = await ProductosService.searchRubro(search);
    res.send(info);
  }
  static async getUnidadesList(req,res){
    const limit = req.params.limit
    const info = await ProductosService.getUnidadesList(limit);
    res.send(info);
  }
  static async searchUnidad(req,res){
    let search = req.params.search ?? ''
    const info = await ProductosService.searchUnidad(search);
    res.send(info);
  }
}