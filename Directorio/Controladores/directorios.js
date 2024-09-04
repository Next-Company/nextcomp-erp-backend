import { mkdir, rmdir } from 'node:fs';
import fs from 'node:fs/promises'
import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const __dirname = '/home/juanv/compartido';
// const __dirname = '/home/juanjhonv/compartido';

async function getDirectoryInfo(dirPath) {
  try {
    // Leer el contenido del directorio
    const files = await fs.readdir(dirPath);

    // Obtener información detallada de cada archivo o subdirectorio
    const fileInfos = await Promise.all(files.map(async (file) => {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);
      return {
        name: file,
        dirpath: dirPath,
        path: filePath,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        createdAt: stats.birthtime,
        updatedAt: stats.mtime,
      };
    }));

    return fileInfos;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
}

export class DirectorioController {
  static getAll = async (req, resp) => {
    try {
      const info = await getDirectoryInfo(__dirname)
      resp.json(info)
    } catch (err) {
      console.error('No se pudo listar el directorio:', err);
    }
  }
  static uploadFile = async (req, resp) => {
    const hex = req.params.path.toString();//force conversion
    let str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    try {
      const oldPath = req.file.path;
      const newPath = path.join(str, req.file.originalname);
      console.log(oldPath, '-', newPath)
      await fs.rename(oldPath, newPath);
      resp.json({ message: 'Archivo subido de forma satisfactoria' })
    } catch (error) {
      resp.json(error)
    }
  }
  static removeElement = async (req, resp) => {
    const hex = req.params.file.toString();
    let str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    const filePath = str;
    let isDirectory = req.body.tipo
    // console.log('Aca estamod:', filePath, isDirectory)
    if (parseInt(isDirectory)) {
      rmdir(filePath,
        (err) => {
          if (err) {
            return console.error(err);
          }
          resp.json({ ok: true, message: 'Carpeta eliminada correctamente' })
        }
      )
      // resp.json({ ok: true, message: 'Carpeta eliminada correctamentes' })
    } else {
      fs.unlink(filePath)
        .then(() => {
          resp.json({ ok: true, message: 'Archivo eliminado con exito' })
        })
        .catch((err) => {
          resp.json({ ok: false, message: 'Error al eliminar el archivo' })
        })
      // fs.unlink(filePath, (err) => {
      //   if (err) {
      //     console.error(err);
      //     return resp.status(500).send('Error al eliminar el archivo');
      //   }
      //   console.log("Archivo eliminado")
      // });
    }
    // resp.json({ message: 'Archivo eliminado con exito' })
  }
  static deleteFile = async (req, resp) => {
    const hex = req.params.file.toString();//force conversion
    let str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    // const file_ = req.params.file
    // const filePath = path.join(__dirname, 'uploads', req.params);
    // const filePath = path.join(file_);
    const filePath = str;

    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(err);
        return resp.status(500).send('Error al eliminar el archivo');
      }
      resp.json({ message: 'Archivo eliminado con éxito' });
    });
    // resp.json({message:'Archivo eliminado'})
  }
  static getPath = async (req, resp) => {
    const hex = req.params.path.toString();//force conversion
    let str = '';
    for (var i = 0; i < hex.length; i += 2)
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    console.log(str)
    // resp.json([]);
    try {
      const info = await getDirectoryInfo(str)
      console.log(info)
      resp.json(info)
    } catch (err) {
      console.error('No se pudo listar el directorio:', err);
    }
    // console.log(req.params)
    // return []
  }
  static createFolder = async (req, resp) => {
    const nombre = req.body.name
    const ruta = req.body.path
    let str = '';
    // const path = ''
    // console.log(path.join(__dirname, 'Juegos'))
    if (ruta !== '/') {
      // console.log('hola')
      const hex = ruta.toString();
      for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    } else {
      // console.log('adios')
      str = __dirname
    }
    // console.log('Otro datos de creacion :', nombre, path.join(str, nombre))

    mkdir(path.join(__dirname, nombre),
      (err) => {
        if (err) {
          return console.error(err);
        }
        resp.json({ ok: true, message: 'Carpeta creada correctamente' })
      });

    // const hex = req.params.path.toString();
    // let str = '';
    // for (var i = 0; i < hex.length; i += 2)
    //   str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    // console.log(str)
    // try {
    //   resp.json({ ok: true, message: 'Carpeta creada correctamente' })
    // } catch (err) {
    //   console.error('No se pudo listar el directorio:', err);
    // }
  }
}