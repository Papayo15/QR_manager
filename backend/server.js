require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Logger
const logger = {
  info: (msg, data) => console.log(`[INFO] ${msg}`, data || ''),
  error: (msg, error) => console.error(`[ERROR] ${msg}`, error || '')
};

// Configurar Google Auth
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file'
  ],
});

const sheets = google.sheets({ version: 'v4', auth });
const drive = google.drive({ version: 'v3', auth });

// Ruta de salud
app.get('/health', (req, res) => {
  logger.info('Health check');
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'QR Manager Backend'
  });
});

// ============================================
// ENDPOINTS PARA RESIDENTE APP
// ============================================

// Registrar código QR generado por residente
app.post('/api/register-code', async (req, res) => {
  try {
    const { 
      sheetId, 
      tipo, 
      codigo, 
      visitante, 
      residente, 
      casa, 
      fecha, 
      hora, 
      resultado,
      fecha_expiracion 
    } = req.body;

    logger.info('Registrando código QR', { codigo, visitante, casa });

    if (!codigo || !visitante || !casa) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos obligatorios: codigo, visitante, casa' 
      });
    }

    const values = [
      tipo || 'CODIGO_QR',
      codigo,
      visitante,
      residente,
      casa,
      fecha,
      hora,
      resultado || 'ACTIVO',
      '', // trabajador (vacío para códigos QR)
      '', // tipo_servicio (vacío para códigos QR)
      '', // placa (vacío para códigos QR)
      '', // empresa (vacío para códigos QR)
      '', // foto_url (vacío para códigos QR)
      '', // validador (se llenará al validar)
      fecha_expiracion || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:O',
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    logger.info('Código QR guardado exitosamente', { codigo });
    res.json({ 
      success: true, 
      message: 'Código QR guardado exitosamente',
      codigo: codigo
    });
  } catch (error) {
    logger.error('Error registrando código', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al guardar el código',
      error: error.message 
    });
  }
});

// ============================================
// ENDPOINTS PARA VIGILANCIA APP
// ============================================

// Obtener contadores
app.get('/api/counters', async (req, res) => {
  try {
    const { sheetId } = req.query;
    logger.info('Obteniendo contadores');

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:O',
    });

    const rows = response.data.values || [];
    const today = new Date().toLocaleDateString('es-MX');
    
    let generados = 0;
    let validados = 0;
    let negados = 0;

    rows.forEach(row => {
      const fecha = row[5]; // Columna de fecha
      const resultado = row[7]; // Columna de resultado
      const tipo = row[0]; // Columna de tipo

      if (fecha === today) {
        if (tipo === 'CODIGO_QR') {
          generados++;
        }
        if (tipo === 'VALIDACION') {
          if (resultado === 'VALIDADO') {
            validados++;
          } else {
            negados++;
          }
        }
      }
    });

    res.json({ generados, validados, negados });
  } catch (error) {
    logger.error('Error obteniendo contadores', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Validar código QR
app.post('/api/validate-qr', async (req, res) => {
  try {
    const { sheetId, codigo } = req.body;
    logger.info('Validando código', { codigo });

    if (!codigo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Código requerido' 
      });
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:O',
    });

    const rows = response.data.values || [];
    const now = new Date();
    
    // Buscar el código en el sheet
    for (let i = 1; i < rows.length; i++) { // Empezar en 1 para saltar el header
      const row = rows[i];
      const rowCodigo = row[1]; // Columna B: codigo
      const rowTipo = row[0]; // Columna A: tipo
      const rowResultado = row[7]; // Columna H: resultado
      const rowFechaExpiracion = row[14]; // Columna O: fecha_expiracion

      if (rowCodigo === codigo && rowTipo === 'CODIGO_QR') {
        // Código encontrado, verificar estado
        
        // 1. Verificar si ya fue usado
        if (rowResultado === 'VALIDADO' || rowResultado === 'USADO') {
          logger.info('Código ya utilizado', { codigo });
          return res.json({
            status: 'USADO',
            message: 'Este código ya fue utilizado anteriormente',
            fechaUso: row[5] + ' ' + row[6] // fecha + hora
          });
        }

        // 2. Verificar expiración (24 horas)
        if (rowFechaExpiracion) {
          const expiracion = new Date(rowFechaExpiracion);
          if (now > expiracion) {
            logger.info('Código expirado', { codigo });
            return res.json({
              status: 'EXPIRADO',
              message: 'Este código ha expirado (más de 24 horas)',
              fechaGeneracion: row[5] + ' ' + row[6]
            });
          }
        }

        // 3. Código válido
        logger.info('Código válido', { codigo });
        return res.json({
          status: 'VALIDADO',
          nombre: row[2], // visitante
          casa: row[4], // casa
          residente: row[3], // residente
          horario: '', // No aplica para códigos QR
          fechaGeneracion: row[5] + ' ' + row[6]
        });
      }
    }

    // Código no encontrado
    logger.info('Código no encontrado', { codigo });
    res.json({
      status: 'NO_ENCONTRADO',
      message: 'Código QR no encontrado en el sistema'
    });

  } catch (error) {
    logger.error('Error validando código', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al validar el código',
      error: error.message 
    });
  }
});

