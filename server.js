import path from 'path'
import { fileURLToPath } from 'url'
import express, { json } from "express"
import cookieParser from "cookie-parser"
import { create } from 'express-handlebars'
import { soporteRouter } from "./Soporte/Routers/soporte.js"
import { directorioRouter } from "./Directorio/Routers/directorios.js"
import { loginRouter } from './Login/Routers/loginRouter.js'
import { homeRouter } from './Home/Routers/home.js'
import cors from 'cors'
import multer from 'multer'
import { PORT_DEFAULT, SECRET_JWT_KEY, SECRET_JWT_KEY2, ORIGINS } from './Main/config.js'
import { jwt } from './Main/utils.js'
import { produccionRouter } from "./Produccion/Routers/produccion.js"
import { ProductosRouter } from "./Productos/Routers/productosRouter.js"
import { prestamoRouter } from "./Prestamos/Routers/prestamo.js"
import { AbonoRouter } from "./Abonos/Routers/abonoRouter.js"
import { LetrasRouter } from "./Letras/Routers/letrasRouter.js"
import { ReportRouter } from "./Reports/Routers/reportRouter.js"
import { ordenesRouter } from "./Ordenes/Routers/ordenes.js"
import { COBROS_ROUTER } from "./Cobros/Routers/cobros.js"
import { CAJA_ROUTER } from "./Caja/Routers/caja.js"
import ALMACEN_ROUTER from "./Almacen/Routers/almacenRouter.js"
import PROVEEDOR_ROUTER from "./Proveedores/Routers/proveedorRouter.js"
import MANTENIMIENTO_ROUTER from "./Mantenimiento/Routers/mantenimientoRouter.js"
import SERVICIOS_ROUTER from "./Servicios/Routers/serviciosRouter.js"
import GPS_ROUTER from "./GpsTracker/Routers/gpstrackerRouter.js"
import LOCAL_ROUTER from "./Locales/Routers/localesRouter.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

const app = express()

const hbs = create({
  partialsDir: [
    path.join(__dirname, 'views/partials'),
    path.join(__dirname, 'views/layouts'),
  ],
  helpers: {
    foo()  { return 'FOO!' },
    bar()  { return 'BAR!' },

    // Helper global — disponible en todos los templates
    plusindex(index) { return index + 1 },
    eq(a, b) { return a === b },

    // Generación de filas para guía de despacho por pedido de telas
    cuerpoDespachoTelas(items) {
      const extra = 5 // Solo 5 filas extras en lugar de 28
      const tdBorder = "border-left:1px solid #000;border-right:1px solid #000;"
      let rows = items.map((item, key) => `
        <tr style="height:22px;font-size:10px;">
          <td style="width:35px;text-align:center;background-color:#ffffff;${tdBorder}">${key + 1}</td>
          <td style="width:60px;font-size:9px;background-color:#ffffff;${tdBorder}">${item['producto']}</td>
          <td style="width:60px;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['color']}</td>
          <td style="width:60px;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['unidad']}</td>
          <td style="width:60px;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['peso'] ?? '-'}</td>
          <td style="width:60px;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['requerido']}</td>
          <td style="width:60px;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${(item['requerido'] ?? 0) - (item['pendiente'] ?? 0)}</td>
          <td style="font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['despacho']}</td>
          <td style="font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['costo_unit']}</td>
          <td style="font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${(item['despacho'] ?? 0) * (item['costo_unit'] ?? 0)}</td>
        </tr>
        ${item.info_rollos.map((row, i) => `
          <tr>
            <td style="background-color:#ffffff;${tdBorder}"></td>
            <td style="font-size:8px;padding-left:20px;background-color:#ffffff;${tdBorder}">${item['producto']}(${row.partida ?? '-'}) Rollo #${i + 1}</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">${row.peso}</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">${row.cantidad}</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
            <td style="font-size:8px;text-align:center;background-color:#ffffff;${tdBorder}">-</td>
          </tr>
        `).join('')}
      `)

      for (let i = 0; i < extra; i++) {
        rows.push(`
          <tr style="height:22px;">
            ${Array(10).fill(`<td style="background-color:#ffffff;${tdBorder}"></td>`).join('')}
          </tr>
        `)
      }
      return rows.join('')
    },

    // Generación de filas para guía de ingreso por requerimiento de avios
    cuerpoAvios(items) {
      const extra = 5
      const tdBorder = "border-left:1px solid #000;border-right:1px solid #000;"
      let rows = items.map((item, key) => {
        const precio = parseFloat(item['precio'] ?? 0)
        const cantidad = parseFloat(item['cantidad'] ?? 0)
        const importe = (precio * cantidad).toFixed(2)
        
        return `
        <tr style="height:22px;font-size:10px;">
          <td style="width:4%;text-align:center;background-color:#ffffff;${tdBorder}">${key + 1}</td>
          <td style="width:12%;font-size:9px;background-color:#ffffff;${tdBorder}">${item['modelo'] ?? ''}</td>
          <td style="width:12%;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['corte'] ? '#' + item['corte'] : ''}</td>
          <td style="width:20%;font-size:9px;background-color:#ffffff;${tdBorder}">${item['producto'] ?? ''}</td>
          <td style="width:10%;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['color'] ?? ''}</td>
          <td style="width:8%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${cantidad.toFixed(2)}</td>
          <td style="width:8%;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['unidad'] ?? ''}</td>
          <td style="width:10%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${precio.toFixed(2)}</td>
          <td style="width:10%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${importe}</td>
        </tr>`
      })

      for (let i = 0; i < extra; i++) {
        rows.push(`
          <tr style="height:22px;">
            ${Array(9).fill(`<td style="background-color:#ffffff;${tdBorder}"></td>`).join('')}
          </tr>
        `)
      }
      return rows.join('')
    },

    // Generación de filas para orden de compra de telas
    cuerpoTelas(items) {
      const extra = 5
      const tdBorder = "border-left:1px solid #000;border-right:1px solid #000;"
      let rows = items.map((item, key) => {
        const precio = parseFloat(item['precio_unitario'] ?? item['precio'] ?? 0)
        const cantidad = parseFloat(item['cantidad_pedida'] ?? item['cantidad'] ?? 0)
        const importe = (precio * cantidad).toFixed(2)
        
        return `
        <tr style="height:22px;font-size:10px;">
          <td style="width:4%;text-align:center;background-color:#ffffff;${tdBorder}">${key + 1}</td>
          <td style="width:30%;font-size:9px;background-color:#ffffff;${tdBorder}">${item['descripcion'] ?? ''}</td>
          <td style="width:8%;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['rollo'] ?? '-'}</td>
          <td style="width:10%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${cantidad.toFixed(2)}</td>
          <td style="width:8%;font-size:9px;text-align:center;background-color:#ffffff;${tdBorder}">${item['unidad_medida'] ?? item['unidad'] ?? ''}</td>
          <td style="width:10%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${precio.toFixed(2)}</td>
          <td style="width:12%;font-size:9px;text-align:right;background-color:#ffffff;padding-right:3px;${tdBorder}">${importe}</td>
        </tr>`
      })

      for (let i = 0; i < extra; i++) {
        rows.push(`
          <tr style="height:22px;">
            ${Array(7).fill(`<td style="background-color:#ffffff;${tdBorder}"></td>`).join('')}
          </tr>
        `)
      }
      return rows.join('')
    }
  }
})

