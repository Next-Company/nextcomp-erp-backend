import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';
// export const connection = await mysql.createConnection({
export const connection = await mysql.createPool({
  // host: '192.168.18.20',
  // host: '172.29.160.1',
  host: '192.168.0.171',
  // host: 'localhost',
  port: '3306',
  user: 'ubuntu',
  // user: 'root',
  password: '',
  database: 'bd_next',
});
export const jwt = jwt_