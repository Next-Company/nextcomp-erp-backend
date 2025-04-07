import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';

export const configs = [
  {
    // host: '192.168.18.20',
    host: '192.168.0.171',
    port: '3306',
    user: 'ubuntu',
    password: '',
    database: 'bd_next',
  },
  {
    // host: '192.168.18.20',
    // host: '192.168.0.171',
    // port: '3306',
    // user: 'ubuntu',
    // password: '',
    // database: 'bd_next',
    // host: 'jsjfact.com',
    // port: '3306',
    // user: 'facturador_seguro',
    // password: 'JSJ@1984+-+',
    // database: 'BD_FACTURADOR',
    // connectionLimit: 30,
    // waitForConnections: true, 
    // queueLimit: 0, 
    // enableKeepAlive: true

    host: 'jsjfact.com',
    port: '3306',
    user: 'facturador_seguro',
    password: 'JSJ@1984+-+',
    database: 'BD_FACTURADOR',
    // waitForConnections: true,
    // connectionLimit: 10,
    // maxIdle: 10,
    // idleTimeout: 60000,
    // queueLimit: 0,
    // enableKeepAlive: false,
    // keepAliveInitialDelay: 0,
  }
]
// export const connection = await mysql.createConnection({
// export const connection = await mysql.createPool({
//   host: '192.168.18.20',
//   // host: '192.168.0.171',
//   port: '3306',
//   user: 'ubuntu',
//   password: '',
//   database: 'bd_next',
// });
export const connection = mysql.createPool(configs[0]);
// export const conn_jsjfact = mysql.createPool(configs[1]);
export const jwt = jwt_