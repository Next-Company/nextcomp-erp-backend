import PDFDocument from "pdfkit"
import fs from "node:fs/promises"
import puppeteer from 'puppeteer';
import { OtherTarget } from "puppeteer-core";
import { concat } from "puppeteer-core/lib/esm/third_party/rxjs/rxjs.js";
import { OrdenesModel } from "../Servicios/ordenes.js";

export class OrdenesController {
  static async getOrdenes(req, reply) {
    // const user_data = req.session
    const search = req.params.search ?? ''
    const data = await OrdenesModel.getOrdenes(search)
    // console.log(data)
    reply.json(data)
  }
  static async getOrdenesByParams(req, reply) {
    const info = req.body
    const data = await OrdenesModel.getOrdenesByParams(info.params)
    reply.json(data)
  }
  static async getOrdenesById(req, reply) {
    const info = req.params
    const data = await OrdenesModel.getOrdenesById(info)
    reply.json(data)
  }
  static async saveInfoOrdenes(req, resp) {
    const info = req.body
    const user_data = req.session
    console.log("Por aqui vamos!")
    const data = await OrdenesModel.saveInfoOrdenes(info, user_data)
    resp.json(data)
  }
  static async testMultiSelect(req, resp) {
    const info = req.body
    const data = await OrdenesModel.testMultiSelect(info)
    resp.json(data)
  }
  static async traerMultiSelect(req, resp) {
    const data = await OrdenesModel.traerMultiSelect()
    resp.json(data)
  }
  static async getAll(req, resp) {
    const user_data = req.session
    const data = await OrdenesModel.getAll(user_data)
    // console.log(data)
    // console.log(resp)
    resp.json(data)
  }
  static async updateItems(req, resp) {
    // const data = await OrdenesModel.updateItems()
    // resp.json(data)
    // console.log(resp)
  }
  static async deleteOrden(req, resp) {
    let id = req.params.id
    const data = await OrdenesModel.deleteOrden(id)
    resp.json(data)
    // console.log(req)
    // resp.json([{resp:id}])
  }
  static async getListaProveedores(req, res) {
    const limit = req.params.limit
    const data = await OrdenesModel.getListaProveedores(limit)
    res.json(data)
  }
  static async searchProveedor(req, res) {
    const info = req.params.info
    const data = await OrdenesModel.searchProveedor(info)
    res.json(data)
  }
  static async searchProveedorById(req, res) {
    const info = req.params.info
    const data = await OrdenesModel.searchProveedorById(info)
    res.json(data)
  }
  static async getStatusGeneral(req, res) {
    const id = req.params.id
    const data = await OrdenesModel.getStatusGeneral(id)
    res.json(data)
  }
}