const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

// Configuración de CORS
app.use(cors({
  origin: 'http://localhost:3001', // Cambia esto al dominio de tu frontend
  credentials: true
}));

// Middleware para agregar una cookie a todas las respuestas
app.use((req, res, next) => {
  res.cookie('defaultCookie', 'defaultValue', {
    maxAge: 1000 * 60 * 60 * 24, // 1 día en milisegundos
    httpOnly: true, // La cookie no puede ser accedida mediante JavaScript en el navegador
    secure: process.env.NODE_ENV === 'production' // Enviar la cookie solo sobre HTTPS en producción
  });
  next();
});

// Middleware para validar la presencia de la cookie access_token
app.use((req, res, next) => {
  const token = req.cookies.access_token;
  if (!token) {
    return res.status(401).json({ error: 'Access token is missing' });
  }
  // Aquí puedes agregar más lógica para validar el token si es necesario
  next();
});

// Middleware para parsear cookies
const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Rutas de la aplicación
app.get('/', (req, res) => {
  res.send('Respuesta con cookie por defecto y validación de access_token');
});

app.get('/otra-ruta', (req, res) => {
  res.send('Otra respuesta con cookie por defecto y validación de access_token');
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});
