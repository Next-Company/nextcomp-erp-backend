// [staging 2026-07-02] Puerto / JWT / CORS por entorno.
//   Solo cuando NODE_ENV==='staging' se toman de .env.staging; en cualquier otro caso
//   quedan EXACTAMENTE los valores originales de siempre (fallback). Producción intacta.
const isStaging = process.env.NODE_ENV === 'staging'

export const PORT_DEFAULT = isStaging && process.env.PORT ? Number(process.env.PORT) : 4001
export const SECRET_JWT_KEY = isStaging && process.env.JWT_SECRET ? process.env.JWT_SECRET : 'info_fdasdf_234%%$_privda_1988128__sdf'
export const SECRET_JWT_KEY2 = isStaging && process.env.JWT_SECRET2 ? process.env.JWT_SECRET2 : 'info_fdasdf_234%%$_privda_1988128__qqq'
// export const ORIGINS = ['http://localhost:5173','http://192.168.18.20:5173']
export const ORIGINS = isStaging && process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://192.168.0.171:5173', 'http://192.168.137.1:5173', 'http://192.168.43.242:5173', 'http://192.168.18.20:5173', 'http://192.168.18.20:5174', 'http://localhost:5174']