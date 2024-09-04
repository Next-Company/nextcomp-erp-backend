import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';
// export const connection = await mysql.createConnection({
export const connection = await mysql.createPool({
  // host: '192.168.18.20',
  host: '192.168.0.171',
  port: '3306',
  user: 'ubuntu',
  password: '',
  database: 'bd_next',
});
export const jwt = jwt_