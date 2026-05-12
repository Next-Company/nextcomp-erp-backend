export const PORT_DEFAULT = 4002
export const SECRET_JWT_KEY = 'info_fdasdf_234%%$_privda_1988128__sdf'
export const SECRET_JWT_KEY2 = 'info_fdasdf_234%%$_privda_1988128__qqq'
export const ORIGINS = (origin, callback) => {
  const allowed = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://192.168.18.20:5173',
    'http://192.168.18.20:5174',
    'http://192.168.0.171:5173',
    'https://nextcompanysac.com',
    'https://dev.nextcompanysac.com',
  ]
  if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.nextcompanysac.com')) {
    callback(null, true)
  } else {
    callback(new Error('Not allowed by CORS'))
  }
}
