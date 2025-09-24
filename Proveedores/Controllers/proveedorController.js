import ProveedorService from "../Services/proveedorService.js";

export default class ProveedorController{
  static async getListaProveedores(req,res){
    console.log("Buscando proveedores")
    const search = req.params.search ?? ''
    const info = await ProveedorService.getListaProveedores(search);
    res.send(info);
  }
}