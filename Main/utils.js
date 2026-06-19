import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';

const _host = process.env.DB_HOST
const _port = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
const _user = process.env.DB_USER
const _pass = process.env.DB_PASS
const _name = process.env.DB_NAME

export const configs = [
  {
    host: _host,
    port: _port,
    user: _user,
    password: _pass,
    database: _name,
  },
  {
    host: _host,
    port: _port,
    user: _user,
    password: _pass,
    database: _name,
  }
]

export const numControlBarcode = (codbar = null)=>{
    // INSTRUCTIONS
    // 1.Sumamos todos los dígitos que ocupan las posiciones pares: 8+1+5+4+1+5 = 24 (pares)
    // 2.Sumamos todos los digitos que ocupan las posiciones impares: 4+2+8+5+2+4 = 25 (impares)
    // 3.Multiplicamos por 3 el valor obtenido en la suma de los dígitos impares: 25*3 = 75
    // 4.Sumamos al valor obtenido anteriormente,  la suma de los numeros pares: 24+ 75 = 99
    // 5.Redondeamos el valor obtenido a la decena inmediatamante superior, en este caso 100
    // 6.El dígito de control es el valor obtenido del redondeo de decenas menos la suma total del punto 4: 100 – 99 = 1
    // '7750243042963'
    let weightflag = true;
    let sum_imp = 0;
    let sum_par = 0;
    let sum = 0;
    for (let $i = codbar.length - 1; $i >= 0; $i--)
    {
        sum += parseInt(codbar[$i]) * (weightflag ? 3 : 1);
        weightflag = !weightflag;
    }
    codbar += (10 - (sum % 10)) % 10;
    return codbar;
}

export const connection = mysql.createPool(configs[0]);
export const jwt = jwt_
