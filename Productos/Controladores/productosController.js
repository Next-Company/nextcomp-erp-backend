import { ProductosService } from "../Servicios/productosService.js"
export class ProductosController{
  static async getProductosList(req,res){
    console.log("Buscando producos")
    const search = req.params.search ?? ''
    const info = await ProductosService.getProductosList(search);
    // res.send({data:info});
    res.send(info);
  }
  static async getRecetasList(req,res){
    console.log("Buscando producos")
    let search = req.params.search ?? ''
    const info = await ProductosService.getRecetasList(search);
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
    const id = req.params.id ?? ''
    const info = await ProductosService.searchProductoById(id);
    // res.send({data:info});
    res.send(info);
  }
  static async generateProducto(req,res){
    let imagenes = req.files
    let data = req.body
    const info = await ProductosService.generateProducto(data,imagenes);
    res.send(info);
  }
  static async updateProducto(req,res){
    let imagenes = req.files
    let data = req.body
    const info = await ProductosService.updateProducto(data,imagenes);
    res.send(info);
  }
  static async createNewProduct(req,res){
    let data = []
    // const info = await ProductosService.createNewProduct(data);
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
  static async getProductosConStock(req,res){
    console.log("Buscando producoss")
    const search = req.params.search ?? ''
    let filters = req.body.filters ?? {} 
    console.log("Doña tomaza :",filters)
    const info = await ProductosService.getProductosConStock(search,filters);
    res.send(info);
  }
  static async getProductosTotal(req,res){
    const search = req.params.search ?? ''
    const filters = req.body.filters ?? {}
    const info = await ProductosService.getProductosTotal(search,filters);
    res.send(info);
  }
  static async getProductosEstilo(req,res){
    console.log("Buscando producos")
    const search = req.params.search ?? ''
    const info = await ProductosService.getProductosEstilo(search);
    res.send(info);
  }
  static async getProductosBase(req,res){
    console.log("Buscando producos")
    const search = req.params.search ?? ''
    const info = await ProductosService.getProductosBase(search);
    res.send(info);
  }
  static async getProductosMarca(req,res){
    console.log("Buscando producos")
    const search = req.params.search ?? ''
    const info = await ProductosService.getProductosMarca(search);
    res.send(info);
  }
  static async getProductosPresentacion(req,res){
    console.log("Buscando producos")
    const search = req.params.search ?? ''
    const info = await ProductosService.getProductosPresentacion(search);
    res.send(info);
  }

}