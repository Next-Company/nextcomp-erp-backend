export class HomeControlador {
  static getData(req, resp) {
    let info = {
      ok: true,
      message: "hola mundo"
    }
    resp.send(info)
  }
}