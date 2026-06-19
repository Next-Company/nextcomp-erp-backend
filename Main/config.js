const REQUIRED_ENV = ['JWT_SECRET', 'JWT_SECRET2', 'DB_HOST', 'DB_USER', 'DB_PASS', 'DB_NAME', 'PORT'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[FATAL] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export const PORT_DEFAULT = Number(process.env.PORT)
export const SECRET_JWT_KEY = process.env.JWT_SECRET
export const SECRET_JWT_KEY2 = process.env.JWT_SECRET2
export const ORIGINS = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : []
export const EMPRESA_RUC = process.env.EMPRESA_RUC ?? '20522094120'
