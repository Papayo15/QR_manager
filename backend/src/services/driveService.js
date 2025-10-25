const { google } = require('googleapis');
const { getOAuthClient } = require('../config/googleConfig');

/**
 * Servicio para manejar operaciones de Google Drive
 * Usado para subir fotos de identificaciones (INE) de trabajadores
 * Usa OAuth 2.0 para subir a la cuenta de Google Drive del usuario autorizado
 */
class DriveService {
  /**
   * Sube una imagen en base64 a Google Drive
   * @param {string} base64Image - Imagen en formato base64
   * @param {string} fileName - Nombre del archivo (ej: "INE_Casa_25_20241016.jpg")
   * @returns {Promise<string>} - URL pública de la imagen en Drive
   */
  async uploadImage(base64Image, fileName) {
    try {
      console.log(`📤 Subiendo imagen a Drive: ${fileName}`);

      // Validar que existe DRIVE_FOLDER_ID
      const folderId = process.env.DRIVE_FOLDER_ID;
      if (!folderId) {
        throw new Error('DRIVE_FOLDER_ID no está configurado en las variables de entorno');
      }

      // Obtener cliente OAuth autenticado
      const auth = getOAuthClient();
      const drive = google.drive({ version: 'v3', auth });

      // Convertir base64 a buffer
      const imageBuffer = Buffer.from(base64Image, 'base64');

      // Metadata del archivo
      const fileMetadata = {
        name: fileName,
        parents: [folderId] // Carpeta donde se guardará
      };

      // Media del archivo
      const media = {
        mimeType: 'image/jpeg',
        body: require('stream').Readable.from(imageBuffer)
      };

      // Subir archivo
      const file = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      console.log(`✅ Imagen subida exitosamente. ID: ${file.data.id}`);

      // Hacer el archivo público (opcional - solo si quieres que sea accesible sin autenticación)
      await drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      // Generar URL pública de visualización
      const publicUrl = `https://drive.google.com/file/d/${file.data.id}/view`;

      console.log(`🔗 URL pública: ${publicUrl}`);
      return publicUrl;

    } catch (error) {
      console.error(`❌ Error al subir imagen a Drive:`, error.message);
      throw new Error(`No se pudo subir la imagen a Drive: ${error.message}`);
    }
  }

  /**
   * Genera un nombre de archivo único para una foto de trabajador
   * @param {Object} params - Parámetros del trabajador
   * @param {string} params.condominio - Nombre del condominio
   * @param {string} params.nombreTrabajador - Nombre del trabajador
   * @param {string} params.tipoTrabajador - Tipo de trabajador
   * @param {string} params.casa - Número de casa
   * @param {string} params.fecha - Fecha en formato DD/MM/YYYY
   * @param {string} params.hora - Hora en formato HH:MM:SS
   * @returns {string} - Nombre del archivo
   */
  generateFileName({ condominio, nombreTrabajador, tipoTrabajador, casa, fecha, hora }) {
    // Sanitizar cada campo (remover espacios y caracteres especiales)
    const sanitizeField = (field) => field.replace(/[^a-zA-Z0-9]/g, '_');

    const condominioClean = sanitizeField(condominio);
    const nombreClean = sanitizeField(nombreTrabajador);
    const tipoClean = sanitizeField(tipoTrabajador);
    const casaClean = sanitizeField(casa.toString());
    const fechaClean = sanitizeField(fecha);
    const horaClean = sanitizeField(hora);

    // Formato: Condominio_NombreTrabajador_Tipo_Casa_Fecha_Hora.jpg
    return `${condominioClean}_${nombreClean}_${tipoClean}_Casa${casaClean}_${fechaClean}_${horaClean}.jpg`;
  }

  /**
   * Elimina una imagen de Google Drive (opcional - para limpieza)
   * @param {string} fileId - ID del archivo en Drive
   */
  async deleteImage(fileId) {
    try {
      console.log(`🗑️  Eliminando imagen de Drive: ${fileId}`);

      const auth = getOAuthClient();
      const drive = google.drive({ version: 'v3', auth });

      await drive.files.delete({
        fileId: fileId
      });

      console.log(`✅ Imagen eliminada exitosamente`);
      return { success: true };

    } catch (error) {
      console.error(`❌ Error al eliminar imagen de Drive:`, error.message);
      throw new Error(`No se pudo eliminar la imagen: ${error.message}`);
    }
  }

  /**
   * Lista todas las imágenes en la carpeta de Drive
   * @returns {Promise<Array>} - Lista de archivos
   */
  async listImages() {
    try {
      const folderId = process.env.DRIVE_FOLDER_ID;
      if (!folderId) {
        throw new Error('DRIVE_FOLDER_ID no está configurado');
      }

      const auth = getOAuthClient();
      const drive = google.drive({ version: 'v3', auth });

      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(id, name, webViewLink, createdTime, size)',
        orderBy: 'createdTime desc'
      });

      console.log(`📋 Encontradas ${response.data.files.length} imágenes en Drive`);
      return response.data.files;

    } catch (error) {
      console.error(`❌ Error al listar imágenes:`, error.message);
      throw new Error(`No se pudo listar las imágenes: ${error.message}`);
    }
  }
}

module.exports = new DriveService();
