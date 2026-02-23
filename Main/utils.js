import mysql from "mysql2/promise";
import jwt_ from 'jsonwebtoken';

export const configs = [
  {
    host: '192.168.18.20',
    // host: '192.168.0.171',
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


    // host: '192.168.18.20',
    // port: '3306',
    // user: 'ubuntu',
    // password: '',
    // database: 'bd_next',

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
    // Weight for a digit in the checksum is 3, 1, 3.. starting from the last digit. 
    // loop backwards to make the loop length-agnostic. The same basic functionality 
    // will work for codes of different lengths.
    // echo $codbar;
    for (let $i = codbar.lenght - 1; $i >= 0; $i--)
    {
        sum += intval(codbar[$i]) * (weightflag ? 3 : 1);
        weightflag = !weightflag;
    //   $sum += (int)$codbar[$i] * ($weightflag?3:1);
    //   $weightflag = !$weightflag;
    }
    codbar += (10 - (sum % 10)) % 10;
    return codbar;
}

export const connection = mysql.createPool(configs[0]);
// export const conn_jsjfact = mysql.createPool(configs[1]);
export const jwt = jwt_