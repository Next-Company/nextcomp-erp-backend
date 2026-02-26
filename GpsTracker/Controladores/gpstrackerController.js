import GpsTrackerService from "../Servicios/gpstrackerService.js";

export default class GpsTrackerController{
  static async getInfo(req,res){
    const search = req.params.search ?? ''
    const result = await GpsTrackerService.getInfo(search)
    res.json(result)
  }
}