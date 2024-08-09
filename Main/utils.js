import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';
export const connection = await mysql.createConnection({
  // host: '172.29.160.1',
  host: '192.168.18.20',
  port: '3306',
  user: 'ubuntu',
  password: '',
  database: 'bd_next',
});
export const jwt = jwt_