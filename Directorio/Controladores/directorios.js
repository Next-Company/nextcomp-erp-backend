import fs from 'node:fs/promises'
import path from 'node:path';
// import { fileURLToPath } from 'node:url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// const __dirname = '/home/juanv/compartido';
const __dirname = '/home/juanjhonv/compartido';

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

export class DirectorioController{
  static getAll = async (req,resp)=>{
    try {
      const info = await getDirectoryInfo(__dirname)
      resp.json(info)
    } catch (err) {
      console.error('No se pudo listar el directorio:', err);
    }
  }
  static uploadFile = async (req,resp)=>{
    const hex = req.params.path.toString();//force conversion
    let str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    try {
      const oldPath = req.file.path;
      const newPath = path.join(str,req.file.originalname);
      console.log(oldPath,'-',newPath)
      await fs.rename(oldPath, newPath);
      resp.json({message:'Archivo subido de forma satisfactoria'})
    } catch (error) {
      resp.json(error)
    }
  }
  static deleteFile = async (req,resp)=>{
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
      resp.json({message:'Archivo eliminado con éxito'});
    });
    // resp.json({message:'Archivo eliminado'})
  }
  static getPath = async (req,resp)=>{
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
}