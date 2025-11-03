import ProveedorService from "../Services/proveedorService.js";

export default class ProveedorController{
  static async getListaProveedores(req,res){
    console.log("Buscando proveedores")
    const search = req.params.search ?? ''
    const info = await ProveedorService.getListaProveedores(search);
    res.send(info);
  }
  static async getProveedorById(req,res){
      const id = req.params.id ?? ''
      const info = await ProveedorService.getProveedorById(id);
      res.send(info);
    }
  static async saveInfoProveedor(req,res){
    let data = req.body ?? []
    const info = await ProveedorService.saveInfoProveedor(data);
    res.send(info);
  }
  static async updateInfoProveedor(req,res){
    let id = req.params.id ?? ''
    let data = req.body ?? []
    const info = await ProveedorService.updateInfoProveedor(id,data);
    res.send(info);
  }
  static async deleteInfoProveedor(req,res){
    let id = req.params.id ?? ''
    const info = await ProveedorService.deleteInfoProveedor(id,data);
    res.send(info);
  }
}