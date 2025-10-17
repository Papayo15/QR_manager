/**
 * Módulo para mapear parámetros de las apps móviles a formato interno del backend
 *
 * Las apps envían: { houseNumber, condominio }
 * El backend necesita: { sheetId, sheetName, casa }
 */

/**
 * Obtiene el SPREADSHEET_ID desde las variables de entorno
 * @returns {string} - ID del spreadsheet de Google Sheets
 * @throws {Error} - Si no está configurado SPREADSHEET_ID
 */
function getSpreadsheetId() {
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    throw new Error('SPREADSHEET_ID no está configurado en las variables de entorno');
  }

  return spreadsheetId;
}

/**
 * Genera el nombre de la hoja basado en el número de casa y condominio
 * @param {number} houseNumber - Número de casa (1-100)
 * @param {string} condominio - Nombre del condominio
 * @returns {string} - Nombre de la hoja (ej: "Registros_Casa_25")
 */
function getSheetName(houseNumber, condominio) {
  // Validar que houseNumber sea un número válido
  const house = parseInt(houseNumber, 10);
  if (isNaN(house) || house < 1 || house > 100) {
    throw new Error(`Número de casa inválido: ${houseNumber}. Debe estar entre 1 y 100.`);
  }

  // Validar que condominio no esté vacío
  if (!condominio || typeof condominio !== 'string') {
    throw new Error('Condominio es requerido y debe ser un string');
  }

  // Formato: Registros_Casa_{numero}
  return `Registros_Casa_${house}`;
}

/**
 * Mapea los parámetros de la app al formato interno del backend
 * @param {Object} appParams - Parámetros enviados por la app
 * @param {number} appParams.houseNumber - Número de casa
 * @param {string} appParams.condominio - Nombre del condominio
 * @returns {Object} - Objeto con sheetId, sheetName, y casa
 * @throws {Error} - Si faltan parámetros o son inválidos
 */
function mapAppParamsToBackend(appParams) {
  const { houseNumber, condominio } = appParams;

  // Validar que los parámetros existan
  if (!houseNumber || !condominio) {
    throw new Error('Se requieren houseNumber y condominio');
  }

  try {
    const sheetId = getSpreadsheetId();
    const sheetName = getSheetName(houseNumber, condominio);
    const casa = houseNumber.toString();

    console.log(`🔄 Mapeando: Casa ${houseNumber} (${condominio}) → ${sheetName}`);

    return {
      sheetId,
      sheetName,
      casa,
      condominio
    };
  } catch (error) {
    console.error('❌ Error en mapAppParamsToBackend:', error.message);
    throw error;
  }
}

/**
 * Genera un código QR aleatorio de 6 caracteres alfanuméricos
 * @returns {string} - Código QR generado (ej: "A3B7K9")
 */
function generateQRCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Obtiene la fecha y hora actual en formato local
 * @returns {Object} - Objeto con fecha, hora, mes, y año
 */
function getCurrentDateTime() {
  const now = new Date();

  // Formato: DD/MM/YYYY
  const fecha = now.toLocaleDateString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Formato: HH:MM
  const hora = now.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const mes = now.toLocaleDateString('es-MX', { month: 'long' });
  const año = now.getFullYear().toString();

  return { fecha, hora, mes, año };
}

module.exports = {
  getSpreadsheetId,
  getSheetName,
  mapAppParamsToBackend,
  generateQRCode,
  getCurrentDateTime
};