app.engine('handlebars', hbs.engine)
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static('public'))
app.use(json())
app.use(cors({ origin: ORIGINS, credentials: true }))
app.use(cookieParser())
app.use(multer({ dest: 'uploads/' }).array('filenext', 20))
app.disable('x-powered-by')

app.use((req, resp, next) => {
  const token  = req.cookies.access_token
  const token2 = req.cookies.refresh_token
  req.session  = { user: null }
  if (req.url !== '/login') {
    try {
      const data  = jwt.verify(token,  SECRET_JWT_KEY)
      const data2 = jwt.verify(token2, SECRET_JWT_KEY2)
      req.session = { id: data.id, username: data.username, niv: data.niv }
      const new_token = jwt.sign(
        { id: data.id, username: data.username, niv: data.niv },
        SECRET_JWT_KEY,
        { expiresIn: '2h' }
      )
      resp.cookie('access_token', new_token, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 1000 * 60 * 60 * 2
      })
      next()
    } catch (error) {
      console.log("Errorf:" + error)
      resp.status(401).send({ ok: false, message: 'Expiro el token de session.' })
    }
  } else {
    next()
  }
})

// app.use('/public', express.static('public'))
app.use('/login', loginRouter)
app.use('/home', homeRouter)
app.use('/soporte', soporteRouter)
app.use('/directorio', directorioRouter)
app.use('/produccion', produccionRouter)
app.use('/ordenes', ordenesRouter)
app.use('/prestamos', prestamoRouter)
app.use('/productos', ProductosRouter)
app.use('/abonos', AbonoRouter)
app.use('/letras', LetrasRouter)
app.use('/reports', ReportRouter)
app.use('/cobros', COBROS_ROUTER)
app.use('/caja', CAJA_ROUTER)
app.use('/almacen', ALMACEN_ROUTER)
app.use('/proveedores', PROVEEDOR_ROUTER)
app.use('/mantenimiento', MANTENIMIENTO_ROUTER)
app.use('/servicios', SERVICIOS_ROUTER)
app.use('/proveedores', PROVEEDOR_ROUTER )
app.use('/mantenimiento', MANTENIMIENTO_ROUTER )
app.use('/gpstracker',GPS_ROUTER)
app.use('/locales',LOCAL_ROUTER)

// app.use((err,req,res,next)=>{
//   console.log("Hola hay un error")
// })

app.listen(PORT_DEFAULT, () => {
  console.log('Servidor corriendo en el puerto ' + PORT_DEFAULT)
})