// Registrar validación
app.post('/api/log-validation', async (req, res) => {
  try {
    const { 
      sheetId, 
      tipo, 
      codigo, 
      resultado, 
      fecha, 
      hora, 
      validador,
      visitante,
      casa 
    } = req.body;

    logger.info('Registrando validación', { codigo, resultado });

    const values = [
      tipo || 'VALIDACION',
      codigo,
      visitante || '',
      '', // residente (vacío para validaciones)
      casa || '',
      fecha,
      hora,
      resultado,
      '', // trabajador
      '', // tipo_servicio
      '', // placa
      '', // empresa
      '', // foto_url
      validador || 'Vigilancia',
      '' // fecha_expiracion
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:O',
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    // Actualizar el estado del código original a VALIDADO
    if (resultado === 'VALIDADO') {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A:O',
      });

      const rows = response.data.values || [];
      
      for (let i = 1; i < rows.length; i++) {
        if (rows[i][1] === codigo && rows[i][0] === 'CODIGO_QR') {
          // Actualizar la fila del código original
          await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range: `H${i + 1}`, // Columna H (resultado)
            valueInputOption: 'RAW',
            resource: { values: [['VALIDADO']] },
          });
          break;
        }
      }
    }

    logger.info('Validación registrada exitosamente');
    res.json({ 
      success: true, 
      message: 'Validación registrada' 
    });
  } catch (error) {
    logger.error('Error registrando validación', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Registrar trabajador
app.post('/api/register-worker', async (req, res) => {
  try {
    const { 
      sheetId, 
      tipo, 
      trabajador, 
      tipo_servicio, 
      casa, 
      placa, 
      empresa, 
      foto_url, 
      fecha, 
      hora, 
      resultado 
    } = req.body;

    logger.info('Registrando trabajador', { trabajador, casa });

    const values = [
      tipo || 'TRABAJADOR',
      '', // codigo (vacío para trabajadores)
      '', // visitante (vacío para trabajadores)
      '', // residente (vacío para trabajadores)
      casa,
      fecha,
      hora,
      resultado || 'ACTIVO',
      trabajador,
      tipo_servicio,
      placa || 'N/A',
      empresa || 'N/A',
      foto_url || '',
      'Vigilancia', // validador
      '' // fecha_expiracion (no aplica para trabajadores)
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:O',
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    logger.info('Trabajador registrado exitosamente');
    res.json({ 
      success: true, 
      message: 'Trabajador registrado exitosamente' 
    });
  } catch (error) {
    logger.error('Error registrando trabajador', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// ENDPOINTS PARA SUBIR FOTOS
// ============================================

const upload = multer({ storage: multer.memoryStorage() });

// Subir foto a Drive
app.post('/api/upload-photo', upload.single('file'), async (req, res) => {
  try {
    const { nombre, folderId } = req.body;
    logger.info('Subiendo foto', { nombre });

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No se proporcionó archivo' 
      });
    }

    const timestamp = Date.now();
    const fileName = `INE_${nombre.replace(/\s/g, '_')}_${timestamp}.jpg`;
    
    const fileMetadata = {
      name: fileName,
      parents: [folderId || process.env.DRIVE_FOLDER_ID],
    };
    
    const media = {
      mimeType: req.file.mimetype,
      body: require('stream').Readable.from(req.file.buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    // Hacer público el archivo
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    logger.info('Foto subida exitosamente', { fileName, fileId: file.data.id });
    res.json({
      success: true,
      fileUrl: file.data.webViewLink,
      fileId: file.data.id
    });
  } catch (error) {
    logger.error('Error subiendo foto', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ============================================
// ENDPOINTS LEGACY (Mantener compatibilidad)
// ============================================

// Guardar en Google Sheets (legacy)
app.post('/api/sheets/save', async (req, res) => {
  try {
    const { sheetId, data } = req.body;
    logger.info('Guardando en sheet (legacy)', { sheetId, data });

    const values = [
      data.tipo || 'CODIGO_QR',
      data.codigo || '',
      data.visitante || '',
      data.residente || '',
      data.casa || '',
      data.fecha || '',
      data.hora || '',
      data.resultado || 'ACTIVO',
      data.trabajador || '',
      data.tipo_servicio || '',
      data.placa || '',
      data.empresa || '',
      data.foto_url || '',
      data.validador || '',
      data.fecha_expiracion || ''
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:O',
      valueInputOption: 'RAW',
      resource: { values: [values] },
    });

    logger.info('Guardado exitoso (legacy)');
    res.json({ success: true, message: 'Datos guardados' });
  } catch (error) {
    logger.error('Error guardando (legacy)', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Validar código QR (legacy)
app.post('/api/sheets/validate', async (req, res) => {
  try {
    const { sheetId, codigo } = req.body;
    logger.info('Validando código (legacy)', { codigo });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:O',
    });

    const rows = response.data.values || [];
    
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === codigo && rows[i][0] === 'CODIGO_QR') {
        logger.info('Código encontrado (legacy)');
        return res.json({
          success: true,
          found: true,
          data: {
            visitante: rows[i][2],
            residente: rows[i][3],
            casa: rows[i][4],
            fecha: rows[i][5],
            hora: rows[i][6]
          }
        });
      }
    }

    logger.info('Código no encontrado (legacy)');
    res.json({ success: true, found: false });
  } catch (error) {
    logger.error('Error validando (legacy)', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Subir foto a Drive (legacy)
app.post('/api/drive/upload', upload.single('photo'), async (req, res) => {
  try {
    const { nombre, casa } = req.body;
    logger.info('Subiendo foto (legacy)', { nombre, casa });

    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó foto' });
    }

    const date = new Date();
    const year = date.getFullYear().toString();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    const baseFolderId = process.env.DRIVE_FOLDER_ID;
    const yearFolderId = await getOrCreateFolder(year, baseFolderId);
    const monthFolderId = await getOrCreateFolder(month, yearFolderId);
    const dayFolderId = await getOrCreateFolder(day, monthFolderId);

    const fileName = `${Date.now()}_${nombre.replace(/\s/g, '_')}.jpg`;
    const fileMetadata = {
      name: fileName,
      parents: [dayFolderId],
    };
    const media = {
      mimeType: 'image/jpeg',
      body: require('stream').Readable.from(req.file.buffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: { role: 'reader', type: 'anyone' },
    });

    logger.info('Foto subida exitosamente (legacy)', file.data);
    res.json({
      success: true,
      url: file.data.webViewLink,
      fileId: file.data.id
    });
  } catch (error) {
    logger.error('Error subiendo foto (legacy)', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// FUNCIONES AUXILIARES
// ============================================

async function getOrCreateFolder(name, parentId) {
  try {
    const response = await drive.files.list({
      q: `name='${name}' and parents in '${parentId}' and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id)',
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    const folder = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId],
      },
      fields: 'id',
    });

    return folder.data.id;
  } catch (error) {
    logger.error('Error creando carpeta', error);
    throw error;
  }
}

// ============================================
// INICIAR SERVIDOR
// ============================================

app.listen(PORT, () => {
  logger.info(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;