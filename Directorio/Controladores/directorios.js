import fs from 'node:fs/promises'
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
const __dirname = '/home/juanv/compartido';

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
}