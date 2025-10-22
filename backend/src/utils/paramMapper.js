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
 * Genera el nombre de la hoja basado en el condominio
 * @param {number|string} houseNumber - Número de casa (1-100) o "administración" (para validación)
 * @param {string} condominio - Nombre del condominio
 * @returns {string} - Nombre de la hoja (ej: "Registros_Unica")
 */
function getSheetName(houseNumber, condominio) {
  // Validar que condominio no esté vacío
  if (!condominio || typeof condominio !== 'string') {
    throw new Error('Condominio es requerido y debe ser un string');
  }

  // Validar houseNumber
  const houseStr = houseNumber.toString().toLowerCase();
  const isAdmin = (houseStr === 'administración' || houseStr === 'administracion' || houseStr === 'admin');

  if (!isAdmin) {
    const house = parseInt(houseNumber, 10);
    if (isNaN(house) || house < 1 || house > 100) {
      throw new Error(`Número de casa inválido: ${houseNumber}. Debe estar entre 1 y 100, o "administración".`);
    }
  }

  // Formato: Registros_{Condominio}
  // Normalizar nombre del condominio (capitalizar primera letra)
  const condominioNormalizado = condominio.charAt(0).toUpperCase() + condominio.slice(1).toLowerCase();
  return `Registros_${condominioNormalizado}`;
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
 * Obtiene la fecha y hora actual en formato local de México
 * @returns {Object} - Objeto con fecha, hora, mes, y año en zona horaria de México
 */
function getCurrentDateTime() {
  // Obtener fecha/hora UTC y convertir a México (UTC-6)
  const now = new Date();
  const utcTime = now.getTime();
  const mexicoOffset = -6 * 60 * 60 * 1000; // -6 horas en milisegundos
  const mexicoTime = new Date(utcTime + mexicoOffset);

  // Extraer componentes de fecha
  const dia = mexicoTime.getUTCDate().toString().padStart(2, '0');
  const mesNum = (mexicoTime.getUTCMonth() + 1).toString().padStart(2, '0');
  const año = mexicoTime.getUTCFullYear().toString();

  // Formato: DD/MM/YYYY
  const fecha = `${dia}/${mesNum}/${año}`;

  // Extraer componentes de hora
  const horas = mexicoTime.getUTCHours().toString().padStart(2, '0');
  const minutos = mexicoTime.getUTCMinutes().toString().padStart(2, '0');

  // Formato: HH:MM (24 horas)
  const hora = `${horas}:${minutos}`;

  // Obtener nombre del mes en español
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mes = meses[mexicoTime.getUTCMonth()];

  return { fecha, hora, mes, año };
}

module.exports = {
  getSpreadsheetId,
  getSheetName,
  mapAppParamsToBackend,
  generateQRCode,
  getCurrentDateTime
};
